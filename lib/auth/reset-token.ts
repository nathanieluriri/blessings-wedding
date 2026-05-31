import crypto from "node:crypto";

// Password-reset tokens: 256 bits of entropy, so a fast SHA-256 hash in the DB
// is sufficient (no bcrypt needed). Only the hash is stored; the raw token
// lives solely in the emailed link and is single-use + time-boxed.

export function generateResetToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
