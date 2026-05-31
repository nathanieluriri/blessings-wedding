import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

// One-time recovery codes shown once at enrollment, stored bcrypt-hashed.
// Used to regain access when the authenticator app is unavailable.

const ROUNDS = 10;
// No ambiguous characters (0/o/1/l) so codes are easy to read off-screen.
const CHARS = "abcdefghijkmnpqrstuvwxyz23456789";

/** e.g. "a7bd-9fk2" — `count` codes, each 8 chars split by a dash. */
export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(8);
    let s = "";
    for (let j = 0; j < 8; j++) {
      if (j === 4) s += "-";
      s += CHARS[bytes[j] % CHARS.length];
    }
    codes.push(s);
  }
  return codes;
}

export function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((c) => bcrypt.hash(normalize(c), ROUNDS)));
}

/**
 * If `input` matches an unused code, returns the remaining hashes (the matched
 * one consumed). Returns null when no code matches.
 */
export async function consumeRecoveryCode(
  input: string,
  hashes: string[]
): Promise<string[] | null> {
  const norm = normalize(input);
  if (!norm) return null;
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(norm, hashes[i])) {
      return hashes.filter((_, idx) => idx !== i);
    }
  }
  return null;
}

function normalize(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]/g, "");
}
