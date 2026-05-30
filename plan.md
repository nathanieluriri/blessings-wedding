# Plan — Blessing & Justice (#OfoDiMma) site revisions

## Context
Next.js 16.2.4 + React 19 + Tailwind v4 + framer-motion + lenis. Single-page scroll
experience in `app/page.tsx` composed of section components under
`app/components/sections/`. Two canvas-driven sequences drive the open:
- `CurtainScroll.tsx` — 300 "curtain" frames tied to scroll, holds the hero "cordially
  invited" text.
- `OpeningSequence.tsx` — full-screen overlay, 240 frames @ 30fps (~8s), the animated
  "OfoDiMma" name reveal, dismissed on first scroll.

> **Before writing any code**, read the relevant guides in `node_modules/next/dist/docs/`
> per `AGENTS.md` — this Next version may differ from training data.

This plan covers the 6 PDF items, the hashtag text alignment, and the 6 text-note
changes. Several items are **blocked on assets/decisions** (see end); we build the
structure now and slot assets/copy in when received.

---

## 1. Hero rework (PDF #1 + "needs oomph")
**Goal:** Drop the curtain. New flow = monogram "clack" → pop-up images → "You are
cordially invited" landing. Speed the name animation to ~3s.

**Approach**
- Delete `CurtainScroll` from `page.tsx`. Retire `CurtainScroll.tsx` and (eventually)
  `/public/curtain_frames` once nothing references them.
- Create `app/components/Hero.tsx` (client):
  - Stage 1 — monogram entrance with a sharp "clack" (quick scale-in + settle, optional
    subtle shake; honor `prefers-reduced-motion`). Asset: monogram SVG/PNG in `/public`.
  - Stage 2 — brief sequence of pop-up images (couple-supplied) using
    `framer-motion` `AnimatePresence` timed crossfades.
  - Stage 3 — the existing "You are cordially invited… Blessing & Justice" card (lift the
    markup out of `CurtainScroll.tsx` lines ~205–236 so the typography is preserved).
- Repurpose `OpeningSequence.tsx`: keep the frame-player but retime the name reveal so 240
  frames play over **3000ms** (e.g. compute interval as `3000 / FRAME_COUNT` instead of
  the fixed 30fps), then hand off to the hero/invitation. Confirm `opening_frames` is the
  "OfoDiMma" name animation before retiming.

**Decision:** Confirm whether the monogram "clack" and the `opening_frames` name reveal
are the same beat or two separate beats. Likely: monogram clack first, name reveal (3s),
pop-ups, invitation.

**Blocked on:** monogram asset, pop-up images.

## 2. Scratch reveal (text note) — `sections/ScratchReveal.tsx`
- **Faster reveal:** lower `REVEAL_THRESHOLD` (0.5 → ~0.18) and shorten
  `SAMPLE_INTERVAL_MS` so 1–2 strokes trip the reveal; optionally fully clear the card on
  reveal. Consider widening the erase `lineWidth` (36) so each stroke clears more.
- **Heart confetti:** replace the rectangular `.confetti-piece` (globals.css) with a heart
  shape — CSS heart (two pseudo-elements / clip-path) or an inline SVG heart per piece.
  Keep the existing `CONFETTI_COLORS` + fall animation variables.
- **Remove** the "Save the date · Acropolis Park, Apo" block (lines ~466–469).

## 3. Itinerary (text note + screenshot) — `sections/Itinerary.tsx`
- New layout: **We Do (left), We Drink (right), We Eat (below)**, centered.
- Swap the round badge (`rounded-full` div, ~line 84) for a **heart-shaped** badge
  (CSS heart container or heart SVG mask) holding each icon.
- **Decision:** keep `We Party` (currently 4th item) or trim to the three named in the
  note. Default: keep it but place below, unless told otherwise.

## 4. Location / Venue (PDF #2 + #3) — `sections/Location.tsx`
- Rewrite copy as a **riddle** leading into the approved venue text; end with
  "The rest of the story unlocks with your RSVP."
- Replace `VenueIllustration` SVG with a **Greek-temple / Acropolis** line-art (columns,
  pediment, landscape) matching the PDF and the "Acropolis Park" name.
