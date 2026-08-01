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
`src/app/page.tsx`), and publishing from `/admin` refreshes it immediately, so
a new ride is live in seconds without a redeploy.

---

## How the site is put together

```
src/
  app/
    layout.tsx            fonts + metadata
    page.tsx              composes the one page, reads the ride, emits JSON-LD
    globals.css           the design system (type, tokens, card system, motion)
    icon.png              favicon (+ apple-icon.png)
    fonts/                self-hosted Baloo 2 variable woff2 (built, see below)
    api/contact/route.ts  contact form handler
  components/             one file per section
  lib/
    content.ts            ALL copy, verbatim
    ride.ts               Next Ride state machine + Google Sheet reader
    spectrum.ts           the brand palette, with rules
    brandLogo.ts          finds the hero logo in /public/images at build time
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
- **Seven brand colours, and nothing else.** `src/lib/spectrum.ts` is the
  source of truth: purple `#5F13A9` (the main colour), magenta `#BC1184`,
  red `#E01226`, orange `#E18B12`, yellow `#E1C718`, green `#33B754`,
  teal `#359FB5`. No darkened variants, no lifted tints, no one-off hexes.
  If a colour doesn't work somewhere, **pick a different brand colour** — never
  a shade of one. (Neutrals — ink, paper, cream, peach — are structure, not
  accent, and are the only other values in the file.)
- **One foreground rule** — `onBrand(fill)`: white on every brand fill except
  yellow, which takes ink. Applied to stat cards, countdown blocks, Da Plan
  chips, social cards, DO/DON'T headings, everything.
- **Where each colour can be TYPE.** Not every brand colour is readable as
  text on every surface, so the file exports two curated sets and code picks
  from them instead of guessing:
  - `BRAND_ON_LIGHT` (purple, magenta, red, teal) — section heading accents and
    the ticker, on cream/paper. Orange, green and yellow drop to 2.6:1 or worse
    as words on a light surface, so they appear as *fills* there instead.
  - `BRAND_ON_PURPLE` (yellow, green, orange, teal) — the tagline strip. Red and
    magenta sit too close to purple to read against it.
- **The rainbow has an order** — `SPECTRUM` cycles magenta → red → orange →
  yellow → green → teal. Repeated sets index into it by position. The one
  exception is the About stat cards, whose six colours are fixed by the client
  and live in `STAT_FILLS` in `About.tsx`.
- **The menu** is paper by default, brand purple for the active section and
  brand yellow on hover. Its colours travel as custom properties (`--pill-bg` /
  `--pill-fg`) so the `:hover` rule in `globals.css` can win — an inline
  background would beat it.
- **One section rhythm.** Every single-column section uses `.section-head`
  (centred, one measure) and `.section-body` (one gap, `--head-gap`). The
  two-column About section is the deliberate exception and keeps its
  left-aligned editorial column.
- **Motion** respects `prefers-reduced-motion` — the ticker, the gallery
  auto-scroll, the countdown tick, the scroll-in reveals and the hero logo's
  flight into the header all stop.

### The hero logo's flight

`src/components/ScrollLogo.tsx` moves the mark from the hero up into the middle
of the header as you scroll the hero past, shrinking it, then pins it there.

Each frame it interpolates between where the logo *would* be if it just scrolled
with the page and where it should land in the header, so at scroll 0 it sits
exactly on its spacer and the transition is continuous. Only `transform` is
touched per frame. Two details worth knowing:

- The hero section is `isolate`, and a fixed child cannot escape a stacking
  context — the header would always paint over the mark. So on mount the node
  is reparented to `<body>`. It is server-rendered inside the `<h1>` first, so
  it is there for the first paint and stays the LCP element; the `<h1>` keeps a
  visually-hidden "Pedal Party" for its accessible name and the moved image is
  decorative.
- The pinned mark sits mid-header, where the open menu panel and the email
  address both want space. The menu sets `data-menu-open` on `<html>` and the
  mark fades out; below 420px the email collapses to its icon.

### The logo

`src/lib/brandLogo.ts` finds the hero logo in `/public/images` at build time and
Hero.tsx renders it as the `h1`. Two cuts of the mark are in use:

- `logo.png` / `logo.webp` — the **v2** artwork, fully transparent. Used large in
  the hero on a flat creamy-white field (`HERO_BG` in `Hero.tsx`, `#FFF4E6`),
  which is what shows through the spokes and the counters of "PEDAL PARTY" —
  so the lettering reads cream, the way the mark was drawn. No shadow on it;
  the flat backdrop does the work.
- `logo-mark.png` — the **v1** artwork, with the solid interior. Used small, in
  the footer and on the gallery placeholders, where v2's fine spokes and letter
  counters would fill in and muddy.
- `src/app/icon.png` / `apple-icon.png` — favicons, generated from v1 on a
  square transparent canvas so the round mark isn't cropped.

