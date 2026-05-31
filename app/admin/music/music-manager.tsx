"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Music2Icon,
  Trash2Icon,
  CheckCircle2Icon,
  SlidersHorizontalIcon,
  RadioIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatClock, formatBytes, type SongClient } from "@/lib/music/shared";
import Uploader from "./uploader";
import WaveformEditor from "./waveform-editor";

export default function MusicManager({
  initialSongs,
  maxSongs,
}: {
  initialSongs: SongClient[];
  maxSongs: number;
}) {
  const router = useRouter();
  const [songs, setSongs] = useState<SongClient[]>(initialSongs);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSongs.find((s) => s.active)?.id ?? initialSongs[0]?.id ?? null
  );
  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const selected = useMemo(
    () => songs.find((s) => s.id === selectedId) ?? null,
    [songs, selectedId]
  );
  const atCapacity = songs.length >= maxSongs;

  function handleUploaded(song: SongClient) {
    setSongs((prev) => {
      const next = song.active
        ? prev.map((s) => ({ ...s, active: false }))
        : prev.slice();
      return [song, ...next];
    });
    setSelectedId(song.id);
  }

  async function handleSetActive(id: string) {
    setActivating(id);
    try {
      const res = await fetch("/api/admin/music/active", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not set the background song.");
        return;
      }
      setSongs((prev) => prev.map((s) => ({ ...s, active: s.id === id })));
      toast.success("This song now plays behind the invitation.");
      router.refresh();
    } finally {
      setActivating(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/music/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not delete the song.");
        return;
      }
      setSongs((prev) => prev.filter((s) => s.id !== id));
      setSelectedId((cur) => {
        if (cur !== id) return cur;
        const remaining = songs.filter((s) => s.id !== id);
        return remaining[0]?.id ?? null;
      });
      toast.success("Song deleted.");
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  function handleSaved(updated: SongClient) {
    setSongs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  return (
    <div className="space-y-6">
      <Uploader
        atCapacity={atCapacity}
        count={songs.length}
        maxSongs={maxSongs}
        onUploaded={handleUploaded}
      />

      {songs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-serif text-lg text-[color:var(--primary)]">
            Your songs
            <span className="ml-2 text-sm font-sans text-muted-foreground">
              {songs.length}/{maxSongs}
            </span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {songs.map((song) => {
              const isSelected = song.id === selectedId;
              return (
                <div
                  key={song.id}
                  data-active={song.active ? "true" : undefined}
                  className={cn(
                    "music-card group relative flex flex-col gap-4 rounded-xl border bg-card p-5 text-left transition-all",
                    isSelected
                      ? "border-[color:var(--primary)] shadow-[0_10px_28px_-12px_color-mix(in_srgb,var(--primary)_45%,transparent)]"
                      : "border-border hover:border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)]"
                  )}
                >
                  {song.active && (
                    <span className="music-active-badge">
                      <CheckCircle2Icon className="size-3.5" />
                      Playing
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedId(song.id)}
                    className="flex min-w-0 items-start gap-3 text-left outline-none"
                    aria-label={`Edit ${song.title}`}
                  >
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--primary)]">
                      <Music2Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-serif text-base text-[color:var(--primary)]">
                        {song.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {formatClock(song.trimEnd - song.trimStart)} clip ·{" "}
                        {formatBytes(song.size)}
                      </span>
                    </span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant={isSelected ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setSelectedId(song.id)}
                    >
                      <SlidersHorizontalIcon className="size-3.5" />
                      Trim &amp; mix
                    </Button>

                    {song.active ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--primary)]">
                        <RadioIcon className="size-3.5" />
                        Background song
                      </span>
                    ) : (
                      <LoadingButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        loading={activating === song.id}
                        onClick={() => handleSetActive(song.id)}
                      >
                        Set as background
                      </LoadingButton>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="ml-auto text-muted-foreground hover:text-[color:var(--destructive)]"
                          aria-label={`Delete ${song.title}`}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this song?</AlertDialogTitle>
                          <AlertDialogDescription>
                            “{song.title}” will be permanently removed
                            {song.active
                              ? " and the invitation will play no music until you pick another."
                              : "."}{" "}
                            This can’t be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep it</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => handleDelete(song.id)}
                          >
                            {deleting === song.id ? "Deleting…" : "Delete song"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {selected && (
        <WaveformEditor key={selected.id} song={selected} onSaved={handleSaved} />
      )}
    </div>
  );
}
