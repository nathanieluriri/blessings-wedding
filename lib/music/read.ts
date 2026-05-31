// Cached public reads for the active background song. Mirrors the
// unstable_cache + tag + DB-unavailable-fallback pattern in lib/settings.ts so
// the public site always renders even if Mongo is down (music simply absent).

import { unstable_cache } from "next/cache";
import { musicSettingsCollection, songsCollection } from "@/lib/collections";
import type { ActiveSongClient } from "./shared";

/** Invalidated (revalidateTag) whenever the library or active song changes. */
export const MUSIC_TAG = "music";

const readActiveSong = unstable_cache(
  async (): Promise<ActiveSongClient | null> => {
    try {
      const settings = await musicSettingsCollection();
      const music = await settings.findOne({ _id: "music" });
      const activeId = music?.activeSongId;
      if (!activeId) return null;

      const songs = await songsCollection();
      const doc = await songs.findOne({ _id: activeId });
      if (!doc) return null;

      return {
        id: doc._id!.toHexString(),
        trimStart: doc.trimStart,
        trimEnd: doc.trimEnd,
        volume: doc.volume,
        loop: doc.loop,
        duration: doc.duration,
      };
    } catch {
      // DB unavailable — the public site renders without background music.
      return null;
    }
  },
  ["active-song"],
  { tags: [MUSIC_TAG] }
);

/** The active background track for the public site, or null. */
export async function getActivePublicSong(): Promise<ActiveSongClient | null> {
  return readActiveSong();
}
