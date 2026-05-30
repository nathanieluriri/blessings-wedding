"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useScrollLock } from "./ScrollLock";

const LETTERBOX_COLOR = "#f7f0e6";
const HOLD_AFTER_MS = 650; // brief rest on the finished mark before fading out

// ease-in-out (cubic). Endpoints are exactly 0 and 1, so easing the trace never
// shifts where a path starts/finishes — the sync points are preserved.
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// monogram.svg as a "ghost outline + tracing pen". The source SVG is built from
// filled compound shapes; we keep the five visible shapes, drop the fills, and
// stroke their contours. Each path carries pathLength={1} so the dash math is
// normalized 0..1 regardless of real length or render size.
//
// `delay`/`duration` (seconds) define each path's window inside one shared
// trace timeline; the longest delay+duration is the total. The counter runs off
// the SAME clock, so it reaches 100 exactly as the final stroke completes.
//   the sweeping curve + "M" lead, the "O" and flourishes build mid-way,
//   the heart finishes the line.
const DRAW: { d: string; transform: string; delay: number; duration: number }[] = [
  // The lead: sweeping curve, dot and the "M" (one large compound path).
  {
    transform: "translate(517,466)",
    delay: 0,
    duration: 2.6,
    d: "m0 0h53l29 3 29 5 28 7 36 12 25 11 19 10 16 9 20 14 12 9 11 9 12 11 10 9 15 16 9 11 13 16 13 18 16 24 14 22 15 27 12 21 19 37 8 16 9 17 11 23 16 34 13 27 13 28 18 37 11 23 13 27 11 23 14 29 11 23 18 38 10 20 5-10 14-36 12-29 16-40 20-49 20-50 15-37 20-49 13-32 11-28 16-39 12-30 16-39 4-8h89l2 2v8l-18 9-5 5-6 8-4 13-1 15 12 210 3 50 4 72 8 142 2 37 3 20 5 20 6 15 5 8 7 6 12 5 2 4-1 6h-133l-1-1v-7l3-3 10-5 9-8 5-8 5-16 3-17 1-24-4-76-11-198-3-53-9-161v-15h-2l-3 10-20 49-13 32-15 37-11 27-16 39-11 27-16 40-15 37-12 30-13 32-12 30-15 37-6 16 12 24 11 23 8 17 10 19 15 30 14 24 9 15 22 33 13 17 8 10 12 14 11 12 15 15 8 7 13 11 15 11 20 13 18 10 21 10 24 9 32 9 25 5 27 3h42l27-3 26-5 29-8v-26l3-8 7-8 4-2h11l8 7 2 4v5h7l6 3 5 6 1 2v12l-4 6-8 6-14 3h-23l-33 11-26 6-29 4-14 1h-38l-26-2-29-4-28-6-31-9-25-9-33-15-22-12-23-15-16-12-11-9-14-12-7-7-7-6-7-8-11-11-9-11-13-16-12-16-15-22-10-15-14-24-16-29-12-23-20-38-11-23-16-33-10-22-7-15-18-37-11-23-9-20-8-16-11-24-8-16-14-30-7-14-9-20-8-16-15-31-13-28-17-34v-3h-2v13l-6 105-11 204-8 143v19l3 14 3 8 8 7 12 5 1 7-2 3h-76l-1-1v-8l4-3 10-4 5-5 5-10 3-14 2-26 7-131 11-209 8-143 1-18-20-40-14-25-15-25-16-24-14-19-11-13-7-8-11-12-16-16-8-7-15-12-20-14-25-14-24-11-27-9-25-6-27-4-13-1h-41l-31 3-35 6-27 7-10 3h-3l2 8v10l-3 9-7 9-8 5-6 2h-12l-9-3-8-6-5-7-3-10v-9l4-11 8-9 10-5 11-1 9 2 9 6 3 3 12-3 25-8 24-6 29-5zm75 10 4 2 24 6 28 10 20 9 19 10 15 10 14 10 14 11 15 14 11 10 7 8 10 11 9 11 10 13 16 23 12 19 9 15 12 21 17 32 7 15 1 5-4 67-10 185-7 129-5 90-2 41-2 20-4 13-5 9-9 9h48l-5-5-3-1-2-4-5-11-2-8-1-10v-12l13-239 7-132 5-87 2-30 4-1 9 17 11 23 17 35 9 19 13 28 17 35 11 23 9 20 8 16 18 38 13 27 13 28 14 29 13 28 14 29 9 19 8 16 9 17 8 16 10 19 10 18 16 28 24 36 10 14 10 13 14 17 10 11 7 8 13 13 8 7 11 10 17 13 18 13 22 13 29 15 19 8 22 8 27 8 33 7 26 4 23 2h30v-1l-7-1-19-1-32-5-26-6-30-10-21-9-16-8-18-10-18-12-14-11-11-9-10-9-8-7-10-10-7-8-12-13-11-14-12-16-11-16-13-20-14-24-6-10-8-16-12-23-18-36-11-23-10-22 1-5 11-27 18-45 17-41 12-31 12-29 10-25 15-37 14-34 16-40 15-36 10-25 17-42 14-35 5-12 4-1 1 1 2 25 5 96 18 327 4 75v13l-3 25-4 16-8 16-5 6-8 6v1h103l-5-5-6-7-6-11-6-16-5-23-2-15-6-111-11-194-11-187-1-13v-18l3-13 5-10 6-8 9-6 5-3v-1h-73l-3 4-11 28-14 34-14 35-20 49-12 30-16 39-19 47-12 30-15 36-11 28-18 44-24 60-7 18h-4l-3-5-9-19-8-16-14-29-12-25-17-35-11-23-15-31-7-16-8-16-11-24-8-16-15-31-9-20-8-16-8-17-22-44-12-22-16-30-10-17-16-27-8-12-11-16-13-18-9-11-12-14-12-13-15-15-11-9-15-12-17-12-18-11-20-11-25-11-34-12-32-8-27-5z",
  },
  // The build: the "O".
  {
    transform: "translate(819,678)",
    delay: 1.0,
    duration: 1.9,
    d: "m0 0 4 2 8 14 3 6-1 4-12 5-18 8-22 12-21 14-12 9-13 11-10 9-16 16-9 11-12 15-11 16-9 15-12 22-10 21-10 27-7 24-5 22-4 25-2 21v53l3 29 6 31 7 26 9 25 10 23 12 22 12 19 10 14 14 18 15 16 15 15 11 9 9 8 15 11 15 10 18 10 14 7 23 9 23 7 23 5 17 2 26 1 29-2 25-5 24-7 25-10 16-8 20-11 15-10 13-10 13-11 16-14 4 1 6 9 9 16 4 7-2 4-12 10-15 10-20 12-16 8-15 7-26 10-27 8-34 7-26 3-12 1h-35l-31-3-23-4-26-6-26-8-29-12-24-12-21-13-15-10-12-9-13-11-11-9-21-21-7-8-11-13-12-16-14-21-9-15-10-19-13-30-9-28-7-30-4-25-2-18-1-33 2-32 5-32 4-19 6-22 9-27 11-24 10-20 13-21 12-17 10-13 12-14 15-16 12-11 11-10 13-10 15-11 20-13 19-11 21-10 27-11zm-5 9-28 10-20 9-30 16-21 14-12 9-16 13-10 9-13 12-15 16-11 13-12 16-13 20-12 21-12 25-10 27-6 20-7 31-4 27-2 26v24l2 28 5 32 6 26 9 27 12 29 11 21 12 20 12 17 14 18 13 15 25 25 11 9 12 10 17 12 19 12 22 12 19 9 24 9 15 5 24 6 27 5 28 3h43l36-4 28-6 28-8 20-7 26-12 19-10 16-10 18-13 3-3-2-5-11-18h-3l-12 11-11 9-19 14-21 13-23 12-27 11-19 6-22 5-26 3h-39l-24-3-22-5-23-7-20-8-26-13-19-12-16-12-20-16-16-15-9-9-7-8-14-17-13-18-13-21-15-29-9-21-11-33-6-25-5-31-2-22v-47l3-33 6-32 7-26 10-28 11-25 11-21 11-18 14-20 13-16 13-15 13-13 8-7 13-11 18-13 19-12 23-12 21-9v-3l-5-9-1-1z",
  },
  // The build: flourishes inside the "O".
  {
    transform: "translate(896,664)",
    delay: 1.3,
    duration: 1.7,
    d: "m0 0h46l30 3 28 5 24 6 26 9 28 12 21 11 26 16 18 13 17 14 15 14 20 20 9 11 10 12 13 19 6 11-3 10-13 31-10 24-5 1-4-9-10-24-8-17-12-21-12-18-10-13-9-11-12-13-15-15-8-7-18-14-17-11-14-8-21-11-20-8-18-6-19-5-29-5-13-1h-26l-6-8-7-12 1-4zm9 6v4l4 7 6 1 26 1 23 3 23 5 17 5 27 10 23 11 26 16 14 10 13 11 8 7 10 9 10 10 9 11 10 12 13 18 10 16 10 18 12 25 4 12h2l13-31 7-17-1-7-12-18-11-14-9-10-7-8-9-10-9-9-8-7-14-12-19-14-22-14-22-12-19-9-31-12-28-8-31-6-25-3-25-1z",
  },
  {
    transform: "translate(1253,879)",
    delay: 1.5,
    duration: 1.7,
    d: "m0 0 4 4 10 24 7 24 6 24 5 30 2 18 1 17v31l-2 26-5 30-6 25-8 26-11 27-13 27-11 18-12 17-11 14-11 13-4 2-6-10-17-33-1-4 6-12 9-16 11-23 9-24 5-16 6-24 5-27 3-29v-46l-4-38-2-14 12-30 13-32 6-15zm-1 15-13 32-10 24-4 12 3 19 3 31v42l-3 31-3 20-6 27-6 20-10 27-14 29-11 19 1 7 14 27 2 4 4-2 8-10 10-13 13-20 9-16 10-19 11-28 10-32 6-27 4-29 1-13v-45l-3-29-7-36-7-25-7-20-3-7z",
  },
  // The finale: the heart at the end of the sweep.
  {
    transform: "translate(1636,1450)",
    delay: 2.6,
    duration: 0.9,
    d: "m0 0h6l5 4 2 6 1 6h11l5 4 2 7-3 6-5 4-6 2h-23l-3-2-1-9v-15l3-8z",
  },
];

