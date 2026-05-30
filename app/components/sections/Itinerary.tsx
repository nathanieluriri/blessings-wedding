"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";

type Item = {
  title: string;
  time: string;
  icon: ReactNode;
};

const RingsIcon = () => (
  <svg viewBox="0 0 64 64" className="h-7 w-7 sm:h-8 sm:w-8 lg:h-11 lg:w-11" aria-hidden="true">
    <circle cx="24" cy="38" r="13" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="40" cy="38" r="13" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <path d="M22 22 l4 -8 h12 l4 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
  </svg>
);

const GlassIcon = () => (
  <svg viewBox="0 0 64 64" className="h-7 w-7 sm:h-8 sm:w-8 lg:h-11 lg:w-11" aria-hidden="true">
    <path d="M20 12 h24 l-4 22 a8 8 0 0 1 -16 0 z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M32 42 v10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M22 54 h20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const ForkKnifeIcon = () => (
  <svg viewBox="0 0 64 64" className="h-7 w-7 sm:h-8 sm:w-8 lg:h-11 lg:w-11" aria-hidden="true">
    <path d="M22 10 v18 a4 4 0 0 0 4 4 v22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M18 10 v14 M26 10 v14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M44 10 c-4 4 -6 10 -6 16 c0 4 2 6 6 6 v22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const NoteIcon = () => (
  <svg viewBox="0 0 64 64" className="h-7 w-7 sm:h-8 sm:w-8 lg:h-11 lg:w-11" aria-hidden="true">
    <path d="M26 46 V14 l20 -4 v32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    <circle cx="22" cy="48" r="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="42" cy="44" r="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
  </svg>
);

const HEART_PATH =
  "M50 88 C18 64 8 46 8 31 C8 17 18 9 30 9 C40 9 47 15 50 23 C53 15 60 9 70 9 C82 9 92 17 92 31 C92 46 82 64 50 88 Z";

function HeartBadge({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-28 w-28 sm:h-36 sm:w-36 lg:h-48 lg:w-48 items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full drop-shadow-[0_10px_30px_rgba(90,26,26,0.18)]"
        aria-hidden="true"
      >
        <path
          d={HEART_PATH}
          fill="white"
          stroke="var(--burgundy)"
          strokeOpacity="0.15"
          strokeWidth="1.6"
        />
      </svg>
      {/* nudge the icon up into the heart's body, away from the point */}
      <div className="relative -mt-2 text-[color:var(--burgundy)]">{children}</div>
    </div>
  );
}

function ItineraryStop({ item, delay }: { item: Item; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center"
    >
      <HeartBadge>{item.icon}</HeartBadge>
      <h3 className="mt-5 font-serif text-2xl text-[color:var(--burgundy)]">
        {item.title}
      </h3>
      <p className="mt-1 font-sans text-sm tracking-[0.25em] uppercase text-[color:var(--burgundy-soft)]/80">
        {item.time}
      </p>
    </motion.div>
  );
}

const WE_DO: Item = { title: "We Do", time: "2:30 pm", icon: <RingsIcon /> };
const WE_DRINK: Item = { title: "We Drink", time: "4:00 pm", icon: <GlassIcon /> };
const WE_EAT: Item = { title: "We Eat", time: "5:00 pm", icon: <ForkKnifeIcon /> };
const WE_PARTY: Item = { title: "We Party", time: "8:00 pm", icon: <NoteIcon /> };

export default function Itinerary() {
  return (
    <SectionShell
      id="itinerary"
      className="bg-[color:var(--cream)]"
      innerClassName="text-center"
    >
      <SectionEyebrow>The order of the day</SectionEyebrow>
      <SectionTitle className="mt-4">Itinerary</SectionTitle>
      <SectionDivider />

      <div className="mt-12 flex flex-col items-center gap-y-12 sm:gap-y-16">
        {/* We Do on the left, We Drink on the right */}
        <div className="flex w-full max-w-2xl items-start justify-center gap-16 sm:gap-28">
          <ItineraryStop item={WE_DO} delay={0} />
          <ItineraryStop item={WE_DRINK} delay={0.08} />
        </div>

        {/* We Eat and We Party below, beside each other */}
        <div className="flex w-full max-w-2xl items-start justify-center gap-16 sm:gap-28">
          <ItineraryStop item={WE_EAT} delay={0.16} />
          <ItineraryStop item={WE_PARTY} delay={0.24} />
        </div>
      </div>
    </SectionShell>
  );
}
