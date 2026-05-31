"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLenis } from "lenis/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useScrollLock } from "../ScrollLock";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";

const REVEAL_THRESHOLD = 0.16;
const SAMPLE_INTERVAL_MS = 40;
const LOGICAL_SIZE = 220;

const CARDS: { label: string; aria: string }[] = [
  { label: "19", aria: "day" },
  { label: "Dec", aria: "month" },
  { label: "2026", aria: "year" },
];

const CONFETTI_COLORS = [
  "#5a1a1a",
  "#c9a96b",
  "#9aaf88",
  "#c97b63",
  "#2c5f8d",
  "#a594c2",
  "#d4a017",
  "#d4a5a5",
  "#7a2a2a",
];

type ScratchCardProps = {
  label: string;
  aria: string;
  delay: number;
  onReveal: () => void;
};

function ScratchCard({ label, aria, delay, onReveal }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDownRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastSampleAtRef = useRef(0);
  const revealedRef = useRef(false);
  const [revealed, setRevealed] = useState(false);

  const paintForeground = useCallback((ctx: CanvasRenderingContext2D) => {
    const s = LOGICAL_SIZE;
    const grad = ctx.createRadialGradient(
      s * 0.32,
      s * 0.32,
      s * 0.08,
      s * 0.5,
      s * 0.5,
      s * 0.62,
    );
    grad.addColorStop(0, "#ffeccb");
    grad.addColorStop(0.4, "#eeb87f");
    grad.addColorStop(0.8, "#cf8d62");
    grad.addColorStop(1, "#9c5f3e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);

    ctx.save();
    ctx.translate(s / 2, s / 2);
    for (let i = 0; i < 80; i++) {
      const a = (Math.PI * 2 * i) / 80;
      ctx.globalAlpha = i % 2 ? 0.18 : 0.1;
      ctx.strokeStyle = i % 2 ? "#fff5cc" : "#3e2a0d";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = LOGICAL_SIZE * dpr;
    canvas.height = LOGICAL_SIZE * dpr;
    // willReadFrequently: the reveal check reads ImageData every ~40ms while the
    // user scratches, so keep this canvas CPU-side for cheap repeated reads.
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintForeground(ctx);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 54;
  }, [paintForeground]);

  const clearAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }, []);

  const samplePercent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    const w = canvas.width;
    const h = canvas.height;
    const step = Math.max(8, Math.floor(w / 22));
    const data = ctx.getImageData(0, 0, w, h).data;
    let cleared = 0;
    let total = 0;
    for (let y = step >> 1; y < h; y += step) {
      for (let x = step >> 1; x < w; x += step) {
        const idx = (y * w + x) * 4 + 3;
        if (data[idx] === 0) cleared++;
        total++;
      }
    }
    return total ? cleared / total : 0;
  }, []);

  const eraseTo = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const last = lastPointRef.current;
      ctx.beginPath();
      if (last) {
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fill();
      }
      lastPointRef.current = { x, y };

      const now = performance.now();
      if (now - lastSampleAtRef.current >= SAMPLE_INTERVAL_MS) {
        lastSampleAtRef.current = now;
        const p = samplePercent();
        if (p >= REVEAL_THRESHOLD && !revealedRef.current) {
          revealedRef.current = true;
          clearAll();
          setRevealed(true);
          onReveal();
        }
      }
    },
    [samplePercent, onReveal, clearAll],
  );

  const toLocal = (
    e: ReactPointerEvent<HTMLCanvasElement>,
  ): { x: number; y: number } => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * LOGICAL_SIZE;
    const y = ((e.clientY - rect.top) / rect.height) * LOGICAL_SIZE;
    return { x, y };
  };

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (revealedRef.current) return;
    isDownRef.current = true;
    lastPointRef.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = toLocal(e);
    eraseTo(x, y);
  };

  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDownRef.current || revealedRef.current) return;
    const { x, y } = toLocal(e);
    eraseTo(x, y);
  };

  const onUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    isDownRef.current = false;
    lastPointRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      style={{
        width: "clamp(78px, 23vw, 168px)",
        height: "clamp(78px, 23vw, 168px)",
        filter:
          "drop-shadow(0 14px 26px rgba(90,26,26,0.32)) drop-shadow(0 3px 6px rgba(201,123,99,0.35))",
      }}
    >
      {/* heart-shaped stage: clip + the soft blush card behind the gold */}
      <div
        className="absolute inset-0 overflow-hidden bg-[#fff4f0]"
        style={{ clipPath: "url(#scratch-heart)" }}
      >
        <motion.span
          animate={revealed ? { scale: 1, opacity: 1 } : { scale: 0.96, opacity: 0.95 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center pb-[16%] font-serif text-[color:var(--burgundy)] select-none pointer-events-none"
          style={{ fontSize: "clamp(22px, 5.2vw, 40px)" }}
          aria-label={aria}
        >
          {label}
        </motion.span>

        <motion.canvas
          ref={canvasRef}
          animate={
            revealed
              ? { opacity: 0, scale: 1.06 }
              : { opacity: 1, scale: 1 }
          }
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ cursor: revealed ? "default" : "grab" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />

        {!revealed && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 34% 26%, rgba(255,252,238,0.7), rgba(255,252,238,0) 52%)",
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

type ConfettiPiece = {
  i: number;
  left: number;
  drift: number;
  rotate: number;
  dur: number;
  delay: number;
  color: string;
  size: number;
};

function ConfettiPieces() {
  const [pieces] = useState<ConfettiPiece[]>(() => {
    // ConfettiBurst only mounts on the client (after the reveal), so reading
    // window here is safe. Fewer pieces on phones keeps the burst smooth — each
    // piece is its own animated, layer-promoted SVG.
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const count = reduce
      ? 0
      : typeof window !== "undefined" && window.innerWidth < 640
        ? 28
        : 48;
    const next: ConfettiPiece[] = [];
    for (let i = 0; i < count; i++) {
      next.push({
        i,
        left: Math.random() * 100,
        drift: (Math.random() - 0.5) * 220,
        rotate: 360 + Math.random() * 720,
        dur: 3.4 + Math.random() * 2.2,
        delay: Math.random() * 0.6,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 13 + Math.random() * 13,
      });
    }
    return next;
  });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {pieces.map((p) => (
        <svg
          key={p.i}
          className="confetti-piece"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={
            {
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              "--cx": `${p.drift}px`,
              "--cr": `${p.rotate}deg`,
              "--cdur": `${p.dur}s`,
              "--cdelay": `${p.delay}s`,
            } as React.CSSProperties
          }
        >
          <path
            fill={p.color}
            d="M12 21s-7.5-4.9-10-9.3C.4 8.6 1.8 5 5.2 5c2 0 3.4 1.2 4.3 2.6l.5.8.5-.8C11.4 6.2 12.8 5 14.8 5c3.4 0 4.8 3.6 3.2 6.7C19.5 16.1 12 21 12 21z"
          />
        </svg>
      ))}
    </div>
  );
}

function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return <ConfettiPieces />;
}

