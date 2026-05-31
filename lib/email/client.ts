import { Resend } from "resend";

// Lazily build a single Resend client. Returns null when no API key is set so
// the app still runs locally without email (mirrors the DB fallback in
// lib/settings.ts) — callers treat a null client as "email disabled".

let cached: Resend | null | undefined;

export function getResend(): Resend | null {
  if (cached !== undefined) return cached;
  const apiKey = process.env.RESEND_API_KEY;
  cached = apiKey ? new Resend(apiKey) : null;
  if (!cached) {
    console.warn("[email] RESEND_API_KEY not set — email sending is disabled.");
  }
  return cached;
}

export function getFromAddress(): string {
  return (
    process.env.RESEND_FROM ?? "Blessings & Justice <onboarding@resend.dev>"
  );
}
