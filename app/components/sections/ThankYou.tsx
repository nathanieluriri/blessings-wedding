"use client";

import { motion } from "framer-motion";

export default function ThankYou() {
  return (
    <section
      id="thank-you"
      className="relative w-full px-6 py-24 sm:py-28 md:py-32 bg-[color:var(--cream)]"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl"
      >
        <div
          className="relative rounded-[28px] p-2"
          style={{
            background:
              "repeating-linear-gradient(135deg, var(--burgundy) 0 14px, var(--burgundy-soft) 14px 28px)",
          }}
        >
          <div className="rounded-[22px] bg-[color:var(--cream)] px-8 py-14 sm:px-12 sm:py-16 text-center">
            <p className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.4em] text-[color:var(--burgundy-soft)]/85">
              With all our love
            </p>
            <h2 className="mt-4 font-serif text-5xl sm:text-6xl text-[color:var(--burgundy)] tracking-tight">
              Thank You
            </h2>
            <div className="mx-auto my-6 flex items-center justify-center gap-3">
              <span className="block h-px w-10 bg-[color:var(--burgundy)]/30" />
              <span className="block h-1.5 w-1.5 rounded-full bg-[color:var(--burgundy)]/40" />
              <span className="block h-px w-10 bg-[color:var(--burgundy)]/30" />
            </div>
            <p className="mx-auto max-w-md font-serif italic text-base sm:text-lg text-[color:var(--burgundy-soft)]/85">
              For joining us on this special day. Your presence is the best gift
              we could receive.
            </p>
            <div className="mt-10 flex flex-col items-center gap-2 leading-none">
              <h3 className="font-serif text-3xl sm:text-4xl text-[color:var(--burgundy)]">
                Blessing
              </h3>
              <span
                aria-hidden="true"
                className="font-serif italic text-2xl sm:text-3xl text-[color:var(--burgundy)]/70"
              >
                &amp;
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-[color:var(--burgundy)]">
                Justice
              </h3>
            </div>

            <p className="mt-10 font-sans text-[10px] sm:text-xs uppercase tracking-[0.4em] text-[color:var(--burgundy-soft)]/70">
              #OfoDiMma &middot; 19 . 12 . 2026
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