Source artwork is `Pedal Party.png` (v1) and `Pedal Party v2.png` (v2) at the
repo root.

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

**Data source.** One JSON object in Vercel Blob at `ride/current.json`,
written by the console at `/admin`. Shape:

```jsonc
{
  "ride":      { "status": "Schedule", "title": "…", "location": "…", "plan": ["…"] },
  "publishAt": "2026-08-08T17:00:00.000Z",  // or null for "live now"
  "updatedAt": "2026-08-01T14:22:10.114Z",
  "source":    "admin"
}
```

`publishAt` is what "hold until Saturday noon" writes, and it is resolved at
**read** time: until that instant the site shows the Waiting countdown, and
after it the ride appears on its own. Nothing has to wake up at noon, which is
why this project has no scheduled job anywhere in it.

If the store is empty or unreachable the site logs it and renders
`FALLBACK_RIDE` rather than erroring, so a fresh clone with no credentials
still builds and runs.

**Previewing the states.** Two ways, both driven by the same component
(`src/components/RideStates.tsx`), so they can't drift apart:

- `PREVIEW_ALL_STATES` in `src/components/NextRide.tsx` — when `true`, the
  homepage's Next Ride section stacks all five states, labelled, instead of
  showing one. Currently `false`.
- `/preview/next-ride` — the same view on its own noindex page, linked from
  nowhere.

To change what the homepage shows, set the status in `/admin`, or edit
`FALLBACK_RIDE.status` in `src/lib/ride.ts` locally.

## The ride console (`/admin`)

Password-protected (`ADMIN_PASSWORD`). It shows the draft waiting for review
rendered in the real `RideCard` — not a mockup of it — with every field
editable, then two buttons: **Publish now**, or **Hold until Saturday noon
Central**. With no draft the fields start blank and you type the ride in by
hand; there's also a "Load it into the form" link that pulls in whatever is
currently live, for fixing a wrong time without retyping the card.

The console writes through `POST /api/admin/publish`, which is cookie-gated,
so the browser never holds `RIDE_SECRET`.

**This project does not read the volunteer's post.** Turning a freeform
announcement into these fields happens somewhere else entirely — the site
takes finished JSON and nothing more. There is no model call and no
`ANTHROPIC_API_KEY` anywhere in it.

## Posting a ride from outside (`POST /api/ride`)

The way an external automation gets a ride into the site. Gated by
`RIDE_SECRET`; with that unset the route refuses everything.

```jsonc
{
  "secret": "<RIDE_SECRET>",   // or send it as an `x-ride-secret` header
  "draft":  true,              // true = stage for review, false = publish now
  "source": "extractor",       // optional, free text, shows up in the console
  "notes":  "Post gave three times; used 6 pm as gather.",  // optional, drafts only
  "ride": {
    "status":     "Schedule",  // Schedule | Waiting | NoRide | RainedOut | Hibernating
    "title":      "Coffee, Views & Pool Tables",
    "sub":        "An easy 4.5 miles from downtown coffee to the river and back.",
    "location":   "Nexus Coffee Roasters",   // pill 1 — where riders show up
    "gatherTime": "Gather 6:00 PM",          // pill 2 — include the word "Gather"
    "rollTime":   "Roll 6:30 PM",            // pill 3 — include the word "Roll"
    "plan": [
      "Doors open 5:45 at Nexus Coffee Roasters — bring a lock",
      "6:30 roll out from the River Market park rally point",
      "Cruise to Rock City Yacht Club for river views — BYOB",
      "Close out the night at Flying Saucer, basement pool tables"
    ],
    "alert":    "BRING LIGHTS! HELMETS ARE STRONGLY ENCOURAGED!",
    "imageUrl": "https://…/flyer.jpg",       // optional
    "note":     "📝 Taking Labor Day off"    // optional, only renders on NoRide / RainedOut
  }
}
```

`status` is the only required field inside `ride`. Everything else is
optional — omit it, or send `""`, and it simply doesn't render. `plan` takes 3
or 4 lines; keep each under ~75 characters or it wraps badly on a phone.

Staging a draft for review:

```bash
curl -X POST https://pedalpartylr.com/api/ride \
  -H "content-type: application/json" \
  -d '{
    "secret": "'"$RIDE_SECRET"'",
    "draft": true,
    "source": "extractor",
    "ride": {
      "status": "Schedule",
      "title": "Coffee, Views & Pool Tables",
      "location": "Nexus Coffee Roasters",
      "gatherTime": "Gather 6:00 PM",
      "rollTime": "Roll 6:30 PM",
      "plan": ["Doors open 5:45 — bring a lock", "6:30 roll out from River Market park"],
      "alert": "BRING LIGHTS!"
    }
  }'
```

→ `{"ok":true,"draft":true}`. Nothing on the site changed; it's waiting in
`/admin`.

Send the same body with `"draft": false` to skip review and go straight live:

→ `{"ok":true,"draft":false,"published":true}` — written, the cached homepage
dropped, live within seconds.

