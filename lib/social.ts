// Client-safe social-link catalog, types and helpers.
//
// IMPORTANT: this module must stay free of server-only imports (no mongodb,
// no next/cache) so it can be imported by both Server and Client components.
// The cached DB readers live in `lib/settings.ts`.

export const SOCIAL_PLATFORMS = [
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/yourhandle",
  },
  { id: "x", label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
  {
    id: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@yourhandle",
  },
  {
    id: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/yourpage",
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@yourchannel",
  },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["id"];

export interface SocialLink {
  platform: SocialPlatform;
  enabled: boolean;
  url: string;
}

/** Public-facing link, already filtered to enabled + has-a-URL. */
export interface VisibleSocialLink {
  platform: SocialPlatform;
  url: string;
}

// By default Instagram and X are turned on (URLs blank until the couple add
// them); the rest are available in the admin but off.
export const DEFAULT_ENABLED: readonly SocialPlatform[] = ["instagram", "x"];

/** For design/aesthetics — the admin is advised not to exceed this. */
export const RECOMMENDED_MAX_VISIBLE = 2;

export const SOCIAL_LABEL: Record<SocialPlatform, string> = Object.fromEntries(
  SOCIAL_PLATFORMS.map((p) => [p.id, p.label])
) as Record<SocialPlatform, string>;

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = SOCIAL_PLATFORMS.map((p) => ({
  platform: p.id,
  enabled: DEFAULT_ENABLED.includes(p.id),
  url: "",
}));

const VALID_IDS = new Set<string>(SOCIAL_PLATFORMS.map((p) => p.id));

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return typeof value === "string" && VALID_IDS.has(value);
}

/**
 * Merge whatever is stored (possibly partial / stale shape) with the canonical
 * catalog, so every platform is always present and in a stable order.
 */
export function normalizeSocialLinks(
  stored:
    | ReadonlyArray<{ platform?: unknown; enabled?: unknown; url?: unknown }>
    | undefined
): SocialLink[] {
  const byId = new Map(
    (stored ?? [])
      .filter((l) => isSocialPlatform(l.platform))
      .map((l) => [l.platform as SocialPlatform, l])
  );
  return SOCIAL_PLATFORMS.map((p) => {
    const s = byId.get(p.id);
    return {
      platform: p.id,
      enabled:
        typeof s?.enabled === "boolean"
          ? s.enabled
          : DEFAULT_ENABLED.includes(p.id),
      url: typeof s?.url === "string" ? s.url : "",
    };
  });
}
