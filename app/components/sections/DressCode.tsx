"use client";

import { motion } from "framer-motion";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";

type Family = {
  name: string;
  hint: string;
  primary: string;
  accent: string;
};

const FAMILIES: Family[] = [
  { name: "Burgundy", hint: "Wine & maroon", primary: "#722F37", accent: "#a8454c" },
  { name: "Terracotta", hint: "Rust & clay", primary: "#c97b63", accent: "#e3a48b" },
  { name: "Mustard", hint: "Saffron & gold", primary: "#d4a017", accent: "#f1c450" },
  { name: "Sage", hint: "Soft green & olive", primary: "#8aa57a", accent: "#b9cba9" },
  { name: "Teal", hint: "Emerald & jade", primary: "#2f7d7d", accent: "#5fb1ad" },
  { name: "Royal Blue", hint: "Navy & cobalt", primary: "#2c5f8d", accent: "#5e93c4" },
  { name: "Lavender", hint: "Mauve & lilac", primary: "#9b86c1", accent: "#c5b6e0" },
  { name: "Rose", hint: "Dusty pink & blush", primary: "#d4a5a5", accent: "#ecc7c7" },
];

function Swatch({ family, idx }: { family: Family; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{
        duration: 0.65,
        delay: idx * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4 }}
      className="flex flex-col items-center"
    >
      <div
        className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full shadow-[0_14px_30px_-14px_rgba(0,0,0,0.35)] ring-1 ring-black/5"
        style={{
          background: `radial-gradient(circle at 32% 30%, ${family.accent} 0%, ${family.primary} 60%, ${family.primary} 100%)`,
        }}
      >
        <span
          aria-hidden="true"
          className="absolute -top-1 left-3 h-3 w-3 rounded-full bg-white/65"
        />
      </div>
      <p className="mt-4 font-serif text-base text-[color:var(--burgundy)]">
        {family.name}
      </p>
      <p className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.28em] text-[color:var(--burgundy-soft)]/70 text-center">
        {family.hint}
      </p>
    </motion.div>
  );
}

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
        Our wedding is all about joy, culture, and colour. Be part of the visual
        magic by dressing in our curated rainbow palette.
      </p>

      <p className="mx-auto mt-3 max-w-2xl font-sans text-sm sm:text-base leading-relaxed text-[color:var(--foreground)]/75">
        Please choose one colour family below and style it in your own way —
        elegant, vibrant, and wedding-ready. Think rich tones, soft hues, and
        coordinated colour.
      </p>

      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scaleX: 0.4 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-10 h-3 w-full max-w-3xl rounded-full overflow-hidden origin-center"
        style={{
          background:
            "linear-gradient(90deg, #722F37 0%, #c97b63 14%, #d4a017 28%, #8aa57a 42%, #2f7d7d 56%, #2c5f8d 70%, #9b86c1 84%, #d4a5a5 100%)",
        }}
      />

      <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-y-10 gap-x-4">
        {FAMILIES.map((f, i) => (
          <Swatch key={f.name} family={f} idx={i} />
        ))}
      </div>

      <p className="mt-16 font-serif text-2xl sm:text-3xl text-[color:var(--burgundy)]">
        Pick a colour. Make it yours.
      </p>
      <p className="mt-2 font-sans text-sm text-[color:var(--burgundy-soft)]/80">
        We can&rsquo;t wait to see the room come alive with colour.
      </p>
    </SectionShell>
  );
}
