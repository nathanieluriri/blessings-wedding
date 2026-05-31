import { NextResponse } from "next/server";
import { adminsCollection, passwordResetsCollection } from "@/lib/collections";
import { hashResetToken } from "@/lib/auth/reset-token";
import { hashPassword } from "@/lib/auth/password";

// Consumes a reset token and sets a new password. Does NOT sign the user in —
// they then log in normally, which still enforces 2FA if enabled (so a reset
// can never be a 2FA bypass).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const data = (body ?? {}) as Record<string, unknown>;
  const token = typeof data.token === "string" ? data.token : "";
  const password = typeof data.password === "string" ? data.password : "";

  if (!token) {
    return NextResponse.json(
      { error: "This reset link is invalid." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const resets = await passwordResetsCollection();
  const doc = await resets.findOne({ tokenHash: hashResetToken(token) });
  if (!doc || doc.expiresAt < new Date()) {
    if (doc) await resets.deleteOne({ _id: doc._id });
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }

  const admins = await adminsCollection();
  await admins.updateOne(
    { _id: doc.adminId },
    {
      $set: { passwordHash: await hashPassword(password) },
      $unset: { mustChangePassword: "" },
    }
  );
  await resets.deleteOne({ _id: doc._id }); // single use

  return NextResponse.json({ ok: true });
}
