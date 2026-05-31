/**
 * Base URL of the public site, used to build absolute links inside emails
 * (admin sign-in, password reset, 2FA code, RSVP dashboard).
 *
 * `NEXT_PUBLIC_SITE_URL` is expected to be set WITHOUT a trailing slash, but we
 * strip any trailing slash(es) defensively so every caller can safely append
 * `/path` without risking a doubled slash (`https://site.com//login/admin`).
 * Falls back to localhost for local dev, mirroring `.env.example`.
 *
 * Mirrors the trailing-slash handling already used for metadata in
 * `app/layout.tsx`, `app/sitemap.ts` and `app/robots.ts`.
 */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
    "http://localhost:3000"
  );
}
