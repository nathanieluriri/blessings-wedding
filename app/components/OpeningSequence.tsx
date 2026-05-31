/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useScrollLock } from "./ScrollLock";
import { SocialIcon } from "@/components/social-icons";
import { SOCIAL_LABEL, type VisibleSocialLink } from "@/lib/social";

// Wedding photos served from /public/wedding. They cross-fade inside the frame
// as it expands to full-bleed; the LAST one stays as the hero background.
const WEDDING_IMAGES = [
  "/wedding/1.webp",
  "/wedding/2.webp",
  "/wedding/3.webp",
  "/wedding/4.webp",
];
const HERO_IMAGE = WEDDING_IMAGES[WEDDING_IMAGES.length - 1];

// Each photo starts at its OWN size (bottom-of-stack largest -> front-most
// smallest) instead of all sharing one scale. The steps are ~10x apart, so each
// inner photo erupts from almost a single point: image 1 is the backdrop, then
// 2/3/4 burst out in turn, each visible for a beat before the next grows out and
// covers it. Index matches DOM order in .intro-frame.
const FRAME_START_SCALES = [0.46, 0.01, 0.0001, 0.000001];

// ease-in-out (cubic). Endpoints are exactly 0 and 1, so easing the trace never
// shifts where a path starts/finishes — the sync points are preserved.
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// monogram.svg as a "ghost outline + tracing pen". Filled compound shapes with
// the fills dropped; we stroke their contours. pathLength={1} normalizes the
// dash math. `delay`/`duration` define each path's window in one shared trace
// timeline; the counter is driven off the SAME clock, so it hits 100 exactly as
// the trace completes.
const DRAW: { d: string; transform: string; delay: number; duration: number }[] = [
  {
    transform: "translate(517,466)",
    delay: 0,
    duration: 2.6,
    d: "m0 0h53l29 3 29 5 28 7 36 12 25 11 19 10 16 9 20 14 12 9 11 9 12 11 10 9 15 16 9 11 13 16 13 18 16 24 14 22 15 27 12 21 19 37 8 16 9 17 11 23 16 34 13 27 13 28 18 37 11 23 13 27 11 23 14 29 11 23 18 38 10 20 5-10 14-36 12-29 16-40 20-49 20-50 15-37 20-49 13-32 11-28 16-39 12-30 16-39 4-8h89l2 2v8l-18 9-5 5-6 8-4 13-1 15 12 210 3 50 4 72 8 142 2 37 3 20 5 20 6 15 5 8 7 6 12 5 2 4-1 6h-133l-1-1v-7l3-3 10-5 9-8 5-8 5-16 3-17 1-24-4-76-11-198-3-53-9-161v-15h-2l-3 10-20 49-13 32-15 37-11 27-16 39-11 27-16 40-15 37-12 30-13 32-12 30-15 37-6 16 12 24 11 23 8 17 10 19 15 30 14 24 9 15 22 33 13 17 8 10 12 14 11 12 15 15 8 7 13 11 15 11 20 13 18 10 21 10 24 9 32 9 25 5 27 3h42l27-3 26-5 29-8v-26l3-8 7-8 4-2h11l8 7 2 4v5h7l6 3 5 6 1 2v12l-4 6-8 6-14 3h-23l-33 11-26 6-29 4-14 1h-38l-26-2-29-4-28-6-31-9-25-9-33-15-22-12-23-15-16-12-11-9-14-12-7-7-7-6-7-8-11-11-9-11-13-16-12-16-15-22-10-15-14-24-16-29-12-23-20-38-11-23-16-33-10-22-7-15-18-37-11-23-9-20-8-16-11-24-8-16-14-30-7-14-9-20-8-16-15-31-13-28-17-34v-3h-2v13l-6 105-11 204-8 143v19l3 14 3 8 8 7 12 5 1 7-2 3h-76l-1-1v-8l4-3 10-4 5-5 5-10 3-14 2-26 7-131 11-209 8-143 1-18-20-40-14-25-15-25-16-24-14-19-11-13-7-8-11-12-16-16-8-7-15-12-20-14-25-14-24-11-27-9-25-6-27-4-13-1h-41l-31 3-35 6-27 7-10 3h-3l2 8v10l-3 9-7 9-8 5-6 2h-12l-9-3-8-6-5-7-3-10v-9l4-11 8-9 10-5 11-1 9 2 9 6 3 3 12-3 25-8 24-6 29-5zm75 10 4 2 24 6 28 10 20 9 19 10 15 10 14 10 14 11 15 14 11 10 7 8 10 11 9 11 10 13 16 23 12 19 9 15 12 21 17 32 7 15 1 5-4 67-10 185-7 129-5 90-2 41-2 20-4 13-5 9-9 9h48l-5-5-3-1-2-4-5-11-2-8-1-10v-12l13-239 7-132 5-87 2-30 4-1 9 17 11 23 17 35 9 19 13 28 17 35 11 23 9 20 8 16 18 38 13 27 13 28 14 29 13 28 14 29 9 19 8 16 9 17 8 16 10 19 10 18 16 28 24 36 10 14 10 13 14 17 10 11 7 8 13 13 8 7 11 10 17 13 18 13 22 13 29 15 19 8 22 8 27 8 33 7 26 4 23 2h30v-1l-7-1-19-1-32-5-26-6-30-10-21-9-16-8-18-10-18-12-14-11-11-9-10-9-8-7-10-10-7-8-12-13-11-14-12-16-11-16-13-20-14-24-6-10-8-16-12-23-18-36-11-23-10-22 1-5 11-27 18-45 17-41 12-31 12-29 10-25 15-37 14-34 16-40 15-36 10-25 17-42 14-35 5-12 4-1 1 1 2 25 5 96 18 327 4 75v13l-3 25-4 16-8 16-5 6-8 6v1h103l-5-5-6-7-6-11-6-16-5-23-2-15-6-111-11-194-11-187-1-13v-18l3-13 5-10 6-8 9-6 5-3v-1h-73l-3 4-11 28-14 34-14 35-20 49-12 30-16 39-19 47-12 30-15 36-11 28-18 44-24 60-7 18h-4l-3-5-9-19-8-16-14-29-12-25-17-35-11-23-15-31-7-16-8-16-11-24-8-16-15-31-9-20-8-16-8-17-22-44-12-22-16-30-10-17-16-27-8-12-11-16-13-18-9-11-12-14-12-13-15-15-11-9-15-12-17-12-18-11-20-11-25-11-34-12-32-8-27-5z",
  },
  {
    transform: "translate(819,678)",
    delay: 1.0,
    duration: 1.9,
    d: "m0 0 4 2 8 14 3 6-1 4-12 5-18 8-22 12-21 14-12 9-13 11-10 9-16 16-9 11-12 15-11 16-9 15-12 22-10 21-10 27-7 24-5 22-4 25-2 21v53l3 29 6 31 7 26 9 25 10 23 12 22 12 19 10 14 14 18 15 16 15 15 11 9 9 8 15 11 15 10 18 10 14 7 23 9 23 7 23 5 17 2 26 1 29-2 25-5 24-7 25-10 16-8 20-11 15-10 13-10 13-11 16-14 4 1 6 9 9 16 4 7-2 4-12 10-15 10-20 12-16 8-15 7-26 10-27 8-34 7-26 3-12 1h-35l-31-3-23-4-26-6-26-8-29-12-24-12-21-13-15-10-12-9-13-11-11-9-21-21-7-8-11-13-12-16-14-21-9-15-10-19-13-30-9-28-7-30-4-25-2-18-1-33 2-32 5-32 4-19 6-22 9-27 11-24 10-20 13-21 12-17 10-13 12-14 15-16 12-11 11-10 13-10 15-11 20-13 19-11 21-10 27-11zm-5 9-28 10-20 9-30 16-21 14-12 9-16 13-10 9-13 12-15 16-11 13-12 16-13 20-12 21-12 25-10 27-6 20-7 31-4 27-2 26v24l2 28 5 32 6 26 9 27 12 29 11 21 12 20 12 17 14 18 13 15 25 25 11 9 12 10 17 12 19 12 22 12 19 9 24 9 15 5 24 6 27 5 28 3h43l36-4 28-6 28-8 20-7 26-12 19-10 16-10 18-13 3-3-2-5-11-18h-3l-12 11-11 9-19 14-21 13-23 12-27 11-19 6-22 5-26 3h-39l-24-3-22-5-23-7-20-8-26-13-19-12-16-12-20-16-16-15-9-9-7-8-14-17-13-18-13-21-15-29-9-21-11-33-6-25-5-31-2-22v-47l3-33 6-32 7-26 10-28 11-25 11-21 11-18 14-20 13-16 13-15 13-13 8-7 13-11 18-13 19-12 23-12 21-9v-3l-5-9-1-1z",
  },
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
  {
    transform: "translate(1636,1450)",
    delay: 2.6,
    duration: 0.9,
    d: "m0 0h6l5 4 2 6 1 6h11l5 4 2 7-3 6-5 4-6 2h-23l-3-2-1-9v-15l3-8z",
  },
];

