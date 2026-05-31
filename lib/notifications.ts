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

/** Every admin account's email (regardless of their per-account email gate). */
export async function getAdminEmails(): Promise<string[]> {
  const col = await adminsCollection();
  const docs = await col.find({}, { projection: { email: 1 } }).toArray();
  return docs.map((d) => d.email);
}

export interface AdminRecipient {
  email: string;
  /** This admin's per-account email gate. Missing in DB ⇒ true (default on). */
  notificationsEnabled: boolean;
}

/**
 * Every admin's email plus whether they currently receive notification emails.
 * Used by the notifications UI (to show who's muted) and by the send flow
 * (to skip muted admins). Extra, non-admin recipients have no such gate.
 */
export async function getAdminRecipients(): Promise<AdminRecipient[]> {
  const col = await adminsCollection();
  const docs = await col
    .find({}, { projection: { email: 1, emailNotificationsEnabled: 1 } })
    .toArray();
  return docs.map((d) => ({
    email: d.email,
    notificationsEnabled: d.emailNotificationsEnabled !== false,
  }));
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
  const [settings, admins] = await Promise.all([
    getNotificationSettings(),
    getAdminRecipients(),
  ]);
  if (!settings.newRsvpEnabled) return;

  // Per-admin gate: skip admins who muted their notifications. Extra recipients
  // (the couple, a planner) have no account, so they're always included.
  const enabledAdminEmails = admins
    .filter((a) => a.notificationsEnabled)
    .map((a) => a.email);
  const recipients = dedupeEmails([
    ...enabledAdminEmails,
    ...settings.extraRecipients,
  ]);
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