| Response | Meaning |
| --- | --- |
| `400` | The JSON didn't validate. The body names the offending field. |
| `401` | Wrong or missing secret. |
| `503` | `RIDE_SECRET` or `BLOB_READ_WRITE_TOKEN` isn't set on the server. |

Publishing through this route always goes live immediately — holding until
Saturday noon is a console button, because it's a review decision.

### On-demand revalidation

`POST /api/revalidate` with `REVALIDATE_SECRET` drops the cached ride and
re-renders the homepage immediately. Both write paths already do this, so
this endpoint is only for when you've edited the stored JSON by hand.

### Tests

```bash
npm run test:store   # hold/publish logic and Central-time maths, no credentials needed
```

### The hero backdrop

A Vimeo video plays behind the hero through Vimeo's `background=1` mode:
autoplay, loop, muted, no controls. `dnt=1` asks Vimeo not to set tracking
cookies. The player mounts after first paint so it never competes with the
hero for the first bytes, and under `prefers-reduced-motion` it doesn't load
at all.

The hero was designed cream with dark type, so the video sits behind a cream
veil at 82%. That keeps every contrast decision above it intact: against the
darkest possible video frame, the body type still measures about 9.2:1.

⚠️ **An iframe can't be `object-fit: cover`d**, so the frame is oversized past
the hero on whichever axis needs it — and that maths needs the video's real
shape, which is assumed to be 16:9 in `src/components/HeroVideo.tsx`. If the
backdrop looks squashed or shows bars, correct `aspect` there and nothing else
changes.

A second, portrait cut exists at Vimeo id `1214855728`. It isn't wired up —
one video runs at every size for now. To bring it back, pick between the two
on a `(min-width: 768px)` media query and give each its own aspect.

### The animated mark

`public/lottie/pedal-party.json` — the wheels turn once. It rests on frame 0,
plays through once on hover and settles back, and while the mark flies from
the hero to the header it is scrubbed by that flight, so the turn completes
exactly as it lands. The file holds still after frame 38, so the scrub maps
onto the last keyframe rather than the last frame; it reads that from the file
rather than hard-coding it, so a re-export with different timing still works.

The static PNG renders first and stays until the player and animation arrive,
which keeps 164 KB of player and 153 KB of animation off the critical path —
the hero paints exactly as fast as it did before. Under `prefers-reduced-motion`
none of it loads.

The source export is `Pedal Party.json` at the repo root, 951 KB because After
Effects embeds its bitmaps as base64 PNG. The served copy is the same file
with those re-encoded to WebP: 153 KB, no visible difference. **Re-run that
step when you re-export** — see the ScrollLogo/BrandLottie comments for the
scrub contract.

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

Each is marked with a `⚠️` comment at the exact place in the code.

**Social icons.** The three PNGs uploaded to the repo root (`Facebook Icon.png`,
`Instagram Icon.png`, `Mail Icon.png`) are 36x36 and completely empty — zero
opaque pixels, and all three are byte-identical, so the export produced blank
files. The site still uses the drawn SVG icons in `src/components/Icons.tsx`.
Re-export and they can be swapped in.

| # | Item | Where |
| - | ---- | ----- |
| 1 | **Hero photo.** The handoff never contained one — every `arvib8iyzXyv1UL2qgkJNxQDwhU*.jpg` in the export, including the file labelled `hero-riverfront.jpg`, is Framer's stock placeholder of a kitchen. The hero is currently the logo on a flat field, which may well be the final answer. If a real photo does arrive, set `HERO_PHOTO` and it takes over with a duotone wash and scrim. | `src/components/HeroBackdrop.tsx` |
| 2 | **Form success/error microcopy is a placeholder.** Travelle to write the real strings. | `src/lib/content.ts` → `contact.successPlaceholder` / `errorPlaceholder` |
| 3 | **Gallery photos.** Final photos come from @pedalpartylr; the strip renders placeholder tiles until then. | `src/components/Gallery.tsx` → `GALLERY_PHOTOS` |
| 4 | **Form endpoint** needs configuring (Resend key or webhook URL). | `.env.example` |
| 5 | **Stat-card contrast.** The six stat cards use client-specified fills with white text. White on orange, green and teal lands at 2.7:1, 2.6:1 and 3.1:1 — below the 4.5:1 AA floor for the small uppercase labels. Shipped as specified; flagged so the choice is a known one. | `src/components/About.tsx` → `STAT_FILLS` |
| 6 | **OG image** (`public/images/og.png`) is a screenshot of the current hero. Regenerate it if the hero changes — 1200x630 with the header and buttons hidden. | `src/app/layout.tsx` |
| 7 | **Stat vs. prose mismatch** (carried over from the live site, not introduced here): the About copy says "a record 185 at our 100th" while the stat badge says `15 → 246`. Both are verbatim from the handoff — worth deciding which number is current. | `src/lib/content.ts` |
