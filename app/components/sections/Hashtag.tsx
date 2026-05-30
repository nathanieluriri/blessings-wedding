"use client";

import { motion } from "framer-motion";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";
import HashtagScene from "./HashtagScene";

// Single-weight line-art icons (stroke = currentColor) so they sit naturally on
// the cream background in the same visual language as the rest of the invite.
function RingsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 56"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="24" cy="34" r="15" />
      <circle cx="42" cy="34" r="15" />
      <path d="M42 4 36 12 42 22 48 12Z" />
      <path d="M36 12H48" />
    </svg>
  );
}

function ToastIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 56"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="rotate(-12 30 30)">
        <path d="M22 8 38 8 30 28Z" />
        <path d="M30 28V48" />
        <path d="M22 50H38" />
      </g>
      <g transform="rotate(12 42 30)">
        <path d="M34 8 50 8 42 28Z" />
        <path d="M42 28V48" />
        <path d="M34 50H50" />
      </g>
      <path d="M36 4V0M32 6 30 3M40 6 42 3" />
    </svg>
  );
}

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
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-8 w-full max-w-xl"
      >
        <HashtagScene className="hashtag-art w-full h-auto" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
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
        We wanted a hashtag that felt personal, meaningful, and deeply rooted in
        our culture.
      </p>

      <div className="mx-auto mt-8 max-w-2xl font-sans text-sm sm:text-base leading-relaxed text-[color:var(--foreground)]/80 space-y-5">
        <p>
          <span className="font-serif italic text-[color:var(--burgundy)]">
            #OfoDiMma
          </span>{" "}
          came together so naturally, blending Justice&rsquo;s surname,{" "}
          <strong className="font-semibold text-[color:var(--burgundy)]">
            &ldquo;Ofokansi,&rdquo;
          </strong>{" "}
          with Blessing&rsquo;s middle name,{" "}
          <strong className="font-semibold text-[color:var(--burgundy)]">
            &ldquo;Mmayen.&rdquo;
          </strong>
        </p>
        <p>
          In Igbo, <em className="font-serif italic">&ldquo;Ọ dị mma&rdquo;</em>{" "}
          means <em className="font-serif italic">&ldquo;it is good.&rdquo;</em>
        </p>
        <p>
          It&rsquo;s more than just a hashtag — it reflects our journey, our
          love, our roots, and the beautiful life we&rsquo;re building together.
        </p>
      </div>

      <div className="mx-auto mt-12 flex items-center justify-center gap-8 text-[color:var(--burgundy)]">
        {[RingsIcon, ToastIcon].map((Icon, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{
              opacity: 1,
              scale: 1,
              rotate: [0, -16, 13, -10, 7, -4, 0],
            }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{
              duration: 0.8,
              delay: 0.1 + i * 0.14,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="inline-block"
          >
            <Icon className="h-10 w-10 sm:h-12 sm:w-12" />
          </motion.span>
        ))}
      </div>

      <p className="mt-10 font-sans text-[11px] sm:text-xs uppercase tracking-[0.4em] text-[color:var(--burgundy-soft)]/80">
        Tag your photos &middot; Share the joy
      </p>
    </SectionShell>
  );
}
