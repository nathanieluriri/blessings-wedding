# Design: Itinerary update, required email, and IV invitation emails

Date: 2026-07-24
Status: Shipped.
Updated 2026-09-02 (commit `352b7be`): the IV card art was replaced with the
designer's v2 set. Sections 1 and 2 are unchanged; the asset and
personalization details in section 3 describe v2.

## Scope

Three updates to the wedding site:

1. Update the itinerary times.
2. Remove the WhatsApp contact path; make the guest email address required on RSVP.
3. Send every approved guest a personalized invitation ("IV") email containing
   the two-page wedding card, with a link to view and download it on the site.

## 1. Itinerary times

[app/components/sections/Itinerary.tsx](../../../app/components/sections/Itinerary.tsx)
lines 94–97 change to:

| Stop     | New time |
| -------- | -------- |
| We Do    | 12:30 pm |
| We Drink | 2:00 pm  |
| We Eat   | 3:00 pm  |
| We Party | 7:00 pm  |

No layout, animation, or copy changes beyond the times.

## 2. RSVP form — drop WhatsApp, require email

- Remove the "Prefer WhatsApp? RSVP via …" paragraph from
  `app/components/sections/RSVP.tsx` and the WhatsApp mention/link in
  `app/components/sections/QnA.tsx`. Delete the now-unused
  `app/components/WhatsAppLink.tsx`.
- Email becomes required:
  - Label changes from "Email (optional)" to "Email *"; input gets `required`.
  - `canSubmit` additionally requires a plausibly valid email
    (same regex as the API).
  - `POST /api/rsvp` rejects a missing or invalid email with a friendly error.
  - `RsvpDoc.email` stays typed `string | undefined` (legacy rows lack it), but
    all new inserts always carry an email.
- Phone stays optional and unchanged.

## 3. IV invitation emails

### Assets (source of truth: `IV/` folder)

- `IV/Wedding card v2-01.svg` — page 1, the main invitation. Static, identical
  for all guests.
- `IV/Wedding card v2-02-template.svg` — page 2, the access card. Contains
  `<text id="guest-name">` (centered via `text-anchor="middle"` at the card's
  midline); its tspan content is replaced with the guest's name.
- `IV/Wedding card v2-02.svg` — the untouched designer export, kept for
  re-cutting the template. **It carries no name placeholder:** "NAME OF GUEST"
  ships as outlined vector paths — the second child `<g>` of `<g id="Text">`.
  The template above is this file with that group deleted, a live
  `<text id="guest-name">` node in its place, and a `.cls-guest-name` rule added
  to the `<style>` block. Keeping the export beside the template makes
  re-cutting from a future export a small diff.
- `IV/SaolDisplay-Regular/SaolDisplay-Regular.ttf` — font used for the guest
  name; loaded by the SVG→PNG renderer.
- The `IV/` directory ships with the server bundle (Next
  `outputFileTracingIncludes` if file tracing would otherwise drop it).

### Re-cutting the page-2 template from a new designer export

The name's placement is measured, not eyeballed:

1. Render the export twice — once as-is, once with the outlined name group
   removed — and pixel-diff the two to get the placeholder's exact ink box.
2. Calibrate a live `<text>` node in Saol Display until its ink box matches. For
   v2 the answer is `font-size:10px`, `text-anchor="middle"`,
   `transform="translate(225.19 218)"`, fill `#1d427f` — at that size the live
   text reproduces the designer's ink box exactly (same centre, same x-extent).

resvg **drops** text whose `font-family` it cannot match, and
`defaultFontFamily` does not rescue it — so the guest-name node must name
`SaolDisplay-Regular` explicitly. Both v2 cards also carry `MuseoSans-100`
live-text layers that render as nothing for this reason; harmless, because those
strings are outlined as well.

### Personalization

`lib/iv/render.ts`:

- `personalizeAccessCard(name)` — reads `Wedding card v2-02-template.svg`,
  XML-escapes the name, and replaces the `#guest-name` tspan text. Names longer
  than ~24 characters get a proportionally smaller `font-size` so they never
  overflow the card; because `.cls-guest-name` sets the size via the SVG's
  `<style>` block and CSS beats presentation attributes, that override has to be
  an inline `style`. An empty name falls back to "Honoured Guest".
- `renderCardPng(svg, { scale })` — `@resvg/resvg-js` with the Saol Display
  TTF registered; renders at ~3× the 450×324 viewBox for crisp email/download
  output.
- `renderIvPdf(name)` — renders both pages to PNG and embeds them as two
  landscape pages in a PDF via `pdf-lib`.

New dependencies: `@resvg/resvg-js`, `pdf-lib`.

### Data model

`RsvpDoc` gains:

- `ivToken?: string` — unguessable (crypto-random, 32+ hex chars), generated
  the first time an IV is needed for the row; unique index.
- `ivSentAt?: Date` — set on successful send; absence means "not yet sent".

### Public routes (token-keyed, no auth)

- `GET /iv/[token]` — the invitation page. Elegant, site-branded (cream /
  burgundy, serif) page showing page 1 and the personalized access card, the
  guest's name, and download buttons: **Download PDF**, Download page PNGs.
  Unknown token → soft 404 ("This invitation link isn't valid").
- `GET /api/iv/[token]/1.png` — page 1 PNG (static render).
- `GET /api/iv/[token]/2.png` — personalized access-card PNG.
- `GET /api/iv/[token]/pdf` — two-page personalized PDF
  (`Content-Disposition: attachment`).
- PNG/PDF responses set long-lived private cache headers; token lookup failure
  → 404.

### Email

`lib/email/templates.ts` gains an IV template matching the site's look:

- Subject: "You're invited — Blessing &amp; Justice's Wedding".
- Body: "Dear {first name}", short invite line, page-1 image, personalized
  access-card image (both `<img>` tags pointing at the live PNG endpoints),
  a prominent **View your invitation** button → `/iv/[token]`, and a
  "Download your copy" link → the PDF endpoint. Plain-text alternative
  included.
- Sent through the existing `sendEmail()` (Resend) helper; requires the site's
  public base URL from `lib/site-url.ts`.

`lib/iv/send.ts` — `sendIvEmail(rsvp)`: ensures `ivToken`, sends, sets
`ivSentAt` on success. Returns `{ ok, error? }`; never throws.

### Triggers

1. **Auto on approval** — in `PATCH /api/admin/rsvps/[id]`, when the status
   transitions to `accepted` and the row has an email and no `ivSentAt`, the
   IV email is sent via `after()` (never blocks or fails the status change).
2. **Bulk backlog button** — new `POST /api/admin/rsvps/send-ivs` sends to all
   rows with `status: "accepted"`, an email, and no `ivSentAt` (sequentially,
   respecting Resend's 2 req/s rate limit). Returns
   `{ sent, skippedNoEmail, failed }`. The admin RSVPs page gets a
   **"Send IV to approved guests"** button with a confirm step and a result
   toast.
3. **Visibility** — each row in the admin RSVPs table shows an "IV sent"
   indicator (with date) and flags accepted guests who have no email address.

Re-sending: the bulk endpoint only targets unsent rows; auto-send checks
`ivSentAt`, so guests never receive duplicates. (Per-guest manual resend is
out of scope; can be added later.)

### Error handling

- Email send failures leave `ivSentAt` unset so the guest remains in the
  bulk-send pool; failures are logged and counted in the bulk result.
- Rendering failures return 500 from the PNG/PDF endpoints and are logged;
  the email still delivers (images load lazily from the endpoints).

## Testing

- `npm run build` + lint must pass.
- Manual verification: render endpoints for a sample token (short and long
  names), IV page in browser, PDF download opens with both pages, bulk send
  against a test RSVP with a personal email, auto-send on accepting a test
  RSVP, RSVP form rejects missing email, itinerary shows new times.
