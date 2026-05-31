"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";

type Attendance = "yes" | "no" | null;

export default function RSVP({
  monthDay,
  rsvpDeadline,
}: {
  // Both derived from the backend by the server page: monthDay (e.g.
  // "December 19th") from the wedding date, rsvpDeadline (e.g. "30 November
  // 2026") from the deadline setting.
  monthDay: string;
  rsvpDeadline: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [attending, setAttending] = useState<Attendance>(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 1 && attending !== null && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length <= 1 || attending === null || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, attending, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Could not reach the server. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <SectionShell
      id="rsvp"
      className="bg-[color:var(--cream)]"
      innerClassName=""
    >
      <div className="text-center">
        <SectionEyebrow>Will you join us?</SectionEyebrow>
        <SectionTitle className="mt-4">Confirm your attendance</SectionTitle>
        <SectionDivider />
        <p className="mx-auto max-w-xl font-serif italic text-base sm:text-lg text-[color:var(--burgundy-soft)]/80">
          Please let us know by {rsvpDeadline}.
        </p>
        <p className="mx-auto mt-3 max-w-xl font-sans text-sm text-[color:var(--burgundy-soft)]/80">
          Prefer email? RSVP to{" "}
          <a
            href="mailto:theofokansis@gmail.com"
            className="font-medium text-[color:var(--burgundy)] underline decoration-[color:var(--burgundy)]/30 underline-offset-4 hover:decoration-[color:var(--burgundy)]"
          >
            theofokansis@gmail.com
          </a>
          .
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleSubmit}
            className="mx-auto mt-12 max-w-xl rounded-2xl border border-[color:var(--burgundy)]/15 bg-white/85 backdrop-blur-sm p-6 sm:p-8 shadow-[0_20px_60px_-30px_rgba(90,26,26,0.35)]"
          >
            <label className="block">
              <span className="font-sans text-[11px] uppercase tracking-[0.3em] text-[color:var(--burgundy-soft)]/85">
                Full name *
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-2 w-full rounded-lg border border-[color:var(--burgundy)]/20 bg-white px-4 py-3 font-serif text-[color:var(--foreground)] outline-none focus:border-[color:var(--burgundy)] focus:ring-2 focus:ring-[color:var(--burgundy)]/15 transition"
              />
            </label>

            <label className="mt-5 block">
              <span className="font-sans text-[11px] uppercase tracking-[0.3em] text-[color:var(--burgundy-soft)]/85">
                Email (optional)
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-2 w-full rounded-lg border border-[color:var(--burgundy)]/20 bg-white px-4 py-3 font-serif text-[color:var(--foreground)] outline-none focus:border-[color:var(--burgundy)] focus:ring-2 focus:ring-[color:var(--burgundy)]/15 transition"
              />
            </label>

            <fieldset className="mt-5">
              <legend className="font-sans text-[11px] uppercase tracking-[0.3em] text-[color:var(--burgundy-soft)]/85">
                Will you attend? *
              </legend>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(
                  [
                    { val: "yes", label: "Yes, I'll be there" },
                    { val: "no", label: "No, I can't make it" },
                  ] as const
                ).map((opt) => {
                  const selected = attending === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setAttending(opt.val)}
                      className={`rounded-lg border px-4 py-3 font-serif text-sm sm:text-base transition-all ${
                        selected
                          ? "border-[color:var(--burgundy)] bg-[color:var(--burgundy)] text-white shadow-[0_8px_22px_-12px_rgba(90,26,26,0.6)]"
                          : "border-[color:var(--burgundy)]/25 bg-white text-[color:var(--burgundy)] hover:border-[color:var(--burgundy)]/55"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="mt-5 block">
              <span className="font-sans text-[11px] uppercase tracking-[0.3em] text-[color:var(--burgundy-soft)]/85">
                Message for the couple (optional)
              </span>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write us a few words..."
                className="mt-2 w-full resize-none rounded-lg border border-[color:var(--burgundy)]/20 bg-white px-4 py-3 font-serif text-[color:var(--foreground)] outline-none focus:border-[color:var(--burgundy)] focus:ring-2 focus:ring-[color:var(--burgundy)]/15 transition"
              />
            </label>

            {error && (
              <p className="mt-5 text-center font-sans text-sm text-[color:var(--burgundy)]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-sans text-sm uppercase tracking-[0.3em] transition-all ${
                canSubmit
                  ? "bg-[color:var(--burgundy)] text-white hover:bg-[color:var(--burgundy-soft)] shadow-[0_12px_30px_-14px_rgba(90,26,26,0.6)]"
                  : "bg-[color:var(--burgundy)]/30 text-white/80 cursor-not-allowed"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                aria-hidden="true"
                fill="currentColor"
              >
                <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
              </svg>
              {submitting ? "Sending…" : "Confirm"}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-12 max-w-xl rounded-2xl border border-[color:var(--burgundy)]/20 bg-white/90 p-10 text-center shadow-[0_20px_60px_-30px_rgba(90,26,26,0.4)]"
          >
            <p className="font-serif text-3xl text-[color:var(--burgundy)]">
              {attending === "yes"
                ? "We can't wait to celebrate with you!"
                : "Thank you for letting us know."}
            </p>
            <p className="mt-4 font-serif italic text-[color:var(--burgundy-soft)]/85">
              {attending === "yes"
                ? `See you on ${monthDay}, ${name.split(" ")[0] || "friend"}.`
                : "You will be missed — sending love your way."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionShell>
  );
}
