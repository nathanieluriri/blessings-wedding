"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VolumeXIcon } from "lucide-react";
import type { ActiveSongClient } from "@/lib/music/shared";
import { clampVolume } from "@/lib/music/shared";

/**
 * Plays the active background song softly behind the invitation.
 *
 * Browsers block audible autoplay until the guest makes a real activation
 * gesture — a tap/click/keypress, NOT a scroll or swipe — so playback begins on
 * the guest's first such gesture anywhere on the page. We keep retrying on every
 * gesture until the element actually fires `playing` (the original code used
 * `once`, so the first blocked attempt on mobile removed every listener and it
 * never retried). The opening sequence auto-runs without a tap, so a gently
 * pulsing "Tap for sound" hint shows guests how to start the music.
 *
 * Volume + fade run through a Web Audio gain node because iOS ignores
 * HTMLMediaElement.volume entirely (it always reads 1). Without this the song
 * would ignore its configured level and play at full device volume on iPhones.
 * We fall back to element.volume where Web Audio is unavailable.
 */
export default function BackgroundMusic({
  song,
}: {
  song: ActiveSongClient | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const startedRef = useRef(false);
  const fadeRef = useRef<number | null>(null);

  // Web Audio graph (built lazily inside a user gesture) so level/fade work on iOS.
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [ready, setReady] = useState(false); // control visible
  const [soundOn, setSoundOn] = useState(false); // audible (not muted)
  const [needsTap, setNeedsTap] = useState(true); // show the "tap for sound" hint

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const clearFade = useCallback(() => {
    if (fadeRef.current != null) {
      clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  }, []);

  // Build the Web Audio graph once and resume it. MUST run inside a user-gesture
  // handler on iOS. Returns the gain node, or null when Web Audio is unavailable
  // (callers then fall back to element.volume).
  const ensureGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return null;
    if (gainRef.current) {
      void ctxRef.current?.resume().catch(() => {});
      return gainRef.current;
    }
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain).connect(ctx.destination);
      ctxRef.current = ctx;
      sourceRef.current = source;
      gainRef.current = gain;
      void ctx.resume().catch(() => {});
      // The element now feeds the graph; let the gain node own the level.
      audio.volume = 1;
      return gain;
    } catch {
      return null;
    }
  }, []);

  const rampVolume = useCallback(
    (target: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      clearFade();
      const gain = gainRef.current;
      const ctx = ctxRef.current;
      if (gain && ctx) {
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
        if (prefersReducedMotion) {
          gain.gain.setValueAtTime(target, t);
        } else {
          gain.gain.linearRampToValueAtTime(Math.max(target, 0.0001), t + 1.4);
        }
        return;
      }
      // Fallback for browsers without Web Audio (element.volume; a no-op on iOS).
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
    const gain = ensureGraph();
    try {
      if (audio.currentTime < song.trimStart || audio.currentTime >= song.trimEnd) {
        audio.currentTime = song.trimStart;
      }
    } catch {
      /* seek may be deferred until metadata loads; the timeupdate loop corrects it */
    }
    audio.muted = false;
    const target = clampVolume(song.volume);
    // Begin silent so the fade is audible from zero.
    if (gain) gain.gain.value = 0;
    else audio.volume = 0;
    audio
      .play()
      .then(() => {
        setSoundOn(true);
        setNeedsTap(false);
        rampVolume(target);
      })
      .catch(() => {
        // Autoplay still blocked — reset so the next gesture retries, and keep
        // the control (with its hint) so the guest can tap it.
        startedRef.current = false;
        if (gain) gain.gain.value = target;
        else audio.volume = target;
      });
  }, [song, rampVolume, ensureGraph]);

  // Begin on the guest's first activation gesture anywhere on the page. We must
  // keep retrying until playback ACTUALLY starts: on mobile a scroll/swipe's
  // touchstart/pointerdown does NOT grant the activation that audio.play() needs
  // — only touchend/pointerup/click/keydown do. So we listen for all of them and
  // only detach once the element fires `playing`.
  useEffect(() => {
    if (!song) return;
    const audio = audioRef.current;
    const events = [
      "touchend",
      "pointerup",
      "click",
      "keydown",
      "pointerdown",
      "touchstart",
    ] as const;
    const onGesture = () => {
      // Resume the graph on every gesture so a real activating gesture
      // un-suspends a context an earlier non-activating one may have created.
      void ctxRef.current?.resume().catch(() => {});
      start();
    };
    const opts = { passive: true } as const;
    events.forEach((e) => window.addEventListener(e, onGesture, opts));
    const detach = () =>
      events.forEach((e) => window.removeEventListener(e, onGesture));
    // Stop listening only once we're truly playing, not merely on first attempt.
    const onPlaying = () => {
      setSoundOn(true);
      setNeedsTap(false);
      detach();
    };
    audio?.addEventListener("playing", onPlaying);
    // Reveal the control even without a gesture so guests can choose to play.
    const revealTimer = window.setTimeout(() => setReady(true), 2500);
    return () => {
      detach();
      audio?.removeEventListener("playing", onPlaying);
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

  useEffect(
    () => () => {
      clearFade();
      void ctxRef.current?.close().catch(() => {});
    },
    [clearFade]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !song) return;
    if (!startedRef.current) {
      start();
      return;
    }
    void ctxRef.current?.resume().catch(() => {});
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

  const hinting = ready && needsTap && !soundOn;

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
        data-hint={hinting ? "true" : undefined}
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
        {hinting && (
          <span className="bg-music-hint" aria-hidden="true">
            Tap for sound
          </span>
        )}
        <span className="sr-only">{soundOn ? "Sound on" : "Sound off"}</span>
      </button>
    </>
  );
}