type Phase = "idle" | "engaged" | "complete";

export default function ScratchReveal() {
  const [revealedCount, setRevealedCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const allRevealed = revealedCount >= CARDS.length;
  const lenis = useLenis();
  const sectionRef = useRef<HTMLElement | null>(null);

  const handleReveal = useCallback(() => {
    setRevealedCount((n) => Math.min(CARDS.length, n + 1));
  }, []);

  useScrollLock("scratch-reveal", phase === "engaged" && !allRevealed);

  useEffect(() => {
    if (phase !== "idle") return;
    const sectionEl = document.getElementById("reveal");
    if (!sectionEl) return;
    sectionRef.current = sectionEl;

    let armed = true;
    let safety: number | undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!armed) return;
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        armed = false;
        const engage = () => setPhase("engaged");
        if (lenis) {
          lenis.scrollTo(sectionEl, {
            duration: 0.85,
            lock: true,
            onComplete: engage,
          });
          safety = window.setTimeout(engage, 1100);
        } else {
          sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
          safety = window.setTimeout(engage, 700);
        }
      },
      {
        threshold: 0,
        rootMargin: "-50% 0px -50% 0px",
      },
    );
    obs.observe(sectionEl);
    return () => {
      obs.disconnect();
      if (safety !== undefined) window.clearTimeout(safety);
    };
  }, [phase, lenis]);

  useEffect(() => {
    if (phase !== "engaged" || allRevealed) return;
    const sectionEl = sectionRef.current ?? document.getElementById("reveal");
    if (!sectionEl) return;

    let suppressUntil = performance.now() + 950;
    let snapTimer: number | undefined;

    const onScroll = () => {
      if (performance.now() < suppressUntil) return;
      if (snapTimer !== undefined) window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        const offset = sectionEl.getBoundingClientRect().top;
        if (Math.abs(offset) > 60) {
          suppressUntil = performance.now() + 700;
          if (lenis) {
            lenis.scrollTo(sectionEl, {
              duration: 0.55,
              force: true,
              lock: true,
            });
          } else {
            sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }, 90);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (snapTimer !== undefined) window.clearTimeout(snapTimer);
    };
  }, [phase, lenis, allRevealed]);

  useEffect(() => {
    if (!allRevealed || phase !== "engaged") return;
    const t = window.setTimeout(() => setPhase("complete"), 4500);
    return () => window.clearTimeout(t);
  }, [allRevealed, phase]);

  return (
    <SectionShell
      id="reveal"
      className="bg-[color:var(--cream-deep)] overflow-hidden"
      innerClassName="text-center"
      centerInViewport
    >
      {/* scalable heart clip shared by every scratch card */}
      <svg
        aria-hidden="true"
        width="0"
        height="0"
        className="absolute"
        style={{ position: "absolute" }}
      >
        <defs>
          <clipPath id="scratch-heart" clipPathUnits="objectBoundingBox">
            <path
              transform="scale(0.03125, 0.0337838)"
              d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4 c0,9.4,9.5,11.9,16,21.2c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z"
            />
          </clipPath>
        </defs>
      </svg>

      <ConfettiBurst active={allRevealed} />

      <motion.div
        animate={
          allRevealed
            ? { opacity: 0, y: -8 }
            : { opacity: 1, y: 0 }
        }
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-6 flex flex-col items-center gap-3"
      >
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 border border-[color:var(--burgundy)]/15 text-[color:var(--burgundy)]"
        >
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            style={{ transformOrigin: "62% 88%" }}
            animate={{ rotate: [0, 14, -6, 14, 0] }}
            transition={{
              duration: 1.7,
              repeat: Infinity,
              repeatDelay: 0.5,
              ease: "easeInOut",
            }}
          >
            <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
            <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </motion.svg>
        </span>
        <span className="font-serif italic text-sm text-[color:var(--burgundy-soft)]/80">
          {phase === "complete"
            ? "Beautiful — keep scrolling"
            : "Scratch all three hearts to continue"}
        </span>
      </motion.div>

      <SectionEyebrow>A little surprise</SectionEyebrow>
      <SectionTitle className="mt-3">Reveal</SectionTitle>
      <SectionDivider />
      <p className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.4em] text-[color:var(--burgundy-soft)]/85">
        Scratch to discover the date
      </p>

      <div className="mt-10 sm:mt-12 flex items-center justify-center gap-3 sm:gap-7">
        {CARDS.map((c, i) => (
          <ScratchCard
            key={c.aria}
            label={c.label}
            aria={c.aria}
            delay={0.05 + i * 0.08}
            onReveal={handleReveal}
          />
        ))}
      </div>

      <AnimatePresence>
        {allRevealed && (
          <motion.div
            key="reveal-tag"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            className="mt-12"
          >
            <p className="font-serif text-3xl sm:text-4xl text-[color:var(--burgundy)]">
              We&rsquo;re getting married!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionShell>
  );
}
