"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";

const WEDDING_DATE = new Date("2026-12-19T14:30:00+01:00");

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function getParts(now: number): Parts {
  const diff = Math.max(0, WEDDING_DATE.getTime() - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff / 3_600_000) % 24);
  const minutes = Math.floor((diff / 60_000) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

const pad = (n: number, size = 2) => String(n).padStart(size, "0");

function CountBox({
  value,
  label,
  size = 3,
}: {
  value: number;
  label: string;
  size?: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm border border-[color:var(--burgundy)]/15 shadow-[0_10px_40px_-20px_rgba(90,26,26,0.35)]"
        style={{
          width: "clamp(82px, 18vw, 132px)",
          height: "clamp(82px, 18vw, 132px)",
        }}
      >
        <motion.span
          key={value}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-[color:var(--burgundy)] tabular-nums"
          style={{ fontSize: "clamp(28px, 6.4vw, 52px)" }}
        >
          {pad(value, size)}
        </motion.span>
      </div>
      <span className="mt-3 font-sans text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[color:var(--burgundy-soft)]/80">
        {label}
      </span>
    </div>
  );
}

const ZERO_PARTS: Parts = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export default function Countdown() {
  const [parts, setParts] = useState<Parts>(ZERO_PARTS);

  useEffect(() => {
    let raf = 0;
    let lastSecond = -1;
    const tick = () => {
      const now = Date.now();
      const sec = Math.floor(now / 1000);
      if (sec !== lastSecond) {
        lastSecond = sec;
        setParts(getParts(now));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <SectionShell
      id="countdown"
      className="bg-[color:var(--cream)]"
      innerClassName="text-center"
    >
      <SectionEyebrow>The big day approaches</SectionEyebrow>
      <SectionTitle className="mt-4">Countdown</SectionTitle>
      <SectionDivider />

      <div className="mt-6 flex items-center justify-center gap-3 sm:gap-5">
        <CountBox value={parts.days} label="Days" size={3} />
        <CountBox value={parts.hours} label="Hours" />
        <CountBox value={parts.minutes} label="Min" />
        <CountBox value={parts.seconds} label="Sec" />
      </div>

      <p className="mt-10 font-serif italic text-base sm:text-lg text-[color:var(--burgundy-soft)]/80">
        until we say &ldquo;I do&rdquo;
      </p>
    </SectionShell>
  );
}
