"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type SectionShellProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  motionProps?: HTMLMotionProps<"div">;
  centerInViewport?: boolean;
};

export default function SectionShell({
  id,
  children,
  className = "",
  innerClassName = "",
  motionProps,
  centerInViewport = false,
}: SectionShellProps) {
  const padding = centerInViewport
    ? "py-16 sm:py-20"
    : "py-24 sm:py-28 md:py-32";
  const layout = centerInViewport
    ? "min-h-screen flex flex-col justify-center"
    : "";
  return (
    <section
      id={id}
      className={`relative w-full px-6 ${padding} ${layout} ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
        className={`mx-auto w-full max-w-5xl ${innerClassName}`}
        {...motionProps}
      >
        {children}
      </motion.div>
    </section>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.4em] text-[color:var(--burgundy-soft)]/85 text-center">
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-serif text-4xl sm:text-5xl md:text-6xl text-[color:var(--burgundy)] text-center tracking-tight ${className}`}
    >
      {children}
    </h2>
  );
}

export function SectionDivider() {
  return (
    <div className="mx-auto my-6 sm:my-8 flex items-center justify-center gap-3">
      <span className="block h-px w-10 bg-[color:var(--burgundy)]/30" />
      <span className="block h-1.5 w-1.5 rounded-full bg-[color:var(--burgundy)]/40" />
      <span className="block h-px w-10 bg-[color:var(--burgundy)]/30" />
    </div>
  );
}
