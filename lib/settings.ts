import { unstable_cache } from "next/cache";
import { settingsCollection, socialSettingsCollection } from "./collections";
import {
  DEFAULT_SOCIAL_LINKS,
  normalizeSocialLinks,
  type SocialLink,
  type VisibleSocialLink,
} from "./social";

export const WEDDING_SETTINGS_TAG = "wedding-settings";
export const SOCIAL_SETTINGS_TAG = "social-settings";

// Fallback used before anything is saved in the DB (matches the original
// hardcoded value). Africa/Lagos is +01:00 year-round (no DST).
export const DEFAULT_WEDDING_DATE = "2026-12-19T14:30:00+01:00";
const TZ = "Africa/Lagos";

// Cached read, invalidated by revalidateTag(WEDDING_SETTINGS_TAG) on update.
const readWeddingDateISO = unstable_cache(
  async (): Promise<string> => {
    try {
      const col = await settingsCollection();
      const doc = await col.findOne({ _id: "global" });
      return doc?.weddingDate ?? DEFAULT_WEDDING_DATE;
    } catch {
      // DB unavailable — fall back so the public site still renders.
      return DEFAULT_WEDDING_DATE;
    }
  },
  ["wedding-date"],
  { tags: [WEDDING_SETTINGS_TAG] }
);

export async function getWeddingDateISO(): Promise<string> {
  return readWeddingDateISO();
}

export async function getWeddingDate(): Promise<Date> {
  return new Date(await readWeddingDateISO());
}

// ── Social links ───────────────────────────────────────────────────────────

// Cached read, invalidated by revalidateTag(SOCIAL_SETTINGS_TAG) on update.
const readSocialLinks = unstable_cache(
  async (): Promise<SocialLink[]> => {
    try {
      const col = await socialSettingsCollection();
      const doc = await col.findOne({ _id: "social" });
      return normalizeSocialLinks(doc?.links);
    } catch {
      // DB unavailable — fall back so the public site still renders.
      return DEFAULT_SOCIAL_LINKS;
    }
  },
  ["social-links"],
  { tags: [SOCIAL_SETTINGS_TAG] }
);

/** Full catalog with stored enabled/url values (for the admin form). */
export async function getSocialLinks(): Promise<SocialLink[]> {
  return readSocialLinks();
}

/** Only the links that should render publicly: enabled AND have a URL. */
export async function getVisibleSocialLinks(): Promise<VisibleSocialLink[]> {
  const links = await readSocialLinks();
  return links
    .filter((l) => l.enabled && l.url.trim().length > 0)
    .map((l) => ({ platform: l.platform, url: l.url.trim() }));
}

// ── Formatters (stable across server timezones via Intl timeZone) ──────────

function parts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  const map: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) map[p.type] = p.value;
  return {
    day: Number(map.day),
    month: Number(map.month),
    year: Number(map.year),
  };
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/** e.g. "19 December 2026" */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** e.g. "19 · 12 · 2026" */
export function formatNumericDots(date: Date): string {
  const { day, month, year } = parts(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(day)} · ${pad(month)} · ${year}`;
}

/** e.g. "December 19th" */
export function formatMonthDayOrdinal(date: Date): string {
  const month = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    month: "long",
  }).format(date);
  const { day } = parts(date);
  return `${month} ${ordinal(day)}`;
}
