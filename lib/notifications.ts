import {
  adminsCollection,
  notificationSettingsCollection,
  type RsvpDoc,
} from "./collections";
import { sendEmail } from "./email/send";
import { newRsvpEmail } from "./email/templates";
import { getSiteUrl } from "./site-url";

export interface NotificationSettings {
  newRsvpEnabled: boolean;
  extraRecipients: string[];
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  newRsvpEnabled: true,
  extraRecipients: [],
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const col = await notificationSettingsCollection();
    const doc = await col.findOne({ _id: "notifications" });
    return {
      newRsvpEnabled:
        doc?.newRsvpEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.newRsvpEnabled,
      extraRecipients: doc?.extraRecipients ?? [],
    };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

/** Every admin account's email — always notified about new RSVPs. */
export async function getAdminEmails(): Promise<string[]> {
  const col = await adminsCollection();
  const docs = await col.find({}, { projection: { email: 1 } }).toArray();
  return docs.map((d) => d.email);
}

/** Lower-case, trim, drop blanks/dupes. */
export function dedupeEmails(emails: string[]): string[] {
  const set = new Set<string>();
  for (const e of emails) {
    const v = e.trim().toLowerCase();
    if (v) set.add(v);
  }
  return [...set];
}

/**
 * Emails all admins + the custom recipient list when a new RSVP arrives.
 * Called via `after()` so it never blocks or breaks the guest's submission.
 */
export async function sendNewRsvpNotification(
  rsvp: Pick<RsvpDoc, "name" | "attending" | "email" | "message">
): Promise<void> {
  const [settings, adminEmails] = await Promise.all([
    getNotificationSettings(),
    getAdminEmails(),
  ]);
  if (!settings.newRsvpEnabled) return;

  const recipients = dedupeEmails([...adminEmails, ...settings.extraRecipients]);
  if (recipients.length === 0) return;

  const { subject, html, text } = newRsvpEmail({
    name: rsvp.name,
    attending: rsvp.attending,
    email: rsvp.email,
    message: rsvp.message,
    adminUrl: `${getSiteUrl()}/admin/rsvps`,
  });

  // One email per recipient so addresses aren't exposed to one another.
  await Promise.all(
    recipients.map((to) => sendEmail({ to, subject, html, text }))
  );
}
