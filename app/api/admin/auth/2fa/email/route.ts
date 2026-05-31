import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { adminsCollection, otpChallengesCollection } from "@/lib/collections";
import {
  PENDING_2FA_COOKIE,
  verifyPending2faToken,
} from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/send";
import { loginCodeEmail } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site-url";

const EXPIRES_MINUTES = 10;

// Email-OTP fallback: when the authenticator app isn't available, send a
// 6-digit code to the admin's email. Authorized by the pending-2FA cookie.
export async function POST() {
  const cookieStore = await cookies();
  const pending = cookieStore.get(PENDING_2FA_COOKIE)?.value;
  const session = pending ? await verifyPending2faToken(pending) : null;
  if (!session) {
    return NextResponse.json(
      { error: "Your sign-in session expired. Please log in again." },
      { status: 401 }
    );
  }

  const col = await adminsCollection();
  const doc = await col.findOne({ _id: new ObjectId(session.sub) });
  if (!doc || !doc.twoFactorEnabled) {
    return NextResponse.json(
      { error: "Your sign-in session expired. Please log in again." },
      { status: 401 }
    );
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + EXPIRES_MINUTES * 60 * 1000);

  const otps = await otpChallengesCollection();
  await otps.updateOne(
    { adminId: doc._id!, purpose: "login_2fa" },
    { $set: { codeHash, expiresAt, attempts: 0, createdAt: new Date() } },
    { upsert: true }
  );

  const { subject, html, text } = loginCodeEmail({
    code,
    expiresMinutes: EXPIRES_MINUTES,
    loginUrl: `${getSiteUrl()}/login/admin`,
  });
  const result = await sendEmail({ to: doc.email, subject, html, text });
  if (!result.ok) {
    return NextResponse.json(
      { error: "Couldn't send the code. Try your authenticator app instead." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
