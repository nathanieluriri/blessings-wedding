import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

// Route gate. This only verifies the session JWT (no DB access) — every admin
// page and API handler re-checks via getCurrentAdmin() for defense in depth.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Already signed in → skip the login page.
  if (pathname === "/login/admin") {
    if (session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Protected admin area.
  if (!session) {
    const loginUrl = new URL("/login/admin", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login/admin"],
};
