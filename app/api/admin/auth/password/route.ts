import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { adminsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

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
  const currentPassword =
    typeof data.currentPassword === "string" ? data.currentPassword : "";
  const newPassword =
    typeof data.newPassword === "string" ? data.newPassword : "";

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const col = await adminsCollection();
  const doc = await col.findOne({ _id: new ObjectId(admin.id) });
  if (!doc) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await verifyPassword(currentPassword, doc.passwordHash))) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 }
    );
  }

  await col.updateOne(
    { _id: doc._id },
    {
      $set: { passwordHash: await hashPassword(newPassword) },
      $unset: { mustChangePassword: "" },
    }
  );

  return NextResponse.json({ ok: true });
}
