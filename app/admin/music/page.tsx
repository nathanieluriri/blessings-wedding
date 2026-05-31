import type { Metadata } from "next";
import { listSongs } from "@/lib/music/store";
import { MAX_SONGS } from "@/lib/music/shared";
import MusicManager from "./music-manager";

export const metadata: Metadata = { title: "Music" };
export const dynamic = "force-dynamic";

export default async function MusicPage() {
  const songs = await listSongs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-[color:var(--primary)]">
          Background Music
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload a song, trim it to the part you love, set the volume, and choose
          which one plays softly behind the invitation. Up to {MAX_SONGS} songs.
        </p>
      </div>

      <MusicManager initialSongs={songs} maxSongs={MAX_SONGS} />
    </div>
  );
}
