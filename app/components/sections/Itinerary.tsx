"use client";

import { motion } from "framer-motion";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";

type Item = {
  title: string;
  time: string;
  icon: React.ReactNode;
};

const RingsIcon = () => (
  <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
    <circle cx="24" cy="38" r="13" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="40" cy="38" r="13" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <path d="M22 22 l4 -8 h12 l4 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
  </svg>
);

const GlassIcon = () => (
  <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
    <path d="M20 12 h24 l-4 22 a8 8 0 0 1 -16 0 z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M32 42 v10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M22 54 h20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const ForkKnifeIcon = () => (
  <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
    <path d="M22 10 v18 a4 4 0 0 0 4 4 v22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M18 10 v14 M26 10 v14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M44 10 c-4 4 -6 10 -6 16 c0 4 2 6 6 6 v22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const NoteIcon = () => (
  <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
    <path d="M26 46 V14 l20 -4 v32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    <circle cx="22" cy="48" r="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="42" cy="44" r="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
  </svg>
);

const ITEMS: Item[] = [
  { title: "We Do", time: "2:30 pm", icon: <RingsIcon /> },
  { title: "We Drink", time: "4:00 pm", icon: <GlassIcon /> },
  { title: "We Eat", time: "5:00 pm", icon: <ForkKnifeIcon /> },
  { title: "We Party", time: "8:00 pm", icon: <NoteIcon /> },
];

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

      <div className="relative mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        <div
          aria-hidden="true"
          className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-px bg-[color:var(--burgundy)]/15"
        />
        {ITEMS.map((it, idx) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{
              duration: 0.7,
              delay: idx * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex flex-col items-center"
          >
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white border border-[color:var(--burgundy)]/15 text-[color:var(--burgundy)] shadow-[0_10px_30px_-18px_rgba(90,26,26,0.35)]">
              {it.icon}
            </div>
            <h3 className="mt-5 font-serif text-2xl text-[color:var(--burgundy)]">
              {it.title}
            </h3>
            <p className="mt-1 font-sans text-sm tracking-[0.25em] uppercase text-[color:var(--burgundy-soft)]/80">
              {it.time}
            </p>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}
