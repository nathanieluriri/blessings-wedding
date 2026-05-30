"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[color:var(--cream)] px-6"
      aria-label="Wedding invitation"
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="invitation-float text-center max-w-[90vw] sm:max-w-xl md:max-w-2xl"
      >
        <p className="font-sans text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.45em] text-gray-500 mb-8 sm:mb-10">
          You are cordially invited to celebrate the wedding of
        </p>

        <div className="flex flex-col items-center gap-2 sm:gap-3 leading-none">
          <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-gray-900 tracking-tight">
            Blessing
          </h1>
          <span
            aria-hidden="true"
            className="font-serif italic text-4xl sm:text-5xl md:text-6xl text-gray-700 -my-1 sm:-my-2"
          >
            &amp;
          </span>
          <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-gray-900 tracking-tight">
            Justice
          </h1>
        </div>

        <div className="mx-auto mt-10 sm:mt-12 h-px w-16 bg-gray-300" />

        <p className="mt-8 sm:mt-10 font-serif text-base sm:text-lg md:text-xl leading-relaxed text-gray-700 max-w-md mx-auto">
          We would like to invite you to celebrate with us the most special day
          of our lives. It would be an honor to have you present at this
          important moment.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 1.2, ease: "easeOut" }}
          className="mt-12 flex flex-col items-center gap-3"
        >
          <p className="font-serif italic text-sm text-[color:var(--burgundy-soft)]/70 tracking-[0.15em]">
            Scroll to begin
          </p>
          <motion.span
            aria-hidden="true"
            className="block h-7 w-px bg-[color:var(--burgundy)]/30"
            animate={{ opacity: [0.3, 1, 0.3], scaleY: [0.7, 1, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
