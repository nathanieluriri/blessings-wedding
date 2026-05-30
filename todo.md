# TODO — Blessing & Justice (#OfoDiMma) site revisions

Source: `WEBSITE TEXTS.pdf` + follow-up text notes + reference screenshots.
Status legend: [ ] todo · [~] in progress · [x] done · [!] blocked (needs asset/decision)

---

## A. Hero / Landing page (PDF #1 + text "Hero needs oomph")
- [ ] Remove the curtain scroll effect entirely (`CurtainScroll.tsx` + `/public/curtain_frames`).
- [ ] Rebuild hero around the **wedding monogram** (the "DM / OFODIMMA" mark) with a "clack it" reveal.
- [ ] After the monogram: sequence of **pop-up images**, then land on the **"You are cordially invited…"** card.
- [ ] Speed up the **"OfoDiMma" name animation to ~3 seconds** (currently `OpeningSequence` 240 frames @ 30fps ≈ 8s).
- [!] BLOCKED: need the **monogram asset** (SVG/PNG) and the **pop-up images** from the couple.

## B. Scratch-to-reveal date (text note)
- [ ] Make scratching **faster** — 1–2 scratches should reveal a card (lower threshold / reveal-on-first-strokes).
- [ ] Confetti pieces should be **heart-shaped** (currently rectangles).
- [ ] Remove **"Save the date · Acropolis Park, Apo"** line from this section.

## C. Itinerary (text note + screenshot)
- [ ] Layout: **We Do (left)**, **We Drink (right)**, **We Eat (below)**.
- [ ] Make the icon badges **heart-shaped** (currently round circles).
- [!] DECISION: keep or drop **"We Party"** (4th item) — note only lists 3.

## D. Location / Venue (PDF #2 + #3)
- [ ] Reword to a **riddle** for the location instead of stating it plainly.
- [ ] Use the approved venue copy: "open-air park in the heart of Apo… Think gardens. Think romance. Think an evening beneath the stars. The rest of the story unlocks with your RSVP."
- [ ] Replace the pavilion SVG with a **Greek-temple / Acropolis line-art illustration** (matches the PDF + "Acropolis Park").
- [ ] Add **"RSVP HERE"** button linking to the RSVP section/page.

## E. Dress code (PDF #4)
- [ ] Replace copy with approved text (bold/beautiful/joyful "living rainbow" wording).
- [ ] Add **"Inspiration"** button → Pinterest board.
- [!] BLOCKED: need the **Pinterest board URL**.

## F. Hashtag (PDF #4 page)
- [ ] Update copy to match PDF exactly (Ofokansi + Mmayen, "Ọ dị mma" = "it is good", journey/love/roots wording).

## G. Gift Registry — NEW section (PDF #5)
- [ ] Add a Registry section with the approved "your presence is the greatest gift / monetary contribution" copy.
- [ ] Add **"View bank details"** button that reveals:
  - Name: **Ofokansi Justice and Iwok Blessing**
  - Acct Number: **2040717188**
  - Bank: **First Bank**

## H. RSVP email (PDF #5/#6)
- [ ] Surface RSVP email **theofokansis@gmail.com** in the RSVP section.
- [!] DECISION: keep the interactive form, or make RSVP email-based only? (Form currently doesn't submit anywhere.)

## I. Q&A — NEW section at the end (text note)
- [ ] Add a "Got a question?" section with:
  1. **When is the RSVP deadline?**
  2. **Can I bring a plus one?**
  3. **Whom should I call with questions?**
- [!] BLOCKED: need confirmed **RSVP deadline** (reference shows 31 Oct; current RSVP copy says 30 Nov 2026), **plus-one policy**, and a **contact name + phone number**.

## J. Countdown (text note)
- [ ] Remove the **date** and **location** lines from the countdown.
- [ ] Move the countdown to the **bottom** of the page (just above Thank You).

## K. Wiring / order
- [ ] Reorder `page.tsx` sections per plan; remove curtain; insert Registry + Q&A; relocate Countdown.

---

## Open questions to confirm with the couple
- [ ] Monogram file + pop-up images (Hero).
- [ ] Pinterest board URL (Dress code).
- [ ] RSVP deadline date (Q&A vs current 30 Nov 2026).
- [ ] Plus-one policy wording (Q&A).
- [ ] Contact name + phone for questions (Q&A).
- [ ] Keep "We Party" itinerary item? (Itinerary).
- [ ] RSVP: keep form or go email-only? Where should "RSVP HERE" link?
