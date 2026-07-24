import type { Metadata } from "next";
import { rsvpsCollection } from "@/lib/collections";

export const metadata: Metadata = {
  title: "Your Invitation — Blessing & Justice",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

function NotFoundCard() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[color:var(--cream)] px-6">
      <div className="max-w-md rounded-2xl border border-[color:var(--burgundy)]/15 bg-white/90 p-10 text-center shadow-[0_20px_60px_-30px_rgba(90,26,26,0.35)]">
        <p className="font-serif text-2xl text-[color:var(--burgundy)]">
          This invitation link isn&rsquo;t valid
        </p>
        <p className="mt-3 font-serif italic text-[color:var(--burgundy-soft)]/85">
          Please check the link in your email, or reach out to us through the
          RSVP page.
        </p>
      </div>
    </main>
  );
}

export default async function IvPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) return <NotFoundCard />;

  const col = await rsvpsCollection();
  const doc = await col.findOne({ ivToken: token });
  if (!doc) return <NotFoundCard />;

  const firstName = doc.name.split(" ")[0] || doc.name;
  const base = `/api/iv/${token}`;

  return (
    <main className="min-h-dvh bg-[color:var(--cream)] px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.45em] text-[color:var(--burgundy-soft)]/80">
          Blessing &amp; Justice
        </p>
        <h1 className="mt-4 font-serif text-4xl sm:text-5xl text-[color:var(--burgundy)]">
          Dear {firstName}, you&rsquo;re invited
        </h1>
        <p className="mt-3 font-serif italic text-[color:var(--burgundy-soft)]/85">
          Here is your personal invitation and access card.
        </p>

        <div className="mt-10 space-y-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${base}/1.png`}
            alt="Wedding invitation card"
            className="w-full rounded-xl shadow-[0_24px_70px_-30px_rgba(90,26,26,0.45)]"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${base}/2.png`}
            alt={`Access card for ${doc.name}`}
            className="w-full rounded-xl shadow-[0_24px_70px_-30px_rgba(90,26,26,0.45)]"
          />
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={`${base}/pdf`}
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--burgundy)] px-8 py-4 font-sans text-sm uppercase tracking-[0.3em] text-white transition-colors hover:bg-[color:var(--burgundy-soft)]"
          >
            Download PDF
          </a>
          <a
            href={`${base}/2.png`}
            download={`Access card - ${doc.name}.png`}
            className="inline-flex items-center justify-center rounded-full border border-[color:var(--burgundy)]/30 bg-white px-8 py-4 font-sans text-sm uppercase tracking-[0.3em] text-[color:var(--burgundy)] transition-colors hover:border-[color:var(--burgundy)]/60"
          >
            Download card PNG
          </a>
        </div>

        <p className="mt-10 font-serif italic text-sm text-[color:var(--burgundy-soft)]/70">
          We can&rsquo;t wait to celebrate with you. #OfoDiMma
        </p>
      </div>
    </main>
  );
}
