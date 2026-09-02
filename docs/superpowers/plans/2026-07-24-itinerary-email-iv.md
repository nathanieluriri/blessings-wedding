# Itinerary, Required Email & IV Invitation Emails — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Status:** Completed 2026-07-24. The IV card art was later replaced with the designer's v2 set in commit `352b7be` (2026-09-02); asset names, the page-2 personalization notes and the `lib/iv/render.ts` snippet below have been updated to v2, so this plan still reads true against the current code. Everything else is the plan as executed.

**Goal:** Update itinerary times, make guest email compulsory (removing WhatsApp), and email every approved guest their personalized two-page wedding IV with a view/download page.

**Architecture:** The IV is two SVG cards in the repo-root `IV/` folder; page 2 is a template carrying an editable `<text id="guest-name">` node. (The designer's own export has no such node — the name ships as outlined paths — so the template is cut by hand from it; see the spec's "Re-cutting the page-2 template" section.) A server-side render library (`lib/iv/render.ts`) personalizes the SVG and rasterizes it with `@resvg/resvg-js` (Saol Display TTF loaded from `IV/`). Token-keyed public endpoints serve live PNGs and a two-page PDF (`pdf-lib`); the email (existing Resend infra) embeds the PNG URLs and links to `/iv/[token]`. Sending is triggered automatically when an admin accepts an RSVP, plus a bulk backlog button in the admin.

**Tech Stack:** Next.js 16.2.4 (App Router), MongoDB, Resend, `@resvg/resvg-js`, `pdf-lib`, Tailwind 4, shadcn-style UI components.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-24-itinerary-email-iv-design.md`.
- AGENTS.md: this Next.js version has breaking changes — before writing route/config code, check the relevant guide in `node_modules/next/dist/docs/`. Existing code already follows the `params: Promise<...>` pattern; copy existing patterns.
- No test runner exists in this repo. Verification = `npx tsc --noEmit`, `npm run lint`, `npm run build`, plus a runnable smoke script for the render library and manual browser checks. Do not add a test framework.
- Itinerary copy (exact): We Do `12:30 pm`, We Drink `2:00 pm`, We Eat `3:00 pm`, We Party `7:00 pm`.
- Email subject (exact): `You're invited — Blessing & Justice's Wedding`.
- IV assets (exact paths): `IV/Wedding card v2-01.svg` (page 1, static), `IV/Wedding card v2-02-template.svg` (page 2, has `<text id="guest-name">`), `IV/SaolDisplay-Regular/SaolDisplay-Regular.ttf`. `IV/Wedding card v2-02.svg` is the pristine designer export — kept for re-cutting the template, NOT used by code.
- Card viewBox is `0 0 450 324`; render PNGs at 3× (1350×972).
- Tokens: `crypto.randomBytes(16).toString("hex")` → 32 lowercase hex chars.
- Guests must never receive duplicate IVs: every send path checks `ivSentAt`.
- Windows dev machine: quote all paths; every `IV/Wedding card v2-*.svg` name contains spaces.

---

### Task 1: Itinerary times

**Files:**
- Modify: `app/components/sections/Itinerary.tsx:94-97`

**Interfaces:** none (display-only change).

- [ ] **Step 1: Change the four time strings**

Replace lines 94–97 of `app/components/sections/Itinerary.tsx`:

```tsx
const WE_DO: Item = { title: "We Do", time: "12:30 pm", icon: <RingsIcon /> };
const WE_DRINK: Item = { title: "We Drink", time: "2:00 pm", icon: <GlassIcon /> };
const WE_EAT: Item = { title: "We Eat", time: "3:00 pm", icon: <ForkKnifeIcon /> };
const WE_PARTY: Item = { title: "We Party", time: "7:00 pm", icon: <NoteIcon /> };
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/sections/Itinerary.tsx
git commit -m "Update itinerary times (12:30 do, 2pm drink, 3pm eat, 7pm party)"
```

---

### Task 2: Remove WhatsApp, require email on RSVP

**Files:**
- Modify: `app/components/sections/RSVP.tsx`
- Modify: `app/components/sections/QnA.tsx`
- Modify: `app/api/rsvp/route.ts`
- Delete: `app/components/WhatsAppLink.tsx`

**Interfaces:**
- Produces: `POST /api/rsvp` now rejects missing/invalid `email` with 400 `{ error: "Please enter a valid email address." }`. All new `RsvpDoc` rows carry `email`.

- [ ] **Step 1: RSVP.tsx — drop WhatsApp, require email**

In `app/components/sections/RSVP.tsx`:

1. Delete the import `import WhatsAppLink from "../WhatsAppLink";`
2. Delete the whole paragraph (lines 72–74):

```tsx
        <p className="mx-auto mt-3 max-w-xl font-sans text-sm text-[color:var(--burgundy-soft)]/80">
          Prefer WhatsApp? RSVP via <WhatsAppLink />.
        </p>
