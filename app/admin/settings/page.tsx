import type { Metadata } from "next";
import { getWeddingDate, getWeddingDateISO, formatLongDate } from "@/lib/settings";
import SettingsForm from "./settings-form";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [iso, date] = await Promise.all([getWeddingDateISO(), getWeddingDate()]);
  const label = `${formatLongDate(date)} · ${new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)} WAT`;

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
      <SettingsForm weddingDateISO={iso} currentLabel={label} />
    </div>
  );
}
