import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { socialSettingsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { SOCIAL_SETTINGS_TAG } from "@/lib/settings";
import { isSocialPlatform, type SocialLink } from "@/lib/social";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rawLinks = (body as Record<string, unknown>)?.links;
  if (!Array.isArray(rawLinks)) {
    return NextResponse.json(
      { error: "A list of links is required." },
      { status: 400 }
    );
  }

  const seen = new Set<string>();
  const links: SocialLink[] = [];

  for (const item of rawLinks) {
    const record = (item ?? {}) as Record<string, unknown>;
    const { platform, enabled, url } = record;

    if (!isSocialPlatform(platform)) {
      return NextResponse.json(
        { error: `Unknown platform: ${String(platform)}` },
        { status: 400 }
      );
    }
    if (seen.has(platform)) {
      return NextResponse.json(
        { error: `Duplicate platform: ${platform}` },
        { status: 400 }
      );
    }
    seen.add(platform);

    const cleanUrl = typeof url === "string" ? url.trim() : "";
    const isEnabled = enabled === true;

    // Only validate the URL when the link is actually going to be shown.
    if (isEnabled && cleanUrl.length > 0 && !isHttpUrl(cleanUrl)) {
      return NextResponse.json(
        { error: `Enter a valid link (starting with https://) for ${platform}.` },
        { status: 400 }
      );
    }

    links.push({ platform, enabled: isEnabled, url: cleanUrl });
  }

  const col = await socialSettingsCollection();
  await col.updateOne(
    { _id: "social" },
    {
      $set: {
        links,
        updatedAt: new Date(),
        updatedBy: admin.email,
      },
    },
    { upsert: true }
  );

  revalidateTag(SOCIAL_SETTINGS_TAG, "max");

  return NextResponse.json({ ok: true, links });
}
