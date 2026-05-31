import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Server-side temporary password for admin invites. The creating admin never
// sees or sets this — it's emailed straight to the invitee, who must change it
// on first login. Mirrors the character set the old client generator used.
const TEMP_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

export function generateTempPassword(length = 16): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += TEMP_CHARS[bytes[i] % TEMP_CHARS.length];
  return out;
}
