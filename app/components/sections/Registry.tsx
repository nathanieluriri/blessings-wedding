"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import SectionShell, {
  SectionDivider,
  SectionEyebrow,
  SectionTitle,
} from "./SectionShell";

const BANK = {
  name: "Ofokansi Justice and Iwok Blessing",
  account: "2040717188",
  bank: "First Bank",
};

export default function Registry() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BANK.account);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — the number is visible to copy manually */
    }
  };

  return (
    <SectionShell
      id="registry"
      className="bg-[color:var(--cream-deep)]"
      innerClassName="text-center"
    >
      <SectionEyebrow>With gratitude</SectionEyebrow>
      <SectionTitle className="mt-4">Gift Registry</SectionTitle>
      <SectionDivider />

      <p className="mx-auto max-w-xl font-serif italic text-base sm:text-lg text-[color:var(--burgundy-soft)]/85">
        Your presence at our wedding is the greatest gift we could ask for.
      </p>

      <div className="mx-auto mt-6 max-w-2xl space-y-5 font-sans text-sm sm:text-base leading-relaxed text-[color:var(--foreground)]/80">
        <p>
          However, for friends and family who would like to honour us with a
          gift, we would greatly appreciate a monetary contribution in place of
          physical presents.
        </p>
        <p>
          Thank you for your love and support as we begin this new chapter
          together.
        </p>
      </div>

      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="bank-details"
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--burgundy)]/40 px-6 py-3 font-sans text-xs uppercase tracking-[0.3em] text-[color:var(--burgundy)] hover:bg-[color:var(--burgundy)] hover:text-white transition-colors"
        >
          {open ? "Hide bank details" : "View bank details"}
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <motion.path
              animate={{ rotate: open ? 180 : 0 }}
              style={{ transformOrigin: "center" }}
              d="M6 9 l6 6 6 -6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="bank-details"
            key="bank-details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-[color:var(--burgundy)]/15 bg-white/85 backdrop-blur-sm p-7 text-left shadow-[0_20px_60px_-30px_rgba(90,26,26,0.35)]">
              <p className="font-sans text-[11px] uppercase tracking-[0.4em] text-[color:var(--burgundy-soft)]/85">
                Bank Details
              </p>

              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="font-sans text-[10px] uppercase tracking-[0.3em] text-[color:var(--burgundy-soft)]/70">
                    Name
                  </dt>
                  <dd className="mt-1 font-serif text-lg text-[color:var(--burgundy)]">
                    {BANK.name}
                  </dd>
                </div>

                <div>
                  <dt className="font-sans text-[10px] uppercase tracking-[0.3em] text-[color:var(--burgundy-soft)]/70">
                    Account Number
                  </dt>
                  <dd className="mt-1 flex items-center gap-3">
                    <span className="font-serif text-2xl tracking-wide text-[color:var(--burgundy)] tabular-nums">
                      {BANK.account}
                    </span>
                    <button
                      type="button"
                      onClick={copyAccount}
                      className="rounded-full border border-[color:var(--burgundy)]/30 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-[color:var(--burgundy)] hover:bg-[color:var(--burgundy)] hover:text-white transition-colors"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </dd>
                </div>

                <div>
                  <dt className="font-sans text-[10px] uppercase tracking-[0.3em] text-[color:var(--burgundy-soft)]/70">
                    Bank
                  </dt>
                  <dd className="mt-1 font-serif text-lg text-[color:var(--burgundy)]">
                    {BANK.bank}
                  </dd>
                </div>
              </dl>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionShell>
  );
}
