"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 300;
const FRAME_PATH = "/curtain_frames";
const CURTAIN_END = 0.78;
const TEXT_FADE_START = 0.40;
const TEXT_FADE_END = 0.78;
const HERO_FADE_START = 0.90;
const HERO_FADE_END = 1.0;

const frameSrc = (i: number) =>
  `${FRAME_PATH}/ezgif-frame-${String(i).padStart(3, "0")}.jpg`;

export default function CurtainScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastFrameRef = useRef<number>(-1);
  const dprRef = useRef<number>(1);

  const [isReady, setIsReady] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const frameIndex = useTransform(
    scrollYProgress,
    [0, CURTAIN_END, 1],
    [1, FRAME_COUNT, FRAME_COUNT],
    { clamp: true },
  );

  const textOpacity = useTransform(
    scrollYProgress,
    [TEXT_FADE_START, TEXT_FADE_END],
    [0, 1],
    { clamp: true },
  );

  const textY = useTransform(
    scrollYProgress,
    [TEXT_FADE_START, TEXT_FADE_END],
    [40, 0],
    { clamp: true },
  );

  const textBlur = useTransform(
    scrollYProgress,
    [TEXT_FADE_START, TEXT_FADE_END],
    [10, 0],
    { clamp: true },
  );
  const textFilter = useTransform(textBlur, (v) => `blur(${v}px)`);

  const heroOpacity = useTransform(
    scrollYProgress,
    [HERO_FADE_START, HERO_FADE_END],
    [1, 0],
    { clamp: true },
  );

  const heroScale = useTransform(
    scrollYProgress,
    [HERO_FADE_START, HERO_FADE_END],
    [1, 1.04],
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
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="absolute inset-0 will-change-[opacity,transform]"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          />
        </motion.div>

        <motion.div
          style={{ opacity: textOpacity, y: textY, filter: textFilter }}
          className="absolute inset-0 z-10 flex items-center justify-center px-6 pointer-events-none"
        >
          <div
            className="invitation-float text-center max-w-[90vw] sm:max-w-xl md:max-w-2xl"
            style={{ textShadow: "0 2px 24px rgba(0, 0, 0, 0.55)" }}
          >
            <p className="font-sans text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.45em] text-white/75 mb-8 sm:mb-10">
              You are cordially invited to celebrate the wedding of
            </p>

            <div className="flex flex-col items-center gap-2 sm:gap-3 leading-none">
              <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white tracking-tight">
                Blessing
              </h1>
              <span
                aria-hidden="true"
                className="font-serif italic text-4xl sm:text-5xl md:text-6xl text-white/85 -my-1 sm:-my-2"
              >
                &amp;
              </span>
              <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white tracking-tight">
                Justice
              </h1>
            </div>

            <div className="mx-auto mt-10 sm:mt-12 h-px w-16 bg-white/45" />

            <p className="mt-8 sm:mt-10 font-serif text-base sm:text-lg md:text-xl leading-relaxed text-white/85 max-w-md mx-auto">
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
