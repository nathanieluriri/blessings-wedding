import { getFromAddress, getResend } from "./client";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Sends one email via Resend. Never throws — returns { ok } so callers in a
 * request path (login, RSVP) can't be broken by a delivery failure.
 */
export async function sendEmail(
  input: SendEmailInput
): Promise<{ ok: boolean; error?: string }> {
  const recipients = (Array.isArray(input.to) ? input.to : [input.to]).filter(
    Boolean
  );
  if (recipients.length === 0) return { ok: false, error: "No recipients" };

  const resend = getResend();
  if (!resend) {
    console.warn(`[email] skipped "${input.subject}" — email not configured.`);
    return { ok: false, error: "Email not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: recipients,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    if (error) {
      console.error(`[email] send failed "${input.subject}":`, error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error(`[email] send threw "${input.subject}":`, err);
    return { ok: false, error: "Send failed" };
  }
}