// Total length of the trace timeline (longest path window).
const TRACE_TOTAL_SEC = Math.max(...DRAW.map((p) => p.delay + p.duration));
const DRAW_DURATION_MS = TRACE_TOTAL_SEC * 1000;

// How far a single path is traced (0..1) given the global trace progress.
function pathDrawn(p: { delay: number; duration: number }, progress: number) {
  const local = (progress * TRACE_TOTAL_SEC - p.delay) / p.duration;
  return easeInOut(Math.min(1, Math.max(0, local)));
}

// `progress` is the shared 0..1 clock (also drives the counter).
function Monogram({ progress }: { progress: number }) {
  return (
    <motion.svg
      viewBox="0 0 2048 1817"
      className="w-[clamp(220px,52vw,440px)] h-auto"
      // gentle settle so the focus stays on the line drawing itself in
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Ofodimma monogram"
      role="img"
    >
      {/* the ghost: full outline, faint, visible from the start */}
      {DRAW.map((p, i) => (
        <path
          key={`ghost-${i}`}
          className="monogram-ghost"
          d={p.d}
          transform={p.transform}
          pathLength={1}
        />
      ))}
      {/* the tracing pen: drawn in lockstep with the counter */}
      {DRAW.map((p, i) => (
        <path
          key={`trace-${i}`}
          className="monogram-trace"
          d={p.d}
          transform={p.transform}
          pathLength={1}
          style={{ strokeDashoffset: 1 - pathDrawn(p, progress) }}
        />
      ))}
    </motion.svg>
  );
}

