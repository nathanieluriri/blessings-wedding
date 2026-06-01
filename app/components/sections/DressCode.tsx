/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";

// TODO: replace with the couple's actual Pinterest board URL once supplied.
const INSPIRATION_URL = "https://www.pinterest.com/search/pins/?q=colourful%20wedding%20guest%20outfits";

export default function DressCode() {
  return (
    <SectionShell
      id="dress-code"
      className="bg-[color:var(--cream)]"
      innerClassName="text-center"
    >
      <SectionEyebrow>Dress Code</SectionEyebrow>
      <SectionTitle className="mt-4">A Celebration of Colour</SectionTitle>
      <SectionDivider />

      <p className="mx-auto mt-2 max-w-2xl font-serif italic text-base sm:text-lg text-[color:var(--burgundy-soft)]/80">
        Our wedding is a celebration of love in full colour. We invite you to
        bring the day to life in shades that feel bold, beautiful, joyful, and
        completely you.
      </p>

      <p className="mx-auto mt-3 max-w-2xl font-sans text-sm sm:text-base leading-relaxed text-[color:var(--foreground)]/75">
        Choose a colour that feels like you and wear it your way, with elegance,
        confidence, and plenty of personality.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-12 w-full max-w-4xl"
      >
        <img
          src="/scenes/dress-code.png"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="dresscode-art w-full h-auto"
        />
      </motion.div>

      <p className="mt-12 font-serif text-2xl sm:text-3xl text-[color:var(--burgundy)]">
        Together, let&rsquo;s turn the celebration into a living rainbow.
      </p>

      <div className="mt-8 flex justify-center">
        <a
          href={INSPIRATION_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--burgundy)]/40 px-6 py-3 font-sans text-xs uppercase tracking-[0.3em] text-[color:var(--burgundy)] hover:bg-[color:var(--burgundy)] hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-3.65 19.31c-.05-.78-.1-1.97.02-2.82.11-.78.72-4.96.72-4.96s-.18-.37-.18-.91c0-.86.5-1.5 1.12-1.5.53 0 .78.4.78.87 0 .53-.34 1.32-.51 2.05-.15.62.31 1.12.91 1.12 1.09 0 1.93-1.15 1.93-2.81 0-1.47-1.06-2.5-2.57-2.5-1.75 0-2.78 1.31-2.78 2.67 0 .53.2 1.1.46 1.4a.18.18 0 0 1 .04.18c-.05.2-.15.62-.17.71-.03.11-.09.14-.21.08-.79-.37-1.28-1.51-1.28-2.44 0-1.98 1.44-3.8 4.15-3.8 2.18 0 3.87 1.55 3.87 3.63 0 2.17-1.37 3.91-3.26 3.91-.64 0-1.24-.33-1.44-.72l-.39 1.49c-.14.55-.52 1.23-.78 1.65A10 10 0 1 0 12 2z" />
          </svg>
          Inspiration
        </a>
      </div>
    </SectionShell>
  );
}
