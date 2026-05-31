import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "admin_session";
// Short-lived cookie issued between a correct password and a passed 2FA check.
// It grants NO access on its own — proxy.ts only honors SESSION_COOKIE.
export const PENDING_2FA_COOKIE = "admin_2fa";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const PENDING_2FA_MAX_AGE = 60 * 10; // 10 minutes

export interface SessionPayload {
  sub: string; // admin _id (hex string)
  email: string;
  role: "root" | "admin";
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "root" && payload.role !== "admin")
    ) {
      return null;
    }
    // A pending-2FA token must never be accepted as a full session.
    if (payload.twoFactorPending === true) return null;
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

// ── Pending-2FA token ──────────────────────────────────────────────────────
// Carries the same identity claims but is flagged so it can't double as a
// session. Issued after a correct password when the admin has 2FA enabled, and
// exchanged for a real session once a code is verified.

export async function createPending2faToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    twoFactorPending: true,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${PENDING_2FA_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyPending2faToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      payload.twoFactorPending !== true ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "root" && payload.role !== "admin")
    ) {
      return null;
    }
    return { sub: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

export const pending2faCookieOptions = {
  ...sessionCookieOptions,
  maxAge: PENDING_2FA_MAX_AGE,
};
