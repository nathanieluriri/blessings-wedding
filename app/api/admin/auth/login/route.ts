import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminsCollection } from "@/lib/collections";
import { verifyPassword } from "@/lib/auth/password";
import {
  PENDING_2FA_COOKIE,
  SESSION_COOKIE,
  createPending2faToken,
  createSessionToken,
  pending2faCookieOptions,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const data = (body ?? {}) as Record<string, unknown>;
  const email =
    typeof data.email === "string" ? data.email.toLowerCase().trim() : "";
  const password = typeof data.password === "string" ? data.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const col = await adminsCollection();
  const admin = await col.findOne({ email });

  // Same response for unknown email vs bad password (no user enumeration).
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();

  // 2FA enabled → don't grant a session yet. Issue a short-lived pending token
  // and require a code at /api/admin/auth/2fa/verify.
  if (admin.twoFactorEnabled) {
    const pendingToken = await createPending2faToken({
      sub: admin._id!.toHexString(),
      email: admin.email,
      role: admin.role,
    });
    cookieStore.set(PENDING_2FA_COOKIE, pendingToken, pending2faCookieOptions);
    return NextResponse.json({ twoFactorRequired: true });
  }

  const token = await createSessionToken({
    sub: admin._id!.toHexString(),
    email: admin.email,
    role: admin.role,
  });
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);

  return NextResponse.json({
    ok: true,
    mustChangePassword: admin.mustChangePassword ?? false,
  });
}
