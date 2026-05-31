"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";

// RSVP contact — kept in sync with the RSVP section.
const RSVP_EMAIL = "theofokansis@gmail.com";

type QA = { q: string; a: ReactNode };

export default function QnA({
  rsvpDeadline,
}: {
  // The RSVP deadline string from the backend, shared with the RSVP section so
  // the two can never disagree.
  rsvpDeadline: string;
}) {
  const QUESTIONS: QA[] = [
    {
      q: "When is the RSVP deadline?",
      a: (
        <>
          Please RSVP by <strong>{rsvpDeadline}</strong> so we can have an
          accurate headcount. :)
        </>
      ),
    },
    {
      q: "Can I bring a plus one?",
      // TODO: confirm the couple's plus-one policy.
      a: (
        <>
          To help us plan, admission is strictly by invitation. If a plus one
          has been reserved for you, it will be noted on your invitation. If
          you&rsquo;re unsure, just reach out and we&rsquo;ll be happy to
          confirm.
        </>
      ),
    },
    {
      q: "Whom should I call with questions?",
      // TODO: add a contact name + phone number if the couple would like one
      // listed alongside the email.
      a: (
        <>
          For anything at all, email us at{" "}
          <a
            href={`mailto:${RSVP_EMAIL}`}
            className="font-medium text-[color:var(--burgundy)] underline decoration-[color:var(--burgundy)]/30 underline-offset-4 hover:decoration-[color:var(--burgundy)]"
          >
            {RSVP_EMAIL}
          </a>{" "}
          and we&rsquo;ll get right back to you.
        </>
      ),
    },
  ];

  return (
    <SectionShell
      id="qna"
      className="bg-[color:var(--cream)]"
      innerClassName=""
    >
      <div className="text-center">
        <SectionEyebrow>Q &amp; A</SectionEyebrow>
        <SectionTitle className="mt-4">Got a question?</SectionTitle>
        <SectionDivider />
      </div>

      <div className="mx-auto mt-6 max-w-2xl divide-y divide-[color:var(--burgundy)]/10">
        {QUESTIONS.map((item, i) => (
          <motion.div
            key={item.q}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="py-7"
          >
            <h3 className="font-serif text-2xl sm:text-3xl text-[color:var(--burgundy)]">
              {item.q}
            </h3>
            <p className="mt-3 font-sans text-sm sm:text-base leading-relaxed text-[color:var(--foreground)]/80">
              {item.a}
            </p>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}
