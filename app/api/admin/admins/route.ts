import { NextResponse } from "next/server";
import { adminsCollection, type AdminRole } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/email/send";
import { adminInviteEmail } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site-url";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const data = (body ?? {}) as Record<string, unknown>;
  const email =
    typeof data.email === "string" ? data.email.toLowerCase().trim() : "";
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const role: AdminRole = data.role === "root" ? "root" : "admin";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }
  if (role === "root" && admin.role !== "root") {
    return NextResponse.json(
      { error: "Only a root admin can create another root admin." },
      { status: 403 }
    );
  }

  const col = await adminsCollection();
  if (await col.findOne({ email })) {
    return NextResponse.json(
      { error: "An admin with that email already exists." },
      { status: 409 }
    );
  }

  // The system generates the temporary password and emails it to the invitee.
  // The creating admin never sees or sets it.
  const tempPassword = generateTempPassword();
  const inserted = await col.insertOne({
    email,
    passwordHash: await hashPassword(tempPassword),
    name: name || undefined,
    role,
    mustChangePassword: true,
    createdAt: new Date(),
    createdBy: admin.email,
  });

  const siteUrl = getSiteUrl();
  const { subject, html, text } = adminInviteEmail({
    tempPassword,
    loginUrl: `${siteUrl}/login/admin`,
    invitedBy: admin.name || admin.email,
  });
  const result = await sendEmail({ to: email, subject, html, text });

  if (!result.ok) {
    // Roll back so we never leave an account nobody can sign into.
    await col.deleteOne({ _id: inserted.insertedId });
    return NextResponse.json(
      {
        error:
          "Account not created — couldn't email the invite. Check email settings and try again.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
