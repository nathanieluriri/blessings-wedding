"use client";

import { motion } from "framer-motion";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";

function TempleIllustration() {
  // A Greek / Acropolis-style temple in single-weight line art — a quiet hint
  // toward the venue without naming it outright.
  const columns = [120, 240, 360, 480, 600, 720];
  return (
    <svg
      viewBox="0 0 840 420"
      className="w-full h-auto text-[color:var(--burgundy)]"
      role="img"
      aria-label="Line-art illustration of an open-air Greek temple in a garden"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* clouds */}
        <g opacity="0.55">
          <path d="M70 70 c-12 0 -18 -12 -6 -18 c2 -12 20 -14 26 -4 c10 -6 22 2 20 12 c10 2 8 14 -4 14 z" />
          <path d="M690 56 c14 0 22 -14 8 -22 c-2 -14 -24 -16 -30 -4 c-12 -8 -26 2 -23 14 c-12 2 -10 16 4 16 z" />
        </g>

        {/* distant hills */}
        <g opacity="0.5">
          <path d="M40 250 q90 -46 190 -10 q80 28 150 4 q110 -38 230 -2 q90 30 190 0" />
          <path d="M40 272 q120 -30 240 0 q120 30 240 0 q90 -22 280 6" />
        </g>

        {/* cypress trees */}
        <g opacity="0.6">
          <path d="M150 250 c10 -50 10 -78 0 -118 c-10 40 -10 68 0 118 z" />
          <path d="M705 250 c9 -44 9 -70 0 -106 c-9 36 -9 62 0 106 z" />
        </g>

        {/* pediment */}
        <path d="M110 140 L420 60 L730 140 Z" />
        <path d="M138 140 L420 78 L702 140" opacity="0.5" />

        {/* entablature */}
        <path d="M96 140 H744" />
        <path d="M104 158 H736" />
        <path d="M104 158 V176 H736 V158" />

        {/* columns */}
        {columns.map((x) => (
          <g key={x}>
            {/* capital */}
            <path d={`M${x - 22} 176 H${x + 22}`} />
            <path d={`M${x - 18} 184 H${x + 18}`} />
            {/* fluted shaft */}
            <path d={`M${x - 15} 184 V330`} />
            <path d={`M${x + 15} 184 V330`} />
            <path d={`M${x - 5} 188 V326`} opacity="0.4" />
            <path d={`M${x + 5} 188 V326`} opacity="0.4" />
            {/* base */}
            <path d={`M${x - 20} 330 H${x + 20}`} />
          </g>
        ))}

        {/* steps */}
        <path d="M80 342 H760" />
        <path d="M64 360 H776" />
        <path d="M48 380 H792" />

        {/* foreground foliage */}
        <g opacity="0.8">
          <path d="M70 380 c-8 -22 -8 -38 0 -52 c8 14 8 30 0 52 z" />
          <path d="M770 380 c-8 -22 -8 -38 0 -52 c8 14 8 30 0 52 z" />
          <path d="M108 380 c-6 -16 -6 -28 0 -40 c6 12 6 24 0 40 z" opacity="0.7" />
          <path d="M732 380 c-6 -16 -6 -28 0 -40 c6 12 6 24 0 40 z" opacity="0.7" />
        </g>
      </g>
    </svg>
  );
}

export default function Location() {
  return (
    <SectionShell
      id="location"
      className="bg-[color:var(--cream-deep)]"
      innerClassName="text-center"
    >
      <SectionEyebrow>A little riddle</SectionEyebrow>
      <SectionTitle className="mt-4">The Venue</SectionTitle>
      <SectionDivider />

      <p className="mx-auto mt-2 max-w-xl font-serif italic text-base sm:text-lg text-[color:var(--burgundy-soft)]/80">
        We will gather at a beautiful open-air park in the heart of Apo, Abuja,
        where love, music, good food, and laughter will fill the air.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-12 max-w-3xl"
      >
        <TempleIllustration />
      </motion.div>

      <p className="mx-auto mt-10 max-w-md font-serif text-2xl sm:text-3xl leading-snug text-[color:var(--burgundy)]">
        Think gardens. Think romance. Think an evening beneath the stars.
      </p>

      <p className="mx-auto mt-6 max-w-md font-serif italic text-base sm:text-lg text-[color:var(--burgundy-soft)]/85">
        The rest of the story unlocks with your RSVP.
      </p>

      <div className="mt-10 flex justify-center">
        <a
          href="#rsvp"
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--burgundy)]/40 px-6 py-3 font-sans text-xs uppercase tracking-[0.3em] text-[color:var(--burgundy)] hover:bg-[color:var(--burgundy)] hover:text-white transition-colors"
        >
          RSVP Here
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              d="M5 12 H19 M13 6 l6 6 -6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </SectionShell>
  );
}