```

3. Add an email regex above the component (after the `type Attendance` line):

```tsx
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

4. Replace the `canSubmit` line:

```tsx
  const canSubmit =
    name.trim().length > 1 &&
    EMAIL_RE.test(email.trim()) &&
    attending !== null &&
    !submitting;
```

5. Replace the guard at the top of `handleSubmit`:

```tsx
    if (
      name.trim().length <= 1 ||
      !EMAIL_RE.test(email.trim()) ||
      attending === null ||
      submitting
    )
      return;
```

6. In the email `<label>`: change the span text `Email (optional)` → `Email *` and add `required` to the `<input type="email" ...>`.

- [ ] **Step 2: QnA.tsx — remove WhatsApp answer**

In `app/components/sections/QnA.tsx`: delete the import `import WhatsAppLink from "../WhatsAppLink";` and replace the last Q&A entry (lines 43–51) with:

```tsx
    {
      q: "Whom should I reach with questions?",
      a: (
        <>
          Drop us a note in the message box of the RSVP form below and
          we&rsquo;ll get right back to you.
        </>
      ),
    },
```

- [ ] **Step 3: Delete the component**

```bash
git rm app/components/WhatsAppLink.tsx
```

- [ ] **Step 4: API — email required**

In `app/api/rsvp/route.ts`, replace the optional email check (lines 32–37):

```ts
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }
```

and in the insert, change `email: email || undefined,` → `email,`. Leave the notification `after()` call as is (`email: email || undefined` there can become `email`).

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors, no unused-import warnings.

Grep check: `grep -ri whatsapp app lib` → no matches.

- [ ] **Step 6: Commit**

```bash
git add -A app
git commit -m "Remove WhatsApp contact; make guest email required on RSVP"
```

---

### Task 3: IV render library (SVG personalization → PNG/PDF)

**Files:**
- Create: `lib/iv/render.ts`
- Create: `scripts/iv-preview.ts` (smoke script)
- Modify: `next.config.ts`
- Modify: `package.json` (deps)

**Interfaces:**
- Produces (used by Tasks 4–5):
  - `loadPage1Svg(): Promise<string>`
  - `personalizeAccessCard(guestName: string): Promise<string>`
  - `renderCardPng(svg: string): Buffer`
  - `renderIvPdf(guestName: string): Promise<Uint8Array>`

- [ ] **Step 1: Install dependencies**

```bash
npm install @resvg/resvg-js pdf-lib
npm install -D tsx
```

- [ ] **Step 2: Check Next docs for file-tracing config**

Read `node_modules/next/dist/docs/` for the current name of the "output file tracing includes" option (search: `grep -ril outputFileTracingIncludes node_modules/next/dist/docs | head -3`). Use whatever this Next version documents in Step 4.

- [ ] **Step 3: Write `lib/iv/render.ts`**