const TRACE_TOTAL_SEC = Math.max(...DRAW.map((p) => p.delay + p.duration));

function pathDrawn(p: { delay: number; duration: number }, progress: number) {
  const local = (progress * TRACE_TOTAL_SEC - p.delay) / p.duration;
  return easeInOut(Math.min(1, Math.max(0, local)));
}

function Monogram({ progress }: { progress: number }) {
  return (
    <svg
      viewBox="0 0 2048 1817"
      className="h-auto w-full"
      aria-label="Ofodimma monogram"
      role="img"
    >
      {DRAW.map((p, i) => (
        <path
          key={`ghost-${i}`}
          className="monogram-ghost"
          d={p.d}
          transform={p.transform}
          pathLength={1}
        />
      ))}
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
    </svg>
  );
}

// 0-9 plus a trailing 0 so the units reel can roll past 9 back to 0 seamlessly.
const REEL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const REEL_SPANS = REEL.length; // 11

// Line-art long-stem rose, echoing the reference poster: the stem is rooted at
// the bottom-OUTER corner (so it reads as growing from the screen edge) and
// sweeps up and inward to the bloom. Drawn left-oriented; the right copy is
// mirrored in CSS. Each path has pathLength={1} so the intro can "draw" it on by
// animating stroke-dashoffset 1 -> 0.
const FLOWER_STROKES = [
  // stem — curves up from the bottom-left corner to the bloom
  "M18 430C70 380 58 300 96 258 128 222 120 192 150 150",
  // bloom — outer silhouette
  "M150 156C120 156 104 132 110 106 116 84 136 74 150 82 164 74 184 84 190 106 196 132 180 156 150 156Z",
  // bloom — inner petal swirls
  "M150 150C132 146 124 126 132 110 138 98 148 94 150 92",
  "M150 150C168 146 176 126 168 110 162 98 152 94 150 92",
  "M138 120C142 108 150 100 150 100 150 100 158 108 162 120",
  "M150 150C150 130 150 112 150 96",
  // sepals at the bloom base
  "M150 156C144 166 136 170 130 168",
  "M150 156C156 166 164 170 170 168",
  // lower leaf (off the stem, pointing back toward the corner) + vein
  "M62 341C40 352 22 346 14 326 36 318 56 326 62 340Z",
  "M56 338C40 334 30 330 20 326",
  // upper leaf (off the stem, reaching inward) + vein
  "M124 206C150 214 170 206 178 184 154 178 134 188 124 202Z",
  "M131 200C150 196 160 192 170 188",
];

