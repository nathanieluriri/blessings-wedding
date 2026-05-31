import { NextResponse } from "next/server";
import { adminsCollection, passwordResetsCollection } from "@/lib/collections";
import { generateResetToken } from "@/lib/auth/reset-token";
import { sendEmail } from "@/lib/email/send";
import { passwordResetEmail } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site-url";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EXPIRES_MINUTES = 45;

// Always responds the same way regardless of whether the email exists, so it
// can't be used to discover which addresses are admins.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email =
    typeof (body as Record<string, unknown>)?.email === "string"
      ? ((body as Record<string, unknown>).email as string)
          .toLowerCase()
          .trim()
      : "";

  if (EMAIL_RE.test(email)) {
    const admins = await adminsCollection();
    const admin = await admins.findOne({ email });
    if (admin) {
      const { token, tokenHash } = generateResetToken();
      const resets = await passwordResetsCollection();
      await resets.insertOne({
        adminId: admin._id!,
        tokenHash,
        expiresAt: new Date(Date.now() + EXPIRES_MINUTES * 60 * 1000),
        createdAt: new Date(),
      });

      const siteUrl = getSiteUrl();
      const { subject, html, text } = passwordResetEmail({
        resetUrl: `${siteUrl}/login/admin/reset?token=${token}`,
        expiresMinutes: EXPIRES_MINUTES,
      });
      await sendEmail({ to: admin.email, subject, html, text });
    }
  }

  return NextResponse.json({ ok: true });
}
