import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { adminsCollection, otpChallengesCollection } from "@/lib/collections";
import {
  PENDING_2FA_COOKIE,
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifyPending2faToken,
} from "@/lib/auth/session";
import { decryptSecret } from "@/lib/auth/crypto";
import { verifyTotp } from "@/lib/auth/totp";
import { consumeRecoveryCode } from "@/lib/auth/recovery";

// Second login step. Authorized by the short-lived pending-2FA cookie (NOT a
// full session). On a correct code, the pending cookie is swapped for a real
// session cookie.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const pending = cookieStore.get(PENDING_2FA_COOKIE)?.value;
  const session = pending ? await verifyPending2faToken(pending) : null;
  if (!session) {
    return NextResponse.json(
      { error: "Your sign-in session expired. Please log in again." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const data = (body ?? {}) as Record<string, unknown>;
  const type = data.type;
  const code = (typeof data.code === "string" ? data.code : "").trim();
  if (!code) {
    return NextResponse.json({ error: "Enter your code." }, { status: 400 });
  }

  const col = await adminsCollection();
  const doc = await col.findOne({ _id: new ObjectId(session.sub) });
  if (!doc || !doc.twoFactorEnabled) {
    return NextResponse.json(
      { error: "Your sign-in session expired. Please log in again." },
      { status: 401 }
    );
  }

  let ok = false;
  if (type === "totp") {
    if (doc.totpSecretEnc) {
      try {
        ok = verifyTotp(decryptSecret(doc.totpSecretEnc), code);
      } catch {
        ok = false;
      }
    }
  } else if (type === "recovery") {
    if (doc.recoveryCodeHashes?.length) {
      const remaining = await consumeRecoveryCode(code, doc.recoveryCodeHashes);
      if (remaining) {
        ok = true;
        await col.updateOne(
          { _id: doc._id },
          { $set: { recoveryCodeHashes: remaining } }
        );
      }
    }
  } else if (type === "email") {
    const otps = await otpChallengesCollection();
    const challenge = await otps.findOne({
      adminId: doc._id!,
      purpose: "login_2fa",
    });
    if (
      challenge &&
      challenge.expiresAt > new Date() &&
      challenge.attempts < 5
    ) {
      if (await bcrypt.compare(code.replace(/\s+/g, ""), challenge.codeHash)) {
        ok = true;
        await otps.deleteOne({ _id: challenge._id });
      } else {
        await otps.updateOne({ _id: challenge._id }, { $inc: { attempts: 1 } });
      }
    }
  } else {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!ok) {
    return NextResponse.json(
      { error: "That code didn't match. Try again." },
      { status: 400 }
    );
  }

  // Promote the pending challenge to a real session.
  const token = await createSessionToken({
    sub: doc._id!.toHexString(),
    email: doc.email,
    role: doc.role,
  });
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
  cookieStore.delete(PENDING_2FA_COOKIE);

  return NextResponse.json({
    ok: true,
    mustChangePassword: doc.mustChangePassword ?? false,
  });
}
