import { TOTP, Secret } from "otpauth";

// Standard authenticator-app TOTP (6 digits, 30s period, SHA-1 — the combo
// every app expects). Secrets are stored encrypted; see lib/auth/crypto.ts.

export const TOTP_ISSUER = "Blessings & Justice";

export function generateTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

function build(secretBase32: string, accountLabel: string): TOTP {
  return new TOTP({
    issuer: TOTP_ISSUER,
    label: accountLabel || TOTP_ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
}

/** otpauth:// URI to encode in the enrollment QR code. */
export function totpAuthUri(secretBase32: string, accountLabel: string): string {
  return build(secretBase32, accountLabel).toString();
}

/** True if `token` is valid now (±1 step tolerates 30s of clock drift). */
export function verifyTotp(secretBase32: string, token: string): boolean {
  const cleaned = token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  return build(secretBase32, "").validate({ token: cleaned, window: 1 }) !== null;
}