export default function OpeningSequence() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useScrollLock("opening-sequence", !done);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  // One clock drives both the trace and the counter: progress runs 0 -> 1 over
  // the trace window, so the counter reaches 100 exactly as the last stroke
  // lands. Then hold briefly and fade out.
  useEffect(() => {
    let raf = 0;
    let start = 0;
    let holdTimer = 0;

    const tick = (t: number) => {
      if (!start) start = t;
      const ratio = Math.min(1, (t - start) / DRAW_DURATION_MS);
      setProgress(ratio);
      if (ratio >= 1) {
        holdTimer = window.setTimeout(() => setDone(true), HOLD_AFTER_MS);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (holdTimer) window.clearTimeout(holdTimer);
    };
  }, []);

  const skip = () => setDone(true);
  const pct = Math.round(progress * 100);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="opening-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: LETTERBOX_COLOR }}
          onClick={skip}
        >
          {/* progress — pinned to the top */}
          <div className="pointer-events-none absolute inset-x-0 top-[12vh] flex flex-col items-center gap-4">
            <span
              className="font-serif tabular-nums text-gray-900/80 text-4xl sm:text-5xl tracking-wider"
              aria-live="polite"
            >
              {String(pct).padStart(2, "0")}
            </span>
            <div className="relative h-px w-32 sm:w-40 overflow-hidden bg-gray-900/15">
              <div
                className="absolute inset-y-0 left-0 bg-gray-900/60"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* the monogram — ghost outline + tracing pen, centered */}
          <Monogram progress={progress} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
