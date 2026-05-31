/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";

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
        className="mx-auto mt-12 max-w-4xl"
      >
        <img
          src="/scenes/venue.svg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="venue-art w-full h-auto"
        />
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
