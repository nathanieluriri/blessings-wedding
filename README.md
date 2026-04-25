# Blessing & Justice — A Wedding Invitation

> A small handmade gift, with a lot of love behind it.

This is the wedding invitation site for **Blessing & Justice** — `#OfoDiMma` — taking place on **19 December 2026** at **Acropolis Park, Apo**.

## Why this project exists

Blessing is the elder sister of one of my dearest friends. When I heard about the wedding, I wanted to give something — but I'm not a florist, not a photographer, not a chef. What I *can* do is build things on the web. So that became the gift: a corner of the internet, made with care, just for her and Justice.

I'm thankful to God for the hands and the time and the small pile of skills that made this possible. It's a quiet way of saying: *I'm so happy for you. May this season be everything you've prayed for, and more.*

If you're a guest who landed here from the invitation — welcome. The site holds the day's itinerary, the venue, the dress code, the story behind the hashtag, and a little space to RSVP. Take your time with it. You are loved, and your presence matters.

## What's inside

A single-page experience, built section by section to feel like opening an invitation card:

- **Curtain & opening sequence** — a gentle reveal as the page loads.
- **Countdown** — counting down to 19 December 2026.
- **Scratch reveal** — a small interactive moment.
- **Itinerary** — *We Do · We Drink · We Eat · We Party*.
- **Location** — Acropolis Park, Apo.
- **Dress code** — A Celebration of Colour, with the rainbow palette.
- **The hashtag story** — `#OfoDiMma`, weaving *Ofokansi* and *Mmayen* together. In Igbo, *Ọ dị mma* means *"It is good."*
- **RSVP**.
- **Thank-you note**.

## Built with

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- TypeScript
- Lenis for smooth scrolling
- Dynamic Open Graph images via `next/og`
- JSON-LD `Event` schema for search engines and AI assistants
- A custom `llms.txt` so AI tools can describe the day kindly and accurately

## Running it locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Configuration

The site URL defaults to `https://ofodimma.com`. To override it for previews or other environments, set:

```
NEXT_PUBLIC_SITE_URL=https://your-preview-url.example
```

This value is used by the metadata, sitemap, robots, and JSON-LD.

## Project structure

```
app/
  layout.tsx              # metadata, fonts, JSON-LD
  page.tsx                # the invitation page (composed of sections)
  globals.css             # palette + animations
  opengraph-image.tsx     # dynamic OG/Twitter card
  twitter-image.tsx
  robots.ts               # search + AI crawler rules
  sitemap.ts
  manifest.ts
  favicon.ico
  components/
    CurtainScroll.tsx
    OpeningSequence.tsx
    SmoothScroll.tsx
    sections/
      Countdown.tsx
      ScratchReveal.tsx
      Itinerary.tsx
      Location.tsx
      DressCode.tsx
      Hashtag.tsx
      RSVP.tsx
      ThankYou.tsx
content/                  # source assets (videos, hero imagery)
public/
  curtain_frames/         # frame sequences for the opening animation
  opening_frames/
  llms.txt                # AI-friendly summary of the event
```

## A note on the colour palette

The dress code is *A Celebration of Colour* — a curated rainbow. The site itself is intentionally quieter: cream, deep burgundy, and gold. The idea is that the page is the envelope, and the guests are the colour inside it.

## With love

To **Blessing** and **Justice** — congratulations. May your home be full of laughter, your table always set for one more, and your story go on for many, many years. `#OfoDiMma` — *it is good.* 🤍

To anyone reading this who isn't a guest: thanks for stopping by. Be kind to someone today.
