"use client";

import { motion } from "framer-motion";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";

export default function Hashtag() {
  return (
    <SectionShell
      id="hashtag"
      className="bg-[color:var(--cream-deep)]"
      innerClassName="text-center"
    >
      <SectionEyebrow>The story behind</SectionEyebrow>
      <SectionTitle className="mt-4">Our Hashtag</SectionTitle>
      <SectionDivider />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6"
      >
        <h3
          className="hashtag-glow font-serif text-5xl sm:text-7xl md:text-8xl tracking-tight text-[color:var(--burgundy)]"
          style={{ letterSpacing: "-0.02em" }}
        >
          #OfoDiMma
        </h3>
      </motion.div>

      <p className="mx-auto mt-10 max-w-2xl font-serif italic text-base sm:text-lg text-[color:var(--burgundy-soft)]/85">
        We wanted a hashtag that carried the weight of our love and our
        heritage.
      </p>

      <div className="mx-auto mt-8 max-w-2xl font-sans text-sm sm:text-base leading-relaxed text-[color:var(--foreground)]/80 space-y-5">
        <p>
          <span className="font-serif italic text-[color:var(--burgundy)]">
            #OfoDiMma
          </span>{" "}
          is a perfect combination — it brings together Justice&rsquo;s surname,{" "}
          <strong className="font-semibold text-[color:var(--burgundy)]">
            Ofokansi
          </strong>
          , and the name{" "}
          <strong className="font-semibold text-[color:var(--burgundy)]">
            Mmayen
          </strong>
          . In Igbo,{" "}
          <em className="font-serif italic">&ldquo;Ọ dị mma&rdquo;</em> means{" "}
          <em className="font-serif italic">&ldquo;It is good.&rdquo;</em>
        </p>
        <p>
          We love that this hashtag honours both of our heritages and speaks so
          beautifully to the loving family we are about to build together.
        </p>
      </div>

      <div className="mx-auto mt-12 flex items-center justify-center gap-4 text-2xl sm:text-3xl text-[color:var(--burgundy)]">
        <span aria-hidden="true">💍</span>
        <span aria-hidden="true">🥂</span>
      </div>

      <p className="mt-10 font-sans text-[11px] sm:text-xs uppercase tracking-[0.4em] text-[color:var(--burgundy-soft)]/80">
        Tag your photos &middot; Share the joy
      </p>
    </SectionShell>
  );
}
