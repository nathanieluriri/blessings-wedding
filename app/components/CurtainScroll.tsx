"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 300;
const FRAME_PATH = "/curtain_frames";
const CURTAIN_END = 0.78;
const TEXT_FADE_START = 0.42;
const TEXT_FADE_END = 0.82;
const HERO_FADE_START = 0.30;
const HERO_FADE_END = 0.78;

const frameSrc = (i: number) =>
  `${FRAME_PATH}/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;

export default function CurtainScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastFrameRef = useRef<number>(-1);
  const dprRef = useRef<number>(1);

  const [isReady, setIsReady] = useState(false);

  const progress = useMotionValue(0);

  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const distance = Math.max(1, rect.height - viewportHeight);
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / distance));
      progress.set(p);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    let raf = 0;
    const loop = () => {
      update();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [progress]);

  const frameIndex = useTransform(
    progress,
    [0, CURTAIN_END, 1],
    [1, FRAME_COUNT, FRAME_COUNT],
    { clamp: true },
  );

  const textOpacity = useTransform(
    progress,
    [TEXT_FADE_START, TEXT_FADE_END],
    [0, 1],
    { clamp: true },
  );

  const textY = useTransform(
    progress,
    [TEXT_FADE_START, TEXT_FADE_END],
    [18, 0],
    { clamp: true },
  );

  const textScale = useTransform(
    progress,
    [TEXT_FADE_START, TEXT_FADE_END],
    [0.84, 1],
    { clamp: true },
  );

  const heroOpacity = useTransform(
    progress,
    [HERO_FADE_START, HERO_FADE_END],
    [1, 0],
    { clamp: true },
  );

  useEffect(() => {
    let cancelled = false;
    const imgs: HTMLImageElement[] = new Array(FRAME_COUNT);
    let count = 0;

    const onSettled = () => {
      if (cancelled) return;
      count += 1;
      if (count === FRAME_COUNT) setIsReady(true);
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

    const applyContextDefaults = () => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };

    const draw = (i: number) => {
      const img = imagesRef.current[i - 1];
      if (!img || !img.complete || !img.naturalWidth) return;

      const dpr = dprRef.current;
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const drawW = iw * scale;
      const drawH = ih * scale;
      const dx = (cw - drawW) / 2;
      const dy = (ch - drawH) / 2;

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, drawW, drawH);
    };

    const drawCurrent = () => {
      const raw = frameIndex.get();
      const i = Math.max(1, Math.min(FRAME_COUNT, Math.round(raw)));
      lastFrameRef.current = i;
      draw(i);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      dprRef.current = dpr;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      applyContextDefaults();
      drawCurrent();
    };

    resize();

    const onChange = (val: number) => {
      const i = Math.max(1, Math.min(FRAME_COUNT, Math.round(val)));
      if (i === lastFrameRef.current) return;
      lastFrameRef.current = i;
      draw(i);
    };

    const unsubscribe = frameIndex.on("change", onChange);
    window.addEventListener("resize", resize);

    if (isReady) drawCurrent();

    return () => {
      unsubscribe();
      window.removeEventListener("resize", resize);
    };
  }, [frameIndex, isReady]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[450vh]"
      aria-label="Wedding invitation scrollytelling"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-white">
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute inset-0 will-change-[opacity]"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          />
        </motion.div>

        <motion.div
          style={{ opacity: textOpacity, scale: textScale, y: textY }}
          className="absolute inset-0 z-10 flex items-center justify-center px-6 pointer-events-none will-change-[opacity,transform]"
        >
          <div className="invitation-float text-center max-w-[90vw] sm:max-w-xl md:max-w-2xl">
            <p className="font-sans text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.45em] text-gray-500 mb-8 sm:mb-10">
              You are cordially invited to celebrate the wedding of
            </p>

            <div className="flex flex-col items-center gap-2 sm:gap-3 leading-none">
              <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-gray-900 tracking-tight">
                Blessing
              </h1>
              <span
                aria-hidden="true"
                className="font-serif italic text-4xl sm:text-5xl md:text-6xl text-gray-700 -my-1 sm:-my-2"
              >
                &amp;
              </span>
              <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-gray-900 tracking-tight">
                Justice
              </h1>
            </div>

            <div className="mx-auto mt-10 sm:mt-12 h-px w-16 bg-gray-300" />

            <p className="mt-8 sm:mt-10 font-serif text-base sm:text-lg md:text-xl leading-relaxed text-gray-700 max-w-md mx-auto">
              We would like to invite you to celebrate with us the most
              special day of our lives. It would be an honor to have you
              present at this important moment.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
