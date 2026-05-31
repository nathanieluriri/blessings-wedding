import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { adminsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/email/send";
import { adminInviteEmail } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site-url";

// Regenerates a temporary password and re-emails the invite. Same rule as
// creation: the password is system-generated and emailed, never shown to the
// admin triggering it.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let _id: ObjectId;
  try {
    _id = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const col = await adminsCollection();
  const target = await col.findOne({ _id });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (admin.role !== "root" && target.createdBy !== admin.email) {
    return NextResponse.json(
      { error: "You can only resend invites for admins you created." },
      { status: 403 }
    );
  }

  const siteUrl = getSiteUrl();
  const tempPassword = generateTempPassword();
  const { subject, html, text } = adminInviteEmail({
    tempPassword,
    loginUrl: `${siteUrl}/login/admin`,
    invitedBy: admin.name || admin.email,
  });
  const result = await sendEmail({ to: target.email, subject, html, text });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Couldn't email the invite. Check email settings and retry." },
      { status: 502 }
    );
  }

  // Only rotate the password after a successful send, so a failed resend never
  // locks out an admin who still knows their current one.
  await col.updateOne(
    { _id },
    { $set: { passwordHash: await hashPassword(tempPassword), mustChangePassword: true } }
  );

  return NextResponse.json({ ok: true });
}
