import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { dedupeEmails, getAdminRecipients } from "@/lib/notifications";
import { sendEmail } from "@/lib/email/send";
import { newRsvpEmail } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site-url";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 100;

// Sends a sample "new RSVP" email so admins can confirm delivery.
//   • body { to: "a@b.com" }        → one recipient   (per-row "Send test")
//   • body { to: ["a@b", "c@d"] }   → many recipients ("Send test to all")
//   • no body                       → the signed-in admin
//
// Gated by the caller's own per-account notification switch, and any admin
// recipient who has muted notifications is skipped (never emailed).
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The caller can't see a test email while their own notifications are off.
  if (!admin.emailNotificationsEnabled) {
    return NextResponse.json(
      {
        error:
          "Turn on email notifications in Settings to send test emails.",
      },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    to?: unknown;
  };
  const rawTargets =
    typeof body.to === "string"
      ? [body.to]
      : Array.isArray(body.to)
        ? body.to.filter((x): x is string => typeof x === "string")
        : [admin.email];

  const targets = dedupeEmails(rawTargets);
  if (targets.length === 0) {
    return NextResponse.json({ error: "No recipients." }, { status: 400 });
  }
  if (targets.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { error: `Too many recipients (max ${MAX_RECIPIENTS}).` },
      { status: 400 }
    );
  }
  const invalid = targets.find((t) => !EMAIL_RE.test(t));
  if (invalid) {
    return NextResponse.json(
      { error: `"${invalid}" is not a valid email address.` },
      { status: 400 }
    );
  }

  // Drop any admin who has muted their notifications — the gate must hold for
  // test emails too. Non-admin extras have no account and always pass through.
  const mutedAdmins = new Set(
    (await getAdminRecipients())
      .filter((a) => !a.notificationsEnabled)
      .map((a) => a.email.toLowerCase())
  );
  const sendTo = targets.filter((t) => !mutedAdmins.has(t));
  const skipped = targets.length - sendTo.length;

  if (sendTo.length === 0) {
    return NextResponse.json(
      {
        error:
          "Every selected recipient has notifications turned off. Ask them to turn email notifications on.",
      },
      { status: 409 }
    );
  }

  const siteUrl = getSiteUrl();
  const { subject, html, text } = newRsvpEmail({
    name: "Test Guest",
    attending: "yes",
    email: "test.guest@example.com",
    message: "This is a test notification — your email setup works.",
    adminUrl: `${siteUrl}/admin/rsvps`,
  });

  // One email per recipient so addresses aren't exposed to one another.
  const results = await Promise.all(
    sendTo.map((to) =>
      sendEmail({ to, subject: `[Test] ${subject}`, html, text })
    )
  );
  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;

  if (sent === 0) {
    return NextResponse.json(
      {
        error:
          results.find((r) => !r.ok)?.error ??
          "Could not send the test email. Check RESEND_API_KEY and your domain.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, sent, skipped, failed });
}
