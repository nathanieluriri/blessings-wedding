import type { Metadata } from "next";
import {
  getWeddingDate,
  getWeddingDateISO,
  getRsvpDeadline,
  getRsvpDeadlineISO,
  getSocialLinks,
  formatLongDate,
} from "@/lib/settings";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import SettingsForm from "./settings-form";
import SocialForm from "./social-form";
import NotificationsPrefForm from "./notifications-pref-form";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [iso, date, deadlineIso, deadlineDate, socialLinks, admin] =
    await Promise.all([
      getWeddingDateISO(),
      getWeddingDate(),
      getRsvpDeadlineISO(),
      getRsvpDeadline(),
      getSocialLinks(),
      getCurrentAdmin(),
    ]);
  const label = `${formatLongDate(date)} · ${new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)} WAT`;
  const deadlineLabel = formatLongDate(deadlineDate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-[color:var(--primary)]">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage public-facing event details.
        </p>
      </div>
      <SettingsForm
        weddingDateISO={iso}
        currentLabel={label}
        rsvpDeadlineISO={deadlineIso}
        rsvpDeadlineLabel={deadlineLabel}
      />
      <NotificationsPrefForm
        enabled={admin?.emailNotificationsEnabled ?? true}
      />
      <SocialForm links={socialLinks} />
    </div>
  );
}
