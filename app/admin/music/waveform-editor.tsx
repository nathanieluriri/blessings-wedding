"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlayIcon, PauseIcon, RotateCcwIcon, Volume2Icon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  clampVolume,
  formatClock,
  MIN_CLIP_SECONDS,
  round3,
  type SongClient,
} from "@/lib/music/shared";

const CREAM = "#f7f0e6";
const BURGUNDY = "#5a1a1a";
const GOLD = "#c9a96b";
const FAINT = "rgba(90, 26, 26, 0.16)";
const REGION_TINT = "rgba(201, 169, 107, 0.16)";

export default function WaveformEditor({
  song,
  onSaved,
}: {
  song: SongClient;
  onSaved: (song: SongClient) => void;
}) {
  const router = useRouter();
  const duration = song.duration || 1;
  const minGap = Math.min(MIN_CLIP_SECONDS, duration);

  const [trimStart, setTrimStart] = useState(song.trimStart);
  const [trimEnd, setTrimEnd] = useState(song.trimEnd);
  const [volume, setVolume] = useState(song.volume);
  const [loop, setLoop] = useState(song.loop);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(song.trimStart);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState<"in" | "out" | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number | null>(null);
  const playingRef = useRef(playing);

  // Refs mirror state so the rAF loop reads live values without re-subscribing.
  const trimStartRef = useRef(trimStart);
  const trimEndRef = useRef(trimEnd);
  const loopRef = useRef(loop);
  useEffect(() => {
    trimStartRef.current = trimStart;
  }, [trimStart]);
  useEffect(() => {
    trimEndRef.current = trimEnd;
  }, [trimEnd]);
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const dirty = useMemo(
    () =>
      Math.abs(trimStart - song.trimStart) > 0.001 ||
      Math.abs(trimEnd - song.trimEnd) > 0.001 ||
      Math.abs(volume - song.volume) > 0.001 ||
      loop !== song.loop,
    [trimStart, trimEnd, volume, loop, song]
  );

  // ── Canvas sizing ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () =>
      setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Canvas drawing ──────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = size;
    if (w === 0 || h === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, w, h);

    const peaks = song.peaks;
    const n = peaks.length;
    if (n === 0) return;
    const mid = h / 2;
    const start = trimStartRef.current;
    const end = trimEndRef.current;
    const xIn = (start / duration) * w;
    const xOut = (end / duration) * w;

    // Selected-region tint.
    ctx.fillStyle = REGION_TINT;
    ctx.fillRect(xIn, 0, Math.max(0, xOut - xIn), h);

    const step = w / n;
    ctx.lineWidth = Math.max(1, step * 0.7);
    for (let i = 0; i < n; i++) {
      const x = i * step + step / 2;
      const amp = peaks[i] ?? 0;
      const barH = Math.max(1, amp * (h * 0.46));
      const t = (i / n) * duration;
      const inRegion = t >= start && t <= end;
      if (inRegion) {
        ctx.strokeStyle = playingRef.current && t <= playhead ? GOLD : BURGUNDY;
      } else {
        ctx.strokeStyle = FAINT;
      }
      ctx.beginPath();
      ctx.moveTo(x, mid - barH);
      ctx.lineTo(x, mid + barH);
      ctx.stroke();
    }

    if (playingRef.current) {
      const px = (playhead / duration) * w;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }
  }, [size, song.peaks, duration, playhead]);

  useEffect(() => {
    draw();
  }, [draw, trimStart, trimEnd]);

  // ── Preview playback ────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = clampVolume(volume);
  }, [volume]);

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    if (t >= trimEndRef.current - 0.03) {
      if (loopRef.current) {
        audio.currentTime = trimStartRef.current;
        setPlayhead(trimStartRef.current);
      } else {
        audio.pause();
        setPlaying(false);
        setPlayhead(trimStartRef.current);
        stopRaf();
        return;
      }
    } else {
      setPlayhead((prev) => (Math.abs(prev - t) >= 0.04 ? t : prev));
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [stopRaf]);

  const togglePreview = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      stopRaf();
      return;
    }
    // Prevent repeated clicks while we probe / start playback.
    setPreviewLoading(true);
    // (Re)start at the clip's beginning when out of range.
    if (audio.currentTime < trimStart || audio.currentTime >= trimEnd) {
      audio.currentTime = trimStart;
    }
    audio.volume = clampVolume(volume);
    // Attach a simple error logger to the element for extra details.
    audio.onerror = () => console.error("Audio element error:", audio.error);

    // Probe the stream URL first to give a clearer error when the server or
    // GridFS is unavailable (404/503) — this avoids an opaque play() rejection.
    try {
      const streamUrl = audio.src;
      const probe = await fetch(streamUrl, {
        method: "GET",
        // Request a single byte (if the endpoint supports Range) so we don't
        // transfer the whole file during the probe.
        headers: { Range: "bytes=0-0" },
      });
      const contentType = probe.headers.get("content-type") ?? "";
      const contentRange = probe.headers.get("content-range") ?? "";
      console.log("Preview probe", probe.status, contentType, contentRange);

      if (!probe.ok && probe.status !== 206) {
        const body = await probe.text().catch(() => probe.statusText);
        console.error("Preview probe failed", probe.status, body);
        toast.error(`Preview unavailable (${probe.status}).`);
        setPreviewLoading(false);
        return;
      }

      // If the server returned JSON (503 error details) or an empty content
      // type, surface a clearer message rather than letting the audio element
      // report an obscure NotSupportedError.
      if (contentType.includes("application/json") || contentType === "") {
        const body = await probe.text().catch(() => null);
        console.error("Preview returned non-audio response", probe.status, contentType, body);
        toast.error("Preview unavailable (invalid response).");
        setPreviewLoading(false);
        return;
      }

      // Let the browser tell us whether it can play this MIME type.
      if (typeof audio.canPlayType === "function") {
        try {
          const can = audio.canPlayType(contentType || "audio/mpeg");
          if (!can) {
            console.error("Browser cannot play content type:", contentType);
            toast.error("Your browser cannot play this audio type.");
            setPreviewLoading(false);
            return;
          }
        } catch (err) {
          console.warn("canPlayType check failed", err);
        }
      }
    } catch (err) {
      console.error("Preview probe error", err);
      toast.error("Couldn’t start preview playback.");
      setPreviewLoading(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
      stopRaf();
      rafRef.current = requestAnimationFrame(tick);
      setPreviewLoading(false);
    } catch (err) {
      console.error("audio.play() rejected:", err);
      toast.error("Couldn’t start preview playback.");
      setPreviewLoading(false);
    }
  }, [playing, trimStart, trimEnd, volume, tick, stopRaf]);

  // Clean up on unmount / song change.
  useEffect(() => {
    return () => {
      stopRaf();
      const audio = audioRef.current;
      if (audio) audio.pause();
    };
  }, [stopRaf]);

  // ── Handle dragging ─────────────────────────────────────────────────────────
  const timeFromClientX = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const onHandlePointerDown =
    (which: "in" | "out") => (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(which);
    };

  const onHandlePointerMove =
    (which: "in" | "out") => (e: React.PointerEvent) => {
      if (dragging !== which) return;
      const t = timeFromClientX(e.clientX);
      if (which === "in") {
        setTrimStart(round3(Math.min(t, trimEnd - minGap)));
      } else {
        setTrimEnd(round3(Math.max(t, trimStart + minGap)));
      }
    };

  const onHandlePointerUp =
    (which: "in" | "out") => (e: React.PointerEvent) => {
      if (dragging !== which) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDragging(null);
    };

  const nudge = (which: "in" | "out", delta: number) => {
    if (which === "in") {
      setTrimStart((s) =>
        round3(Math.min(Math.max(0, s + delta), trimEnd - minGap))
      );
    } else {
      setTrimEnd((eVal) =>
        round3(Math.max(Math.min(duration, eVal + delta), trimStart + minGap))
      );
    }
  };

  function reset() {
    setTrimStart(song.trimStart);
    setTrimEnd(song.trimEnd);
    setVolume(song.volume);
    setLoop(song.loop);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/music/${song.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trimStart, trimEnd, volume, loop }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save.");
        return;
      }
      toast.success(
        song.active
          ? "Saved. The invitation now plays this clip."
          : "Saved."
      );
      onSaved(data.song as SongClient);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const pctIn = (trimStart / duration) * 100;
  const pctOut = (trimEnd / duration) * 100;
  const clipLen = Math.max(0, trimEnd - trimStart);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Trim &amp; mix — {song.title}</CardTitle>
        <CardDescription>
          Drag the gold handles to choose the part that plays, set the
          background volume, and toggle looping. Preview before you save.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          ref={containerRef}
          className="music-wave"
          role="group"
          aria-label="Waveform trim editor"
        >
          <canvas ref={canvasRef} className="music-wave__canvas" />

          {/* Dimmed areas outside the selected clip */}
          <div
            className="music-wave__mask"
            style={{ left: 0, width: `${pctIn}%` }}
            aria-hidden="true"
          />
          <div
            className="music-wave__mask"
            style={{ right: 0, width: `${100 - pctOut}%` }}
            aria-hidden="true"
          />

          {/* In handle */}
          <div
            className="music-wave__handle"
            style={{ left: `${pctIn}%` }}
            data-dragging={dragging === "in" ? "true" : undefined}
            role="slider"
            tabIndex={0}
            aria-label="Clip start"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(trimStart)}
            aria-valuetext={formatClock(trimStart)}
            onPointerDown={onHandlePointerDown("in")}
            onPointerMove={onHandlePointerMove("in")}
            onPointerUp={onHandlePointerUp("in")}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                nudge("in", -1);
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                nudge("in", 1);
              }
            }}
          >
            <span className="music-wave__grip" />
          </div>

          {/* Out handle */}
          <div
            className="music-wave__handle"
            style={{ left: `${pctOut}%` }}
            data-dragging={dragging === "out" ? "true" : undefined}
            role="slider"
            tabIndex={0}
            aria-label="Clip end"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(trimEnd)}
            aria-valuetext={formatClock(trimEnd)}
            onPointerDown={onHandlePointerDown("out")}
            onPointerMove={onHandlePointerMove("out")}
            onPointerUp={onHandlePointerUp("out")}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                nudge("out", -1);
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                nudge("out", 1);
              }
            }}
          >
            <span className="music-wave__grip" />
          </div>
        </div>

        {/* Time readout */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            Start <strong className="text-foreground">{formatClock(trimStart)}</strong>
          </span>
          <span className="text-muted-foreground">
            Clip length{" "}
            <strong className="text-[color:var(--primary)]">
              {formatClock(clipLen)}
            </strong>
          </span>
          <span className="text-muted-foreground">
            End <strong className="text-foreground">{formatClock(trimEnd)}</strong>
          </span>
        </div>

        {/* Preview + volume + loop */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <LoadingButton
            type="button"
            variant="outline"
            onClick={togglePreview}
            loading={previewLoading}
            className="w-full sm:w-auto"
          >
            {playing ? (
              <>
                <PauseIcon className="size-4" /> Stop preview
              </>
            ) : (
              <>
                <PlayIcon className="size-4" /> Preview clip
              </>
            )}
          </LoadingButton>

          <div className="flex flex-1 items-center gap-3">
            <Volume2Icon className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              className="music-volume flex-1"
              min={0}
              max={100}
              step={1}
              value={Math.round(volume * 100)}
              aria-label="Background volume"
              onChange={(e) => setVolume(clampVolume(Number(e.target.value) / 100))}
            />
            <span className="w-10 text-right font-mono text-xs text-muted-foreground">
              {Math.round(volume * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Switch
              id={`loop-${song.id}`}
              checked={loop}
              onCheckedChange={setLoop}
              aria-label="Loop the clip"
            />
            <Label htmlFor={`loop-${song.id}`} className="cursor-pointer">
              Loop
            </Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <LoadingButton
            type="button"
            loading={saving}
            disabled={!dirty}
            onClick={save}
            className="h-11 sm:h-9"
          >
            Save changes
          </LoadingButton>
          <Button
            type="button"
            variant="ghost"
            disabled={!dirty}
            onClick={reset}
          >
            <RotateCcwIcon className="size-4" /> Reset
          </Button>
          {song.active && (
            <span className="ml-auto text-xs text-muted-foreground">
              This is the song guests hear.
            </span>
          )}
        </div>

        {/* Hidden preview element */}
        <audio
          ref={audioRef}
          src={`/api/music/${song.id}/stream`}
          preload="metadata"
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
