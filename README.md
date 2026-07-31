# Pedal Party

The Pedal Party website — Little Rock's Monday social ride. Single page with
anchor navigation, built from the Framer design handoff.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
deployed on Vercel.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

No environment variables are required to run locally — the site falls back to
the example ride content and works offline. Copy `.env.example` to `.env.local`
when you want to wire up the real data.

## Deploying to Vercel

1. Import the repo at [vercel.com/new](https://vercel.com/new). Vercel detects
   Next.js; no build settings to change.
2. Add the environment variables you need (see `.env.example`) under
   **Settings → Environment Variables**.
3. Add the domain under **Settings → Domains**.

The homepage revalidates every 5 minutes (`export const revalidate = 300` in
`src/app/page.tsx`), so a change in the ride sheet reaches the live site within
5 minutes without a redeploy.

---

## How the site is put together

```
src/
  app/
    layout.tsx            fonts + metadata
    page.tsx              composes the one page, reads the ride, emits JSON-LD
    globals.css           the design system (type, tokens, card system, motion)
    icon.svg              favicon
    fonts/                self-hosted Baloo 2 variable woff2 (built, see below)
    api/contact/route.ts  contact form handler
  components/             one file per section
  lib/
    content.ts            ALL copy, verbatim
    ride.ts               Next Ride state machine + Google Sheet reader
    spectrum.ts           the rainbow, with rules
    time.ts               Central-time helpers
Baloo_2/                  official Google Fonts release — OFL licence + source TTF
```

### The design system

Everything visual comes from tokens in `src/app/globals.css`:

- **One typeface.** Baloo 2 is the only family on the site — display *and*
  body. Hierarchy is carried entirely by weight: 500 body, 700 subheads and
  emphasis, 800 display. Never introduce a second face; reach for a weight.
  Because Baloo 2 sets small for its point size, the body scale runs a step
  larger than a neutral sans would (`--text-body: 17px`).
- **One card treatment** — `.card` / `.card-sm` (3px ink border, 22px radius,
  hard 6px offset shadow). `.sticker` adds rotation. Nothing defines its own
  border/shadow/radius.
- **Two buttons only** — `.btn-primary` (purple fill) and `.btn-secondary`
  (white fill). Both pill, both hard-shadowed, both press into their shadow.
- **The rainbow has rules** — `src/lib/spectrum.ts` holds one sequence
  (magenta → red → orange → yellow → green → teal). Every repeated set —
  countdown blocks, stat badges, ticker words, Da Plan steps, social cards —
  indexes into it by position. Never hand-pick a colour.
- **Contrast is built into the palette.** Each swatch carries `fill` (the
  bright brand value), `on` (a foreground that clears 4.5:1 against that fill)
  and `text` (a darkened variant for when the accent is itself type on a light
  background). Yellow never carries text without an ink foreground.
- **One section rhythm.** Every single-column section uses `.section-head`
  (centred, one measure) and `.section-body` (one gap, `--head-gap`). The
  two-column About section is the deliberate exception and keeps its
  left-aligned editorial column.
- **Motion** respects `prefers-reduced-motion` — the ticker, the gallery
  auto-scroll, the countdown tick and every scroll-in reveal all stop.

### Rebuilding the font

`src/app/fonts/baloo2-variable.woff2` is generated from the official release in
`Baloo_2/` — subset to latin + latin-ext plus the punctuation and arrows the
copy uses. One ~50 KB file covers every weight 400–800, and there is no Google
Fonts request at build or runtime.

To regenerate after replacing the source TTF:

```bash
pip install fonttools brotli zopfli
pyftsubset Baloo_2/Baloo2-VariableFont_wght.ttf \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF" \
  --layout-features=kern,liga,clig,calt,ccmp,locl,mark,mkmk \
  --flavor=woff2 --with-zopfli --name-IDs='*' --name-legacy --notdef-outline \
  --output-file=src/app/fonts/baloo2-variable.woff2
```

Note Baloo 2 has no ★ (U+2605), so the ticker draws its star as an SVG rather
than letting the character fall back to a system face.

### The Next Ride state machine

One `Status` value picks exactly one card (`src/lib/ride.ts`):

| Status        | Renders                                             |
| ------------- | --------------------------------------------------- |
| `Schedule`    | Ride detail card — flyer, chips, Da Plan, alert      |
| `Waiting`     | Countdown to the Saturday-noon drop                  |
| `NoRide`      | "No ride this week" + note pill + countdown          |
| `RainedOut`   | "Rained out!" + note pill + countdown                |
| `Hibernating` | Off-season, countdown targets the season opener      |

Countdown targets are computed in Central time, so "Saturday at noon" means
noon in Little Rock no matter where the visitor is.

**Data source.** Set `RIDE_SHEET_CSV_URL` to the published-CSV URL of the
Google Sheet the existing Cowork automation already writes to. The site only
reads it — the automation is untouched. Expected columns:

```
Ride Date | Theme/Title | Sub Text | Starting Location | Gathering Time |
Start Rolling | Plan 1 | Plan 2 | Plan 3 | Plan 4 | Alert | Status |
Next Ride | Image URL
```

The last non-empty row wins. If the fetch fails for any reason the site logs it
and renders the fallback ride rather than erroring.

To preview a state locally, edit `FALLBACK_RIDE.status` in `src/lib/ride.ts`.

### The contact form

`POST /api/contact` validates the payload, drops honeypot submissions, then
delivers via **Resend** (`RESEND_API_KEY`) or a **webhook**
(`CONTACT_WEBHOOK_URL`), whichever is configured. With neither set it answers
`503` and the form shows an error with a `mailto:` fallback — an unconfigured
deploy fails loudly instead of silently eating messages.

### Copy

All copy lives in `src/lib/content.ts`, verbatim from the handoff. Change text
there, never in a component.

---

## ⚠️ Open items before launch

These are the handoff's §8 items plus one found during the build. Each is
marked with a `⚠️` comment at the exact place in the code.

| # | Item | Where |
| - | ---- | ----- |
| 1 | **FAQ answers are placeholders.** The Framer export only captured the closed accordion, so all 8 answers need pasting in verbatim from the Framer CMS. Questions are correct. | `src/lib/content.ts` → `faq.items[].a` |
| 2 | **Hero photo is missing from the handoff.** Every `arvib8iyzXyv1UL2qgkJNxQDwhU*.jpg` in the export — including the file labelled `hero-riverfront.jpg` — is Framer's stock placeholder of a kitchen, not the riverfront. The hero currently renders a poster-style illustration instead. | `src/components/HeroBackdrop.tsx` → set `HERO_PHOTO` |
| 3 | **Form success/error microcopy is a placeholder.** Travelle to write the real strings. | `src/lib/content.ts` → `contact.successPlaceholder` / `errorPlaceholder` |
| 4 | **Gallery photos.** Final photos come from @pedalpartylr; the strip renders placeholder tiles until then. | `src/components/Gallery.tsx` → `GALLERY_PHOTOS` |
| 5 | **Form endpoint** needs configuring (Resend key or webhook URL). | `.env.example` |
| 6 | **Brand logo.** The file labelled `logo.png` in the handoff is the washi-tape texture; the watercolour rainbow mark was not included. The footer/favicon use a drawn placeholder wheel. | `src/components/Icons.tsx` → `LogoMark`, `src/app/icon.svg` |
| 7 | **OG image** (`public/images/og.png`) was rendered from the placeholder hero. Regenerate it once the real hero photo lands. | `src/app/layout.tsx` |
| 8 | **Stat vs. prose mismatch** (carried over from the live site, not introduced here): the About copy says "a record 185 at our 100th" while the stat badge says `15 → 246`. Both are verbatim from the handoff — worth deciding which number is current. | `src/lib/content.ts` |
