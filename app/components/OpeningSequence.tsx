"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useScrollLock } from "./ScrollLock";

const FRAME_COUNT = 240;
const FRAME_PATH = "/opening_frames";
const TARGET_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const LETTERBOX_COLOR = "#f7f0e6";
const HINT_DELAY_MS = 600;
const MAX_FRAME_WIDTH = 1200;

const frameSrc = (i: number) =>
  `${FRAME_PATH}/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;

type Phase = "loading" | "playing" | "settled";

export default function OpeningSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const dprRef = useRef(1);
  const currentFrameRef = useRef(1);

  const [phase, setPhase] = useState<Phase>("loading");
  const [loadedCount, setLoadedCount] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useScrollLock("opening-sequence", !dismissed);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (phase !== "settled") return;
    window.scrollTo(0, 0);
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    let count = 0;
    const imgs: HTMLImageElement[] = new Array(FRAME_COUNT);

    const onSettled = () => {
      if (cancelled) return;
      count += 1;
      setLoadedCount(count);
      if (count === FRAME_COUNT) setPhase("playing");
    };

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = frameSrc(i);
      img.onload = onSettled;
      img.onerror = onSettled;
      imgs[i - 1] = img;
    }
    imagesRef.current = imgs;

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const applyDefaults = () => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };

    const draw = (i: number) => {
      const img = imagesRef.current[i - 1];
      const dpr = dprRef.current;
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;
      ctx.fillStyle = LETTERBOX_COLOR;
      ctx.fillRect(0, 0, cw, ch);
      if (!img || !img.complete || !img.naturalWidth) return;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const fitScale = Math.min(cw / iw, ch / ih);
      const maxWidthScale = MAX_FRAME_WIDTH / iw;
      const scale = Math.min(fitScale, maxWidthScale);
      const drawW = iw * scale;
      const drawH = ih * scale;
      const dx = Math.round((cw - drawW) / 2);
      const dy = Math.round((ch - drawH) / 2);
      ctx.drawImage(img, dx, dy, drawW, drawH);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      dprRef.current = dpr;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      applyDefaults();
      draw(currentFrameRef.current);
    };

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;

    if (phase === "playing") {
      let last = 0;
      let frame = 1;
      currentFrameRef.current = 1;
      draw(1);

      const tick = (t: number) => {
        if (!last) last = t;
        const elapsed = t - last;
        if (elapsed >= FRAME_INTERVAL_MS) {
          const advance = Math.floor(elapsed / FRAME_INTERVAL_MS);
          frame = Math.min(FRAME_COUNT, frame + advance);
          last = t - (elapsed % FRAME_INTERVAL_MS);
          currentFrameRef.current = frame;
          draw(frame);
          if (frame >= FRAME_COUNT) {
            setPhase("settled");
            return;
          }
        }
        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "settled") return;
    const t = window.setTimeout(() => setHintVisible(true), HINT_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "settled" || dismissed) return;

    const dismiss = () => setDismissed(true);

    const onWheel = () => dismiss();
    const onTouch = () => dismiss();
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "ArrowDown" ||
        e.key === "PageDown" ||
        e.key === " " ||
        e.key === "Enter"
      ) {
        dismiss();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, dismissed]);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          key="opening-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50"
          style={{ backgroundColor: LETTERBOX_COLOR }}
          aria-hidden={dismissed}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            aria-label="Opening sequence"
          />

          <AnimatePresence>
            {phase === "loading" && (
              <motion.div
                key="loading-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4"
              >
                <span
                  className="font-serif tabular-nums text-gray-900/80 text-4xl sm:text-5xl tracking-wider"
                  aria-live="polite"
                >
                  {String(
                    Math.floor((loadedCount / FRAME_COUNT) * 100)
                  ).padStart(2, "0")}
                </span>
                <div className="relative h-px w-32 sm:w-40 overflow-hidden bg-gray-900/15">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gray-900/60"
                    animate={{
                      width: `${(loadedCount / FRAME_COUNT) * 100}%`,
                    }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {hintVisible && (
              <motion.div
                key="scroll-hint"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute inset-x-0 bottom-10 sm:bottom-14 flex flex-col items-center gap-3"
              >
                <p className="font-serif italic text-sm sm:text-base text-gray-900/75 tracking-[0.18em]">
                  Scroll to enter
                </p>
                <motion.span
                  aria-hidden="true"
                  className="block h-7 w-px bg-gray-900/35"
                  animate={{ opacity: [0.3, 1, 0.3], scaleY: [0.7, 1, 0.7] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