```ts
import { promises as fs } from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";
import { PDFDocument } from "pdf-lib";

// The IV is a two-page card set living in the repo-root IV/ folder:
// page 1 (Wedding card v2-01.svg) is the static invitation; page 2 is the
// access card whose <text id="guest-name"> is swapped for the guest's name.
// Saol Display renders that name; other card text is outlined paths.
// "Wedding card v2-02.svg" is the untouched designer export; the template
// beside it is that file with the outlined "NAME OF GUEST" glyphs replaced by
// the live <text> node, so re-cutting it from a new export stays a small diff.
const IV_DIR = path.join(process.cwd(), "IV");
const PAGE1_FILE = path.join(IV_DIR, "Wedding card v2-01.svg");
const PAGE2_FILE = path.join(IV_DIR, "Wedding card v2-02-template.svg");
const FONT_FILE = path.join(
  IV_DIR,
  "SaolDisplay-Regular",
  "SaolDisplay-Regular.ttf"
);

// viewBox is 450x324; 3x keeps the name crisp in email clients and downloads.
const RENDER_SCALE = 3;
export const CARD_WIDTH = 450;
export const CARD_HEIGHT = 324;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function loadPage1Svg(): Promise<string> {
  return fs.readFile(PAGE1_FILE, "utf8");
}

export async function personalizeAccessCard(
  guestName: string
): Promise<string> {
  const svg = await fs.readFile(PAGE2_FILE, "utf8");
  const name = guestName.trim() || "Honoured Guest";
  // .cls-guest-name sets font-size:10px via the SVG's <style> block, and
  // CSS beats presentation attributes — an inline style is the only override
  // that shrinks long names.
  const fontSize =
    name.length > 24 ? Math.max(6, Math.round((10 * 24 * 10) / name.length) / 10) : 10;
  const personalized = svg.replace(
    /(<text id="guest-name"[^>]*)(>)[\s\S]*?(<\/text>)/,
    `$1 style="font-size:${fontSize}px"$2<tspan x="0" y="0">${escapeXml(
      name
    )}</tspan>$3`
  );
  if (personalized === svg) {
    throw new Error("IV template missing <text id=\"guest-name\"> node");
  }
  return personalized;
}

export function renderCardPng(svg: string): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "zoom", value: RENDER_SCALE },
    font: {
      fontFiles: [FONT_FILE],
      loadSystemFonts: false,
      defaultFontFamily: "Saol Display",
    },
  });
  return resvg.render().asPng();
}

export async function renderIvPdf(guestName: string): Promise<Uint8Array> {
  const [page1, page2] = await Promise.all([
    loadPage1Svg(),
    personalizeAccessCard(guestName),
  ]);
  const pdf = await PDFDocument.create();
  for (const svg of [page1, page2]) {
    const png = await pdf.embedPng(renderCardPng(svg));
    const page = pdf.addPage([CARD_WIDTH, CARD_HEIGHT]);
    page.drawImage(png, { x: 0, y: 0, width: CARD_WIDTH, height: CARD_HEIGHT });
  }
  return pdf.save();
}
```

- [ ] **Step 4: Ship `IV/` with the server bundle**

In `next.config.ts` (option name confirmed in Step 2):

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The IV routes read the SVG cards + font from IV/ at runtime; file tracing
  // would otherwise drop them from the serverless bundle.
  outputFileTracingIncludes: {
    "/api/iv/**": ["./IV/**"],
    "/iv/**": ["./IV/**"],
  },
};

export default nextConfig;
```

- [ ] **Step 5: Write the smoke script `scripts/iv-preview.ts`**

```ts
// Renders sample IV output for visual inspection.
// Usage: npx tsx scripts/iv-preview.ts <outputDir> [guest name]
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import {
  loadPage1Svg,
  personalizeAccessCard,
  renderCardPng,
  renderIvPdf,
} from "../lib/iv/render";

