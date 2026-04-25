"use client";

import { motion } from "framer-motion";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";

function VenueIllustration() {
  return (
    <svg
      viewBox="0 0 800 360"
      className="w-full h-auto text-[color:var(--burgundy)]"
      role="img"
      aria-label="Stylized illustration of a garden pavilion"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M40 320 H760" strokeWidth="1.6" />
        <path d="M70 320 V160 a80 80 0 0 1 80 -80 h160 a80 80 0 0 1 80 80 V320" />
        <path d="M310 320 V200 a90 90 0 0 1 90 -90 a90 90 0 0 1 90 90 V320" />
        <path d="M490 320 V160 a80 80 0 0 1 80 -80 h160 a80 80 0 0 1 80 80 V320" strokeWidth="0" />
        <path d="M490 320 V160 a80 80 0 0 1 80 -80 h160 a80 80 0 0 1 80 80 V320" />

        <path d="M150 320 V210 a30 30 0 0 1 30 -30 h60 a30 30 0 0 1 30 -0 V320" />
        <path d="M210 180 V320" />

        <path d="M360 320 V230 a40 40 0 0 1 40 -40 a40 40 0 0 1 40 40 V320" />
        <path d="M400 190 V320" />

        <path d="M570 320 V210 a30 30 0 0 1 30 -30 h60 a30 30 0 0 1 30 30 V320" />
        <path d="M630 180 V320" />

        <circle cx="210" cy="125" r="6" />
        <circle cx="400" cy="135" r="7" />
        <circle cx="630" cy="125" r="6" />

        <path d="M40 305 q40 -20 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" />

        <g opacity="0.85">
          <path d="M120 320 c -8 -22 -8 -38 0 -52 c 8 14 8 30 0 52 z" />
          <path d="M270 320 c -10 -28 -10 -46 0 -64 c 10 18 10 36 0 64 z" />
          <path d="M510 320 c -10 -28 -10 -46 0 -64 c 10 18 10 36 0 64 z" />
          <path d="M680 320 c -8 -22 -8 -38 0 -52 c 8 14 8 30 0 52 z" />
        </g>

        <g opacity="0.5">
          <path d="M100 80 c -8 -10 0 -22 10 -22 c 12 -16 30 -10 30 4 c 12 -2 18 8 14 18 c 4 10 -4 18 -16 16 c -8 8 -22 6 -26 -4 c -10 0 -16 -6 -12 -12 z" />
          <path d="M650 90 c -10 -12 0 -28 12 -28 c 14 -18 36 -10 36 6 c 14 -2 22 10 18 22 c 4 12 -4 22 -20 20 c -10 10 -28 6 -32 -4 c -10 0 -18 -6 -14 -16 z" />
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
      <SectionEyebrow>How to find us</SectionEyebrow>
      <SectionTitle className="mt-4">The Venue</SectionTitle>
      <SectionDivider />

      <p className="mx-auto mt-2 max-w-xl font-serif italic text-base sm:text-lg text-[color:var(--burgundy-soft)]/80">
        We will gather at a beautiful open-air park in the heart of Apo for the
        ceremony, dinner and evening celebration.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-12 max-w-3xl"
      >
        <VenueIllustration />
      </motion.div>

      <p className="mt-8 font-serif text-3xl sm:text-4xl text-[color:var(--burgundy)]">
        Acropolis Park
      </p>
      <p className="mt-1 font-serif italic text-lg text-[color:var(--burgundy-soft)]/85">
        Apo, Abuja
      </p>
      <p className="mt-2 font-sans text-[11px] sm:text-xs uppercase tracking-[0.4em] text-[color:var(--burgundy-soft)]/80">
        Saturday, 19 December 2026
      </p>

      <div className="mt-10 flex justify-center">
        <a
          href="https://www.google.com/maps/search/?api=1&query=Acropolis+Park+Apo+Abuja"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--burgundy)]/40 px-6 py-3 font-sans text-xs uppercase tracking-[0.3em] text-[color:var(--burgundy)] hover:bg-[color:var(--burgundy)] hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path
              d="M12 2 a8 8 0 0 0 -8 8 c0 6 8 12 8 12 s8 -6 8 -12 a8 8 0 0 0 -8 -8 z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          Open in Maps
        </a>
      </div>
    </SectionShell>
  );
}
