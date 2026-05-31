import type { Metadata } from "next";
import {
  getAdminRecipients,
  getNotificationSettings,
} from "@/lib/notifications";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import NotificationsForm from "./notifications-form";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [settings, admins, current] = await Promise.all([
    getNotificationSettings(),
    getAdminRecipients(),
    getCurrentAdmin(),
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
        admins={admins.map((a) => ({
          email: a.email.toLowerCase(),
          notificationsEnabled: a.notificationsEnabled,
        }))}
        selfNotificationsEnabled={current?.emailNotificationsEnabled ?? true}
      />
    </div>
  );
}
