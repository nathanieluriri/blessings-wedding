import crypto from "node:crypto";

// Symmetric encryption for secrets at rest (TOTP seeds). The key is derived
// from SESSION_SECRET so there's no extra env var to manage — losing
// SESSION_SECRET already invalidates every session, so coupling is acceptable.

const ALGO = "aes-256-gcm";

function key(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  // Domain-separated 32-byte key derived from the session secret.
  return crypto.createHash("sha256").update(`totp-enc:${secret}`).digest();
}

/** Returns "iv:tag:ciphertext", all base64. */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    enc.toString("base64"),
  ].join(":");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Malformed ciphertext");
  const decipher = crypto.createDecipheriv(
    ALGO,
    key(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
