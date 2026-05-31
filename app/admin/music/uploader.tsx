"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloudIcon, Loader2Icon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { decodeAudioFile } from "@/lib/music/peaks";
import {
  MAX_FILE_BYTES,
  looksLikeAudio,
  type SongClient,
} from "@/lib/music/shared";

const MAX_MB = Math.round(MAX_FILE_BYTES / (1024 * 1024));

export default function Uploader({
  atCapacity,
  count,
  maxSongs,
  onUploaded,
}: {
  atCapacity: boolean;
  count: number;
  maxSongs: number;
  onUploaded: (song: SongClient) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const [dragging, setDragging] = useState(false);

  const disabled = atCapacity || uploading;

  async function startUpload(file: File) {
    if (!looksLikeAudio(file.name, file.type)) {
      toast.error("Choose an audio file (MP3, M4A, WAV, or OGG).");
      return;
    }
    if (file.size === 0) {
      toast.error("That file is empty.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error(`Songs must be ${MAX_MB} MB or smaller.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setPhase("Analysing the song…");

    try {
      // Decode duration + waveform peaks in the browser (one-time).
      let duration: number;
      let peaks: number[];
      try {
        ({ duration, peaks } = await decodeAudioFile(file));
      } catch {
        toast.error("Couldn’t read that audio file. Try a different format.");
        return;
      }

      setPhase("Starting upload…");
      const initRes = await fetch("/api/admin/music/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          duration,
          peaks,
        }),
      });
      const initData = await initRes.json().catch(() => ({}));
      if (!initRes.ok) {
        toast.error(initData.error ?? "Upload could not start.");
        return;
      }

      const { uploadId, chunkSize, totalChunks } = initData as {
        uploadId: string;
        chunkSize: number;
        totalChunks: number;
      };

      setPhase("Uploading…");
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const buf = await file.slice(start, end).arrayBuffer();
        const res = await fetch(
          `/api/admin/music/upload/chunk?uploadId=${uploadId}&index=${i}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: buf,
          }
        );
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? "A chunk failed to upload.");
        }
        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      setPhase("Finishing…");
      const finRes = await fetch("/api/admin/music/upload/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId }),
      });
      const finData = await finRes.json().catch(() => ({}));
      if (!finRes.ok) {
        toast.error(finData.error ?? "Could not save the song.");
        return;
      }

      toast.success("Song uploaded.");
      onUploaded(finData.song as SongClient);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
      setPhase("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onPick(file: File | undefined) {
    if (!file || disabled) return;
    void startUpload(file);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload a song</CardTitle>
        <CardDescription>
          MP3, M4A, WAV, or OGG · up to {MAX_MB} MB. Large files upload in chunks,
          so a slow connection won’t fail the upload.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            if (disabled) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (disabled) return;
            onPick(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "music-dropzone w-full",
            dragging && "is-dragging",
            disabled && "is-disabled"
          )}
          aria-label="Upload a song"
        >
          {uploading ? (
            <div className="flex w-full flex-col items-center gap-3">
              <Loader2Icon className="size-7 animate-spin text-[color:var(--primary)]" />
              <div className="text-sm font-medium text-[color:var(--primary)]">
                {phase}
              </div>
              <div className="music-progress" aria-hidden="true">
                <div
                  className="music-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">{progress}%</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--primary)]">
                <UploadCloudIcon className="size-6" />
              </span>
              <div className="font-serif text-base text-[color:var(--primary)]">
                {atCapacity
                  ? `Library full (${count}/${maxSongs})`
                  : "Drop a song here, or click to choose"}
              </div>
              <div className="text-xs text-muted-foreground">
                {atCapacity
                  ? "Delete a song to make room for another."
                  : `${count}/${maxSongs} songs used`}
              </div>
            </div>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.webm,.flac"
          className="sr-only"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </CardContent>
    </Card>
  );
}