const FLOWER_DOTS: [number, number, number][] = [
  [34, 418, 2.4],
  [16, 404, 1.8],
  [46, 430, 2],
  [26, 432, 1.6],
  [54, 416, 1.6],
];

function HeroFlower({ side }: { side: "l" | "r" }) {
  return (
    <div className={`intro-flower intro-flower-${side}`} aria-hidden="true">
      <svg viewBox="0 0 220 440" role="img" aria-hidden="true">
        {FLOWER_STROKES.map((d, i) => (
          <path key={i} className="flower-stroke" d={d} pathLength={1} />
        ))}
        {FLOWER_DOTS.map(([cx, cy, r], i) => (
          <circle key={i} className="flower-dot" cx={cx} cy={cy} r={r} />
        ))}
      </svg>
    </div>
  );
}

export default function OpeningSequence({
  socialLinks = [],
}: {
  socialLinks?: VisibleSocialLink[];
}) {
  const [progress, setProgress] = useState(0);
  const [introDone, setIntroDone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useScrollLock("opening-sequence", !introDone);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (introDone) return;
    const root = rootRef.current;
    if (!root) return;

    const q = (s: string) => root.querySelector<HTMLElement>(s);
    const qa = (s: string) => Array.from(root.querySelectorAll<HTMLElement>(s));

    const preloader = q(".intro-preloader");
    const counterEl = q(".intro-counter");
    const pctEl = q(".intro-pct");
    const markEl = q(".intro-mark");
    const revealEl = q(".intro-reveal-wrap");
    const frameEl = q(".intro-frame");
    const frameImgs = qa(".intro-frame img");
    const reelTracks = qa(".intro-reel-track"); // [tens, units]
    const words = qa(".intro-word span");
    const topbar = qa(".intro-topbar > *");
    const eyebrow = q(".intro-eyebrow");
    const sub = q(".intro-sub");
    const hash = q(".intro-hash");
    const cta = q(".intro-cta");
    const flowers = qa(".intro-flower");
    const flowerStrokes = qa(".flower-stroke");
    const flowerDots = qa(".flower-dot");

    // Scroll-dial: feed CONTINUOUS values so the reels roll smoothly (an
    // odometer) instead of snapping. Units rolls fast; tens/hundreds roll only
    // as the lower wheel passes 9 -> 0. yPercent is relative to the 11-span
    // track, so -(val/11)*100 puts digit `val` (0..10) in the window.
    // Two-digit scroll dial, 00 -> 99. Continuous values so the reels ROLL like
    // an odometer (units fast; tens only as the units wheel passes 9). Both reels
    // stay visible, so the start reads "00" and the finish reads "99".
    const updateDial = (c: number) => {
      const uVal = c % 10;
      const tVal = Math.floor(c / 10) + Math.max(0, (c % 10) - 9);
      gsap.set(reelTracks[0], { yPercent: -(tVal / REEL_SPANS) * 100 }); // tens
      gsap.set(reelTracks[1], { yPercent: -(uVal / REEL_SPANS) * 100 }); // units
    };

    const counter = { v: 0 };
    updateDial(0);
    setProgress(0);

    // ---- initial states ----
    gsap.set(markEl, { autoAlpha: 0, y: 18, scale: 0.96 });
    gsap.set([counterEl, pctEl], { autoAlpha: 0, y: 12 });
    gsap.set(frameEl, { autoAlpha: 1 });
    // every photo is a full-viewport layer; each starts at its OWN small size
    // (front-most smallest), so from the first frame they're nested and every
    // image is visible before the one above grows out over it.
    gsap.set(frameImgs, {
      autoAlpha: 1,
      scale: (i: number) => FRAME_START_SCALES[i] ?? 0.1,
      transformOrigin: "50% 50%",
    });
    // hero content waits for the hand-off
    gsap.set(words, { yPercent: 115 });
    gsap.set(topbar, { autoAlpha: 0, y: -10 });
    gsap.set([eyebrow, sub, hash, cta], { autoAlpha: 0, y: 14 });
    // flowers start un-drawn (dash fully offset) and invisible; they're drawn on
    // during the hero reveal in lockstep with the message.
    gsap.set(flowers, { autoAlpha: 0 });
    gsap.set(flowerStrokes, { strokeDashoffset: 1 });
    gsap.set(flowerDots, { autoAlpha: 0 });

    const tl = gsap.timeline({ onComplete: () => setIntroDone(true) });
    tlRef.current = tl;

    tl
      // 1. preloader content in
      .to(markEl, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out" })
      .to([counterEl, pctEl], { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, "-=.6")
      // 2. count 0 -> 100, driving BOTH the reels and the monogram trace
      .to(
        counter,
        {
          v: 99,
          duration: 2.4,
          ease: "power2.inOut",
          onUpdate: () => {
            updateDial(counter.v);
            setProgress(counter.v / 99); // trace still completes at the end
          },
          onComplete: () => {
            updateDial(99); // resting state reads "99"
            setProgress(1);
          },
        },
        "-=.1",
      )
      // 3. preloader out
      .to([counterEl, pctEl], { autoAlpha: 0, y: -14, duration: 0.5, ease: "power2.in" }, "+=.2")
      .to(markEl, { autoAlpha: 0, y: -22, scale: 0.97, duration: 0.6, ease: "power2.in" }, "<")
      .to(preloader, { autoAlpha: 0, duration: 0.6 }, "-=.2")
      // 4. all four photos expand SIMULTANEOUSLY from tiny, at DIFFERENT speeds,
      //    so they're always nested at different sizes (every edge visible) and
      //    ease out / decelerate as they converge into a tight stack.
      .addLabel("rev", "-=0.3")
      // Each photo grows fast to its size then KEEPS creeping (long power3.out
      // tails) — so none ever stops within the window. Different start sizes =>
      // always nested, every edge visible. The smaller it starts, the FASTER it
      // expands, so each rushes out to take its turn covering the one below it.
      .to(frameImgs[0], { scale: 0.8, duration: 4.9, ease: "power3.out" }, "rev")
      .to(frameImgs[1], { scale: 0.68, duration: 4.4, ease: "power3.out" }, "rev")
      .to(frameImgs[2], { scale: 0.57, duration: 4.0, ease: "power3.out" }, "rev")
      .to(frameImgs[3], { scale: 0.47, duration: 3.6, ease: "power3.out" }, "rev")
      // once the front photo has grown to a reasonable size, IT *and its frame*
      // grow to the FULL viewport so image 4 truly fills the screen (frame size
      // animated inline, so it works regardless of the frame's base CSS). The
      // other photos fade as image 4 covers them.
      .to(
        frameImgs[3],
        { scale: 1, duration: 1.4, ease: "power2.inOut", overwrite: "auto" },
        "rev+=1.9",
      )
      .to(
        frameEl,
        { width: "100vw", height: "100vh", duration: 1.4, ease: "power2.inOut" },
        "rev+=1.9",
      )
      .to(
        [frameImgs[0], frameImgs[1], frameImgs[2]],
        { autoAlpha: 0, duration: 0.9, ease: "power2.in" },
        "rev+=1.9",
      )
      // 5. hand off: fade the expanded clone to reveal the real hero (image 4)
      .to(revealEl, { autoAlpha: 0, duration: 0.7, ease: "power2.inOut" }, "rev+=3.3")
      // 6. hero content reveal — wordmark, eyebrow, masked names, message,
      //    hashtag, CTA (top-to-bottom so the invitation "writes itself" in)
      .to(topbar, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=.5")
      .to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=.45")
      .to(words, { yPercent: 0, duration: 1.0, ease: "power4.out", stagger: 0.12 }, "-=.4")
      // flowers fade in faintly, then their strokes draw on like ink
      .to(flowers, { autoAlpha: 0.62, duration: 0.5, ease: "power2.out" }, "-=.5")
      .to(
        flowerStrokes,
        { strokeDashoffset: 0, duration: 1.5, ease: "power1.inOut", stagger: 0.03 },
        "<",
      )
      .to(flowerDots, { autoAlpha: 1, duration: 0.4, stagger: 0.04 }, "-=.45")
      .to(sub, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=.9")
      .to(hash, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=.55")
      .to(cta, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=.5");

    // Failsafe: the scroll stays locked until the intro finishes, so if the
    // timeline ever stalls (a slow/aborted asset, a hiccup), force the hand-off
    // shortly after the intro's own runtime so the page can never lock up.
    const failSafe = window.setTimeout(
      () => setIntroDone(true),
      (tl.duration() + 4) * 1000,
    );

    return () => {
      window.clearTimeout(failSafe);
      tl.kill();
      tlRef.current = null;
    };
  }, [introDone]);

  // Skip: fast-forward the timeline so the hero settles into its final state.
  const skip = () => {
    if (tlRef.current) tlRef.current.progress(1);
    else setIntroDone(true);
  };

  const goRsvp = () =>
    document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div ref={rootRef}>
      {/* The hero (in normal flow) — wedding image 4 with the headline overlaid */}
      <section id="hero" className="intro-hero" aria-label="Wedding invitation">
        <div className="intro-hero-bg">
          <img
            src={HERO_IMAGE}
            alt="Blessing & Justice"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="intro-veil" />

        <HeroFlower side="l" />
        <HeroFlower side="r" />

        <div className="intro-topbar">
          <div className="intro-wordmark">OFODIMMA</div>
          {socialLinks.length > 0 && (
            <nav className="intro-social" aria-label="Our social links">
              {socialLinks.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="intro-social-link"
                  aria-label={SOCIAL_LABEL[link.platform]}
                >
                  <SocialIcon
                    platform={link.platform}
                    className="intro-social-ico"
                  />
                </a>
              ))}
            </nav>
          )}
        </div>

        <div className="intro-invite">
          <p className="intro-eyebrow">
            You are cordially invited to
            <br />
            celebrate the wedding of
          </p>

          <div className="intro-headline">
            <div className="intro-word intro-name1">
              <span>Blessing</span>
            </div>
            <div className="intro-word intro-name2">
              <span>&amp; Justice</span>
            </div>
          </div>

          <p className="intro-sub">
            We would like to invite you to celebrate with us on the most special
            day of our lives. It would be an honor to have you present at this
            important moment.
          </p>

          <p className="intro-hash">#OFODIMMA</p>

          <button type="button" className="intro-cta" onClick={goRsvp}>
            RSVP
          </button>
        </div>
      </section>

      {/* Fixed intro overlays — removed once the intro finishes */}
      {!introDone && (
        <>
          <div className="intro-reveal-wrap" aria-hidden="true">
            <div className="intro-frame">
              {WEDDING_IMAGES.map((src) => (
                <img key={src} src={src} alt="" decoding="async" />
              ))}
            </div>
          </div>

          <div className="intro-preloader" onClick={skip}>
            <div className="intro-counter" aria-live="polite">
              {["t", "u"].map((pos) => (
                <span key={pos} className="intro-reel">
                  <span className="intro-reel-track">
                    {REEL.map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                  </span>
                </span>
              ))}
            </div>
            <div className="intro-mark">
              <Monogram progress={progress} />
            </div>
            <div className="intro-pct">%</div>
          </div>
        </>
      )}
    </div>
  );
}
