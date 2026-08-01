# Pedal Party — rethinking the weekly ride pipeline

A briefing for a fresh design conversation. Everything needed to reason about
the problem is in here; no need to read the repo.

---

## 1. What this is

Pedal Party is a nonprofit social bike ride in Little Rock, Arkansas. It runs
Monday evenings. The website (Next.js on Vercel) has a **Next Ride card** as
its centerpiece — the one thing that has to be correct and current every week.

Once a week, a volunteer ("the friend") writes a hype post announcing that
week's ride. He posts it to Instagram and emails it out. **The website's card
has to reflect that ride, every week, without anyone doing data entry.**

## 2. The constraint that drives everything

> The friend wants this to be frictionless. He does not want to spend time
> writing copy for the website.

He writes one thing, in his own voice, the way he already writes it. Anything
that asks him to also fill in a form, use labelled fields, follow a template,
or check a box is a design failure. He will stop doing it, and the site will go
stale.

This is the requirement the current build gets wrong.

## 3. What the card needs

The site renders one of five states off a `status` field. Only one of them
carries real content:

| Status | Meaning |
| --- | --- |
| `Schedule` | **The ride-detail card.** The rich one. Everything below. |
| `Waiting` | No ride posted yet — countdown to Saturday noon. |
| `NoRide` | No ride this week. |
| `RainedOut` | Cancelled for weather. |
| `Hibernating` | Off-season, counting down to the season opener. |

The `Schedule` card's shape:

```ts
type Ride = {
  status: "Schedule";
  title?: string;      // the ride's name / theme — the headline
  sub?: string;        // one line of flavor under the title
  location?: string;   // PILL 1 — 📍 where you show up
  gatherTime?: string; // PILL 2 — 🕕 when people arrive
  rollTime?: string;   // PILL 3 — 🚲 when the group rolls out
  plan?: string[];     // 3–4 short steps, the night in order
  alert?: string;      // safety callout, e.g. "BRING LIGHTS!"
  imageUrl?: string;   // the flyer image
  countdownTarget: string; // ISO timestamp
};
```

**The three pills are non-negotiable and always visible: starting point,
arrival time, roll-out time.** That was an explicit product decision. If any
of the three can't be determined, the current design refuses to publish rather
than show a half-empty card.

## 4. What was built, and why it's the wrong shape

```
friend's email → Gmail → Google Apps Script (regex parser)
                                → Google Drive (image)
                                → Google Sheet (one row per ride)
                                → POST /api/revalidate
                                → Next.js reads the Sheet as published CSV
```

It works, mechanically. Every piece is tested and deployed. But:

1. **The parser is hand-written regex.** It was designed around labelled input
   (`Start: Camp Taco`, `Roll: 6:30 PM`) with a prose fallback. Real prose
   defeats it — see §5.
2. **Google Sheets is a CMS nobody wanted.** It exists only as a place to put
   parsed data. It adds a published-CSV URL, an env var, a tab name, a column
   order that must match the site's expectations, and a whole second system to
   debug. It is not where the data naturally lives.
3. **Four systems to reason about** (Gmail, Apps Script, Drive, Sheets) before
   any of it reaches Vercel. Every failure means checking which of the four
   broke. The setup involves an OAuth consent screen, script properties, time
   triggers, and a published-to-web CSV.
4. **The failure mode is silence.** If the parse comes up short the card just
   doesn't update and an email goes to an inbox someone has to be watching.

The instinct now: **put Claude in the parsing seat, and cut the Google layer
out.** Claude reads the friend's post the way a person would, produces the
card, and hands it to the site.

## 5. The real email, and what the parser actually did with it

This is genuine, from the friend. It is representative — this is how he writes.

```
Hey friends!! Ready for another fun ride?

Da plan:

- Join us @nexuscoffeeroasters ! Doors open at 5:45 pm. Official start is 6 pm.
  Bring a bike lock. They're opening up just for us, so let's show them some luv!

- You're welcome to grab an entertainment district band and join us at the rally
  point in River Market park. Map attached. Around 6:30 pm we will roll out from
  this location.

BRING LIGHTS!

- Next we'll cruise to @rockcityyachtclub for beautiful views on the river!
  BYOB! Plan ahead.

- Finally, we'll close up the night @flyingsaucerlittlerock . Most likely in the
  basement with the pool tables.

HELMETS ARE STRONGLY ENCOURAGED!

This route will be an easy 4.5 miles.
```

Fed to the current parser, verbatim:

```json
{
  "title": "Hey friends!! Ready for another fun ride?",
  "gatherTime": "6:00 PM",
  "rollTime": "6:00 PM",
  "plan": [
    "Join us @nexuscoffeeroasters ! Doors open at 5:45 pm. Official start is 6 pm. Bring a bike lock. They're opening up just for us, so let's show them some luv!"
  ],
  "warnings": ["Missing location — the card needs all three pills."],
  "ok": false
}
```

Every field is wrong or missing. The title is the greeting. Both times are
6:00 PM. The location — which is stated plainly, twice — is absent. This
email would not publish.

## 6. What's actually hard here

