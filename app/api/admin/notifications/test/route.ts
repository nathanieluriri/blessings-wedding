import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { sendEmail } from "@/lib/email/send";
import { newRsvpEmail } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site-url";

// Sends a sample "new RSVP" email to the signed-in admin so they can confirm
// delivery (and, in Resend test mode, that it reaches their account email).
export async function POST() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = getSiteUrl();
  const { subject, html, text } = newRsvpEmail({
    name: "Test Guest",
    attending: "yes",
    email: "test.guest@example.com",
    message: "This is a test notification — your email setup works.",
    adminUrl: `${siteUrl}/admin/rsvps`,
  });

  const result = await sendEmail({
    to: admin.email,
    subject: `[Test] ${subject}`,
    html,
    text,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          result.error ??
          "Could not send the test email. Check RESEND_API_KEY and your domain.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
