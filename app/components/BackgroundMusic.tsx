"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VolumeXIcon } from "lucide-react";
import type { ActiveSongClient } from "@/lib/music/shared";
import { clampVolume } from "@/lib/music/shared";

/**
 * Plays the active background song softly behind the invitation. Because
 * browsers block audible autoplay, playback begins on the guest's FIRST gesture
 * (the opening-sequence tap, a scroll, any pointer/key press). A small floating
 * button lets guests mute / unmute. Renders nothing when there is no song.
 */
export default function BackgroundMusic({
  song,
}: {
  song: ActiveSongClient | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const startedRef = useRef(false);
  const fadeRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false); // control visible
  const [soundOn, setSoundOn] = useState(false); // audible (not muted)

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const clearFade = useCallback(() => {
    if (fadeRef.current != null) {
      clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  }, []);

  const rampVolume = useCallback(
    (target: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      clearFade();
      if (prefersReducedMotion) {
        audio.volume = target;
        return;
      }
      const steps = 28;
      let i = 0;
      audio.volume = 0;
      fadeRef.current = window.setInterval(() => {
        i += 1;
        audio.volume = Math.min(target, (i / steps) * target);
        if (i >= steps) clearFade();
      }, 1400 / steps);
    },
    [clearFade, prefersReducedMotion]
  );

  const start = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !song || startedRef.current) return;
    startedRef.current = true;
    setReady(true);
    try {
      if (audio.currentTime < song.trimStart || audio.currentTime >= song.trimEnd) {
        audio.currentTime = song.trimStart;
      }
    } catch {
      /* seek may be deferred until metadata loads; the timeupdate loop corrects it */
    }
    audio.muted = false;
    const target = clampVolume(song.volume);
    audio
      .play()
      .then(() => {
        setSoundOn(true);
        rampVolume(target);
      })
      .catch(() => {
        // Autoplay still blocked — keep the control so the guest can tap it.
        startedRef.current = false;
        audio.volume = target;
      });
  }, [song, rampVolume]);

  // Begin on the first user gesture anywhere on the page.
  useEffect(() => {
    if (!song) return;
    const onGesture = () => start();
    const opts = { once: true, passive: true } as const;
    window.addEventListener("pointerdown", onGesture, opts);
    window.addEventListener("keydown", onGesture, opts);
    window.addEventListener("touchstart", onGesture, opts);
    // Reveal the control even without a gesture so guests can choose to play.
    const revealTimer = window.setTimeout(() => setReady(true), 2500);
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
      window.clearTimeout(revealTimer);
    };
  }, [song, start]);

  // Keep playback inside the trimmed clip (manual loop / stop at clip end).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !song) return;
    const onTime = () => {
      if (audio.currentTime >= song.trimEnd - 0.05) {
        if (song.loop) {
          audio.currentTime = song.trimStart;
        } else {
          audio.pause();
          setSoundOn(false);
        }
      }
    };
    const onLoaded = () => {
      if (!startedRef.current && audio.currentTime < song.trimStart) {
        try {
          audio.currentTime = song.trimStart;
        } catch {
          /* ignore */
        }
      }
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [song]);

  useEffect(() => () => clearFade(), [clearFade]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !song) return;
    if (!startedRef.current) {
      start();
      return;
    }
    if (audio.muted || audio.paused) {
      audio.muted = false;
      if (audio.paused) void audio.play().catch(() => {});
      setSoundOn(true);
    } else {
      audio.muted = true;
      setSoundOn(false);
    }
  }, [song, start]);

  if (!song) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={`/api/music/${song.id}/stream`}
        preload="auto"
        loop={false}
        playsInline
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={soundOn ? "Mute music" : "Play music"}
        aria-pressed={soundOn}
        data-ready={ready ? "true" : undefined}
        data-playing={soundOn ? "true" : undefined}
        className="bg-music-control"
      >
        {soundOn ? (
          <span className="bg-music-eq" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
        ) : (
          <VolumeXIcon className="bg-music-icon" aria-hidden="true" />
        )}
        <span className="sr-only">{soundOn ? "Sound on" : "Sound off"}</span>
      </button>
    </>
  );
}