- Add an **"RSVP HERE"** button → `#rsvp` (or the RSVP page) styled like the existing
  "Open in Maps" pill.

## 5. Dress code (PDF #4) — `sections/DressCode.tsx`
- Replace intro/outro copy with approved text ("celebration of love in full colour…
  living rainbow"). Keep the colour-family swatch grid (still on-brief).
- Add an **"Inspiration"** button → Pinterest board (external, `target="_blank"`).
- **Blocked on:** Pinterest URL (use a `TODO` placeholder href until supplied).

## 6. Hashtag (PDF) — `sections/Hashtag.tsx`
- Align body copy to the PDF exactly: blends Justice's surname **Ofokansi** + Blessing's
  middle name **Mmayen**; "Ọ dị mma" = "it is good"; "more than a hashtag… our journey,
  our love, our roots." Keep the `#OfoDiMma` glow treatment.

## 7. Gift Registry — NEW `sections/Registry.tsx` (PDF #5)
- Approved copy: presence = greatest gift; monetary contribution welcomed; thank-you line.
- **"View bank details"** button toggling a reveal panel (framer-motion height/opacity):
  - Name: Ofokansi Justice and Iwok Blessing
  - Acct Number: 2040717188 (consider a copy-to-clipboard affordance)
  - Bank: First Bank
- Match `SectionShell` styling. Place after RSVP.

## 8. RSVP email (PDF #5/#6) — `sections/RSVP.tsx`
- Surface **theofokansis@gmail.com** (e.g. "Prefer email? RSVP to …" `mailto:` link).
- **Decision:** the form currently submits nowhere (`setSubmitted(true)` only). Confirm:
  keep as decorative + email fallback, or wire to a real endpoint? Also reconcile the
  in-form deadline ("30 November 2026") with the Q&A deadline.

## 9. Q&A — NEW `sections/QnA.tsx` (text note)
- "Got a question?" header; accordion or simple stacked Q/A like the reference screenshot:
  1. When is the RSVP deadline?
  2. Can I bring a plus one?
  3. Whom should I call with questions?
- **Blocked on:** confirmed deadline, plus-one policy, contact name + phone.
- Place near the end (before Countdown/ThankYou).

## 10. Countdown (text note) — `sections/Countdown.tsx`
- Remove the **"The celebration will take place at / Acropolis Park, Apo / 19 December
  2026 · 2:30 pm"** block (lines ~104–112) — keep only the timer + "until we say I do".
- **Move to the bottom** of the page (just above ThankYou) via `page.tsx` reorder.

## 11. Final wiring — `app/page.tsx`
Proposed new order:
```
Hero (monogram → pop-ups → invitation)   // replaces CurtainScroll
ScratchReveal
Itinerary
Location
DressCode
Hashtag
RSVP
Registry            // NEW
QnA                 // NEW
Countdown           // moved down
ThankYou
```
Remove `CurtainScroll` import; remove/keep `OpeningSequence` per Hero decision.

---

## Assets & decisions needed before/while building
| Item | Needed for | Type |
|------|-----------|------|
| Monogram file | Hero | asset (blocking) |
| Pop-up images | Hero | asset (blocking) |
| Pinterest board URL | Dress code | link (blocking) |
| RSVP deadline (31 Oct? 30 Nov?) | Q&A + RSVP | copy decision |
| Plus-one policy | Q&A | copy |
| Contact name + phone | Q&A | copy |
| Keep "We Party"? | Itinerary | decision |
| Form vs email-only RSVP; RSVP link target | RSVP/Location | decision |

## Suggested build order
1. Non-blocked content/layout: Hashtag, Dress code copy, Location riddle + temple art,
   Countdown trim, Scratch reveal (speed + heart confetti + remove line), Itinerary
   layout, Registry, Q&A scaffold, `page.tsx` reorder.
2. Blocked items as assets/answers arrive: Hero monogram + pop-ups + 3s name retime,
   Pinterest link, Q&A copy.
3. Verify: `npm run dev`, check each section on mobile + desktop, run `npm run lint`.
