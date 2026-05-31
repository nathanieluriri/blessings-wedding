import type { Metadata } from "next";
import {
  dedupeEmails,
  getAdminEmails,
  getNotificationSettings,
} from "@/lib/notifications";
import NotificationsForm from "./notifications-form";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [settings, adminEmails] = await Promise.all([
    getNotificationSettings(),
    getAdminEmails(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-[color:var(--primary)]">
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose who gets emailed when a new RSVP comes in.
        </p>
      </div>
      <NotificationsForm
        newRsvpEnabled={settings.newRsvpEnabled}
        extraRecipients={settings.extraRecipients}
        adminEmails={dedupeEmails(adminEmails)}
      />
    </div>
  );
}