The regex isn't merely under-tuned. The task requires **judgment**, and these
are the specific judgments:

- **There is no title.** The friend never names the ride. A theme has to be
  *written*, not extracted — something like "Coffee, Views & Pool Tables."
  This is copywriting, not parsing.
- **Three times, three meanings.** 5:45 pm doors open, 6:00 pm official start,
  6:30 pm roll out. The card has two time pills. Is "arrival" 5:45 or 6:00?
  Defensible either way; it needs a decision, and a consistent one.
- **Two locations, and the roll-out isn't at the start.** They gather at Nexus
  Coffee Roasters, but the 6:30 roll-out happens from the River Market park
  rally point. The three-pill model quietly assumes one place. This is a
  product question the schema doesn't currently answer.
- **Instagram handles are the venue names.** `@nexuscoffeeroasters` has to
  become "Nexus Coffee Roasters" on the card. Possibly a link.
- **Two separate safety callouts** in different places: `BRING LIGHTS!` and
  `HELMETS ARE STRONGLY ENCOURAGED!` — one `alert` field.
- **Four long bullets → 3–4 short plan lines.** Summarizing, not copying. The
  friend's bullets carry asides ("show them some luv", "BYOB! Plan ahead")
  that are charming in an email and too long for a card.
- **"an easy 4.5 miles."** The site has a stats section with a hardcoded
  distance. Should that go dynamic?
- **The attachment is a map, not a flyer.** "Map attached" — the current code
  grabs the first image and renders it as the ride's hero image. Wrong image,
  wrong role.

None of this is regex-shaped. All of it is one Claude call.

## 7. The direction to think about

Claude reads the post and produces the card. The open design space is
*where Claude runs* and *where the result lands*.

Rough options, worth arguing about rather than accepting:

**A. Claude inside Apps Script.** Keep Gmail as the trigger, replace the regex
with an Anthropic API call via `UrlFetchApp`. Smallest change. Keeps the
Google layer, which is the thing that feels wrong.

**B. Email → webhook → Next.js route → Claude → storage.** Inbound email
service (Resend/Postmark/Cloudflare Email Routing) hits an API route, that
route calls Claude, result gets written somewhere the site reads. Deletes
Apps Script and Sheets entirely. Question: what's "somewhere" — Vercel KV,
Blob, Postgres, or a JSON file committed to the repo?

**C. Claude Code as the pipeline.** Email lands → opens a GitHub issue →
Claude Code GitHub Action drafts the ride JSON and opens a PR → merging
deploys. Fully auditable, version-controlled, no runtime API dependency, no
database. Slower and more machinery.

**D. Human-in-the-loop.** Claude drafts, then emails a rendered preview with
an approve link. The ambiguities in §6 stop being risks — someone glances at
it for ten seconds. Costs a little friction, but from the *organizer*, not
the friend. Possibly the right trade.

**E. Skip email entirely.** A tiny page where the friend pastes his Instagram
post and sees the card render live, with an edit-then-publish button. Maybe
more frictionless than email, since he's already copy-pasting to Instagram.

## 8. Questions worth settling in the session

1. **Extract only, or also write?** Should Claude invent the title and `sub`,
   or should the card render without a title when he doesn't give one? How
   much of his voice ("Da plan", "show them some luv") should survive into
   the site's voice?
2. **Where does the ride data live** once Claude has extracted it? Repo JSON
   is auditable and free but requires a deploy. KV is instant but opaque.
3. **Fully automatic, or approve-first?** What actually happens when Claude
   gets a time wrong and it's already live?
4. **How does a human correct it fast** at 11pm on a Friday, from a phone?
   The Sheet's one real virtue was that fixing it was a cell edit.
5. **Does the three-pill model survive** the two-location case, or does the
   card need a different shape?
6. **What about the rest of the site?** FAQ, stats, gallery captions are all
   hardcoded now. Should the same mechanism feed those, or stay static?
7. **Cost, keys, and failure.** One Claude call a week is pennies. Where does
   the API key live, and what does the site show if the call fails?

## 9. Context and constraints

- **Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind v4,
  deployed on Vercel. Repo is public: `github.com/tmcmanus1994/pedalparty`.
- **Already built and working, worth keeping:** the whole front end; the
  5-state card system; ISR with a 5-minute window plus a secret-gated
  `/api/revalidate` for instant updates; Central-time/DST-correct countdown
  math. The *rendering* is solved. Only the *data path* is in question.
- **Budget:** nonprofit. Free tiers preferred. One ride per week, so volume
  is trivial no matter the design.
- **Who operates it:** one semi-technical organizer. Not a team. Whatever is
  built has to be debuggable by one person who didn't write it, months later.
- **Timing:** rides are Monday; the announcement goes out around Saturday.
  The current design holds a parsed ride until Saturday noon Central and then
  publishes.
- **The friend changes nothing.** He writes his post the way he writes it.

## 10. The one-sentence version

A volunteer writes a freeform hype post once a week; we need that post to
become a structured ride card on a Next.js site with no data entry by anyone —
and the current regex-and-Google-Sheets pipeline can't read what he actually
writes, so the question is how to rebuild it around Claude doing the reading.