async function main() {
  const outDir = process.argv[2] ?? "iv-preview-out";
  const name = process.argv[3] ?? "Olivia Bennett";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    path.join(outDir, "page1.png"),
    renderCardPng(await loadPage1Svg())
  );
  writeFileSync(
    path.join(outDir, "page2.png"),
    renderCardPng(await personalizeAccessCard(name))
  );
  writeFileSync(path.join(outDir, "iv.pdf"), await renderIvPdf(name));
  console.log(`Wrote page1.png, page2.png, iv.pdf to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 6: Run the smoke script — short and long names**

```bash
npx tsx scripts/iv-preview.ts "$SCRATCHPAD/iv-short" "Ada Obi"
npx tsx scripts/iv-preview.ts "$SCRATCHPAD/iv-long" "Chukwuemeka Oluwaseun Okonkwo-Adeyemi"
```

Expected: both runs succeed. Open the PNGs (Read tool renders images): page 1 matches the static card; page 2 shows the name centered on the name line in Saol Display; the long name is smaller but not clipped; `iv.pdf` opens with two pages.

- [ ] **Step 7: Verify types + commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add lib/iv/render.ts scripts/iv-preview.ts next.config.ts package.json package-lock.json
git commit -m "Add IV render library: personalized SVG -> PNG/PDF"
```

---

### Task 4: Data model + public IV endpoints and page

**Files:**
- Modify: `lib/collections.ts` (RsvpDoc fields + index)
- Create: `app/api/iv/[token]/[asset]/route.ts`
- Create: `app/iv/[token]/page.tsx`

**Interfaces:**
- Consumes: `loadPage1Svg`, `personalizeAccessCard`, `renderCardPng`, `renderIvPdf` from `@/lib/iv/render`.
- Produces:
  - `RsvpDoc.ivToken?: string`, `RsvpDoc.ivSentAt?: Date` (used by Tasks 5–6).
  - `GET /api/iv/[token]/1.png | 2.png | pdf` — used inside the email.
  - `GET /iv/[token]` — the guest-facing invitation page.

- [ ] **Step 1: Extend `RsvpDoc`**

In `lib/collections.ts`, add to the `RsvpDoc` interface after `reviewedAt?: Date;`:

```ts
  // ── IV (invitation card) delivery ──
  ivToken?: string; // unguessable public token for /iv/[token]; 32 hex chars
  ivSentAt?: Date; // set when the IV email was successfully sent
```

And in `ensureIndexes()` after the rsvps `createdAt` index:

```ts
  await db
    .collection<RsvpDoc>("rsvps")
    .createIndex({ ivToken: 1 }, { unique: true, sparse: true });
```

- [ ] **Step 2: Asset route `app/api/iv/[token]/[asset]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { rsvpsCollection } from "@/lib/collections";
import {
  loadPage1Svg,
  personalizeAccessCard,
  renderCardPng,
  renderIvPdf,
} from "@/lib/iv/render";

// Serves the IV assets referenced by the invitation email and the /iv page:
//   1.png — static page-1 invitation card
//   2.png — access card personalized with the guest's name
//   pdf   — both pages as a downloadable PDF
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; asset: string }> }
) {
  const { token, asset } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const col = await rsvpsCollection();
  const doc = await col.findOne({ ivToken: token });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Token-keyed and immutable per guest — let clients cache for a day.
  const cache = "private, max-age=86400";
  try {
    if (asset === "1.png") {
      return new Response(new Uint8Array(renderCardPng(await loadPage1Svg())), {
        headers: { "Content-Type": "image/png", "Cache-Control": cache },
      });
    }
    if (asset === "2.png") {
      return new Response(
        new Uint8Array(renderCardPng(await personalizeAccessCard(doc.name))),
        { headers: { "Content-Type": "image/png", "Cache-Control": cache } }
      );
    }
    if (asset === "pdf") {
      const safeName = doc.name.replace(/[^\p{L}\p{N} .-]/gu, "").trim() || "Guest";
      return new Response(new Uint8Array(await renderIvPdf(doc.name)), {
        headers: {
          "Content-Type": "application/pdf",
          "Cache-Control": cache,
          "Content-Disposition": `attachment; filename="Blessing & Justice IV - ${safeName}.pdf"`,
        },
      });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (err) {
    console.error(`[iv] render failed (${asset}):`, err);
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Invitation page `app/iv/[token]/page.tsx`**

```tsx
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
```

- [ ] **Step 4: Manual verification with the dev server**

1. `npm run dev`
2. Seed a token on an existing RSVP via a throwaway script `scripts/iv-seed-token.ts` (delete after this task, or keep — it's harmless):

```ts
// Stamps a known ivToken on the most recent RSVP so /iv/<token> can be
// opened locally. Usage: npx tsx --env-file=.env.local scripts/iv-seed-token.ts
import { rsvpsCollection } from "../lib/collections";

const TOKEN = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

async function main() {
  const col = await rsvpsCollection();
  const doc = await col.find().sort({ createdAt: -1 }).next();
  if (!doc) throw new Error("No RSVPs in the database — submit one first.");
  await col.updateOne({ _id: doc._id }, { $set: { ivToken: TOKEN } });
  console.log(`Token set on "${doc.name}" → http://localhost:3000/iv/${TOKEN}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Run: `npx tsx --env-file=.env.local scripts/iv-seed-token.ts` (if the Mongo URI lives in a different env file, point `--env-file` there).

3. Open `http://localhost:3000/iv/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` — both cards render, name is on card 2, PDF button downloads a 2-page PDF.
4. Open `http://localhost:3000/iv/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` — "This invitation link isn't valid".

- [ ] **Step 5: Verify types + commit**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

```bash
git add lib/collections.ts "app/api/iv" "app/iv"
git commit -m "Add IV data fields, token-keyed asset endpoints, and invitation page"
```

---

### Task 5: IV email template + sender

**Files:**
- Modify: `lib/email/templates.ts` (guest-facing footer + `ivInviteEmail`)
- Create: `lib/iv/send.ts`

**Interfaces:**
- Consumes: `sendEmail` (`@/lib/email/send`), `getSiteUrl` (`@/lib/site-url`), `rsvpsCollection`.
- Produces (used by Task 6):
  - `ivInviteEmail(opts: { guestName: string; inviteUrl: string; page1PngUrl: string; page2PngUrl: string; pdfUrl: string }): BuiltEmail`
  - `sendIvEmail(rsvp: { _id: ObjectId; name: string; email: string; ivToken?: string }): Promise<{ ok: boolean; error?: string }>`

- [ ] **Step 1: Make the layout footer overridable**

In `lib/email/templates.ts`, `layout()` currently hardcodes an admin footer ("You're receiving this because you manage the wedding site") — wrong for guests. Change the signature and footer block:

```ts
function layout(heading: string, bodyHtml: string, footerNote?: string): string {
```

and replace the hardcoded footer line inside the template string:

```ts
              ${esc(COUPLE)} &middot; ${
    footerNote ?? "Wedding Dashboard<br>You're receiving this because you manage the wedding site."
  }
```

(Existing callers pass no third argument and keep the admin footer. Note: `footerNote` is trusted template-author HTML, not user input.)

- [ ] **Step 2: Add `ivInviteEmail` at the end of `lib/email/templates.ts`**

```ts
// ── Guest IV (invitation card) delivery ────────────────────────────────────

export function ivInviteEmail(opts: {
  guestName: string;
  inviteUrl: string;
  page1PngUrl: string;
  page2PngUrl: string;
  pdfUrl: string;
}): BuiltEmail {
  const firstName = opts.guestName.trim().split(/\s+/)[0] || opts.guestName;
  const subject = `You're invited — ${COUPLE}'s Wedding`;
  const card = (src: string, alt: string) =>
    `<img src="${src}" alt="${esc(alt)}" width="480" style="display:block;width:100%;max-width:480px;margin:0 auto 18px;border-radius:10px;border:1px solid ${BORDER};" />`;
  const html = layout(
    `Dear ${esc(firstName)}, you're invited`,
    `<p style="${P}">With joy in our hearts, here is your personal invitation and access card for our wedding. Please keep it safe and bring it along on the day.</p>
    ${card(opts.page1PngUrl, "Wedding invitation card")}
    ${card(opts.page2PngUrl, `Access card for ${opts.guestName}`)}
    ${button(opts.inviteUrl, "View your invitation")}
    <p style="${P}">You can also <a href="${opts.pdfUrl}" style="color:${BURGUNDY};">download your copy as a PDF</a> to keep or print.</p>
    <p style="${FINE}">This invitation is personal to you.</p>`,
    `${HASHTAG}<br>You're receiving this because you RSVP'd to our wedding.`
  );
  const text = `Dear ${firstName},

You're invited to ${COUPLE}'s wedding! Your personal invitation and access card are ready.

View your invitation: ${opts.inviteUrl}
Download your copy (PDF): ${opts.pdfUrl}

${HASHTAG} — see you there!`;
  return { subject, html, text };
}
```

- [ ] **Step 3: Write `lib/iv/send.ts`**

```ts
import { randomBytes } from "crypto";
import type { ObjectId } from "mongodb";
import { rsvpsCollection } from "@/lib/collections";
import { sendEmail } from "@/lib/email/send";
import { ivInviteEmail } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Sends the guest their IV email, minting the public token on first use and
 * stamping `ivSentAt` on success. Never throws — mirrors sendEmail's contract
 * so callers in request paths can't be broken by delivery failures.
 */
export async function sendIvEmail(rsvp: {
  _id: ObjectId;
  name: string;
  email: string;
  ivToken?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const col = await rsvpsCollection();

  let token = rsvp.ivToken;
  if (!token) {
    token = randomBytes(16).toString("hex");
    await col.updateOne({ _id: rsvp._id }, { $set: { ivToken: token } });
  }

  const base = getSiteUrl();
  const built = ivInviteEmail({
    guestName: rsvp.name,
    inviteUrl: `${base}/iv/${token}`,
    page1PngUrl: `${base}/api/iv/${token}/1.png`,
    page2PngUrl: `${base}/api/iv/${token}/2.png`,
    pdfUrl: `${base}/api/iv/${token}/pdf`,
  });

  const result = await sendEmail({ to: rsvp.email, ...built });
  if (result.ok) {
    await col.updateOne(
      { _id: rsvp._id },
      { $set: { ivSentAt: new Date(), updatedAt: new Date() } }
    );
  }
  return result;
}
```

- [ ] **Step 4: Verify + commit**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

```bash
git add lib/email/templates.ts lib/iv/send.ts
git commit -m "Add guest IV email template and sender"
```

---

### Task 6: Send triggers — auto on approval + bulk backlog endpoint

**Files:**
- Modify: `app/api/admin/rsvps/[id]/route.ts`
- Create: `app/api/admin/rsvps/send-ivs/route.ts`

**Interfaces:**
- Consumes: `sendIvEmail` from `@/lib/iv/send` (Task 5).
- Produces: `POST /api/admin/rsvps/send-ivs` → 200 `{ sent: number, failed: number, skippedNoEmail: number }` (consumed by Task 7's button).

- [ ] **Step 1: Auto-send on transition to `accepted`**

In `app/api/admin/rsvps/[id]/route.ts`:

1. Change the first import to `import { NextResponse, after } from "next/server";`
2. Add `import { sendIvEmail } from "@/lib/iv/send";`
3. After the `col.updateOne(...)` call and before the final `return`, add:

```ts
  // First time a guest is accepted, deliver their IV. after() so email
  // latency/failure never blocks or fails the status change; sendIvEmail
  // checks are duplicated here so we don't even schedule a no-op.
  if (next === "accepted" && doc.email && !doc.ivSentAt) {
    const { email } = doc;
    after(() =>
      sendIvEmail({
        _id: doc._id!,
        name: doc.name,
        email,
        ivToken: doc.ivToken,
      })
    );
  }
```

- [ ] **Step 2: Bulk endpoint `app/api/admin/rsvps/send-ivs/route.ts`**

```ts
import { NextResponse } from "next/server";
import { rsvpsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { sendIvEmail } from "@/lib/iv/send";

// One-shot backlog delivery: emails the IV to every accepted guest with an
// email address who hasn't received one yet. Sequential with a small delay —
// Resend allows 2 requests/second.
export async function POST() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const col = await rsvpsCollection();
  const targets = await col
    .find({ status: "accepted", ivSentAt: { $exists: false } })
    .toArray();

  let sent = 0;
  let failed = 0;
  let skippedNoEmail = 0;

  for (const doc of targets) {
    if (!doc.email) {
      skippedNoEmail++;
      continue;
    }
    const result = await sendIvEmail({
      _id: doc._id!,
      name: doc.name,
      email: doc.email,
      ivToken: doc.ivToken,
    });
    if (result.ok) sent++;
    else failed++;
    await new Promise((r) => setTimeout(r, 600));
  }

  return NextResponse.json({ sent, failed, skippedNoEmail });
}
```

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

```bash
git add "app/api/admin/rsvps"
git commit -m "Send IV automatically on approval; add bulk backlog endpoint"
```

---

### Task 7: Admin UI — bulk button + IV indicators

**Files:**
- Create: `app/admin/rsvps/send-ivs-button.tsx`
- Modify: `app/admin/rsvps/page.tsx`
- Modify: `app/admin/rsvps/rsvps-table.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/rsvps/send-ivs` (Task 6); `RsvpRow` gains `ivSentAt?: string`.

- [ ] **Step 1: `app/admin/rsvps/send-ivs-button.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, MailCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Bulk-delivers the IV email to every accepted guest who hasn't received one.
// pendingCount comes from the server page so the button can say how many
// guests it will target (and disable itself when there's nothing to send).
export default function SendIvsButton({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  async function sendAll() {
    setSending(true);
    try {
      const res = await fetch("/api/admin/rsvps/send-ivs", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Sending failed.");
        return;
      }
      const parts = [`${data.sent} sent`];
      if (data.failed) parts.push(`${data.failed} failed`);
      if (data.skippedNoEmail) parts.push(`${data.skippedNoEmail} without email`);
      toast.success(`IV delivery: ${parts.join(", ")}.`);
      setOpen(false);
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={pendingCount === 0}>
        <MailCheckIcon aria-hidden />
        Send IV to approved guests
        {pendingCount > 0 && (
          <span className="rounded-full bg-(--gold) px-1.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
            {pendingCount}
          </span>
        )}
      </Button>
      <Dialog open={open} onOpenChange={(o) => !sending && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send invitations?</DialogTitle>
            <DialogDescription>
              This emails the personalized IV to {pendingCount} accepted{" "}
              {pendingCount === 1 ? "guest" : "guests"} who haven&rsquo;t
              received it yet. Guests are never emailed twice.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={sending}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={sendAll} disabled={sending}>
              {sending && <Loader2Icon className="animate-spin" aria-hidden />}
              {sending ? "Sending…" : "Send now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 2: Wire into `app/admin/rsvps/page.tsx`**

Add the import and pass `ivSentAt` through; render the button beside the heading:

```tsx
import type { Metadata } from "next";
import { rsvpsCollection } from "@/lib/collections";
import RsvpsTable, { type RsvpRow } from "./rsvps-table";
import SendIvsButton from "./send-ivs-button";

export const metadata: Metadata = { title: "RSVPs" };
export const dynamic = "force-dynamic";

export default async function RsvpsPage() {
  const col = await rsvpsCollection();
  const docs = await col.find().sort({ createdAt: -1 }).toArray();

  const rows: RsvpRow[] = docs.map((d) => ({
    id: d._id!.toHexString(),
    name: d.name,
    email: d.email,
    phone: d.phone,
    attending: d.attending,
    message: d.message,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
    reviewedBy: d.reviewedBy,
    reviewedAt: d.reviewedAt?.toISOString(),
    ivSentAt: d.ivSentAt?.toISOString(),
  }));

  const pendingIvCount = docs.filter(
    (d) => d.status === "accepted" && !d.ivSentAt && d.email
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-[color:var(--primary)]">
            RSVPs
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and triage guest responses.
          </p>
        </div>
        <SendIvsButton pendingCount={pendingIvCount} />
      </div>
      <RsvpsTable rows={rows} />
    </div>
  );
}
```

- [ ] **Step 3: IV indicators in `app/admin/rsvps/rsvps-table.tsx`**

1. Add `ivSentAt?: string;` to the `RsvpRow` interface (after `reviewedAt?: string;`).
2. Desktop table — in the Status `<TableCell>` (currently just `<StatusBadge status={row.status} />`), render an IV line under the badge:

```tsx
                <TableCell>
                  <StatusBadge status={row.status} />
                  {row.ivSentAt ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      IV sent {formatWhen(row.ivSentAt)}
                    </div>
                  ) : row.status === "accepted" && !row.email ? (
                    <div className="mt-1 text-xs text-amber-600">
                      No email — can&rsquo;t send IV
                    </div>
                  ) : null}
                </TableCell>
```

3. Mobile card list — under the `<StatusBadge>` inside the card header `<div className="mt-1">`, apply the same treatment:

```tsx
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge status={row.status} />
                  {row.ivSentAt ? (
                    <span className="text-xs text-muted-foreground">
                      IV sent
                    </span>
                  ) : row.status === "accepted" && !row.email ? (
                    <span className="text-xs text-amber-600">No email</span>
                  ) : null}
                </div>
```

4. Detail dialog — add a row after the Message `<div>` inside the `<dl>`:

```tsx
                <div>
                  <dt className="text-muted-foreground">IV</dt>
                  <dd>
                    {detail.ivSentAt
                      ? `Sent ${formatWhen(detail.ivSentAt)}`
                      : "Not sent"}
                  </dd>
                </div>
```

- [ ] **Step 4: Verify + commit**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

```bash
git add app/admin/rsvps
git commit -m "Admin: bulk IV send button and per-guest IV indicators"
```

---

### Task 8: End-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Full build**

Run: `npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 2: Public site checks (`npm run dev`)**

1. Itinerary section shows 12:30 pm / 2:00 pm / 3:00 pm / 7:00 pm.
2. No WhatsApp mention anywhere (RSVP + QnA).
3. RSVP form: Confirm button stays disabled until name, valid email, and attendance are set; submitting without email is impossible; a valid submission succeeds.

- [ ] **Step 3: IV flow checks**

1. In the admin, accept the test RSVP just submitted (use a personal email you control): expect the IV email to arrive with both cards, correct name on card 2, working "View your invitation" button and PDF download link.
2. Admin table now shows "IV sent" on that row; accepting it again is impossible (already accepted), and the bulk button count excludes it.
3. Bulk button: with at least one older accepted+unsent RSVP present, click "Send IV to approved guests" → confirm → toast reports sent/failed/skipped counts; rows refresh with "IV sent".
4. Open the emailed `/iv/[token]` link in a private window (no auth) — page renders; a tampered token shows the invalid-invitation card.

- [ ] **Step 4: Report results to the user**

Summarize what was verified, including any email-delivery caveats (e.g. RESEND_FROM domain, NEXT_PUBLIC_SITE_URL must be the production URL for email images to load for guests).
