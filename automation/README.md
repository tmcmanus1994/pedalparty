# Saturday ride automation

Turns the weekly ride email into the Next Ride card, with no one touching the
site.

```
friend's email  →  Apps Script (parse)  →  Drive (image)
                                        →  ride sheet
                                        →  POST /api/revalidate  →  site is live
```

Nothing new to pay for or host: it runs inside the Pedal Party Google account
and writes to the same sheet the site already reads.

## How fast is it?

**Within about 5 minutes of the email arriving.** Apps Script runs on a time
trigger, not a push, so "instantly" means "on the next tick". The trigger can go
as low as **1 minute** if you want it tighter — change `everyMinutes(5)` in
`setUp()`. That is genuinely as close to instant as this design gets without
standing up Google Cloud Pub/Sub, which is a lot of machinery for a weekly job.

By default the script **parses immediately but holds the ride until Saturday
noon Central** — the countdown keeps running until then, and the card flips the
moment noon passes. Set `PUBLISH_AT_NOON: false` to publish the instant the
email is parsed instead.

## What the email should say

The parser takes labelled lines first, and falls back to reading plain prose.
**Labelled is the one to ask for** — it removes all guessing:

```
Theme: Taco 'Bout Halfway
Sub: Halfway through the season, y'all! Easy-rolling route with a couple shorter hills.
Start: Camp Taco
Gather: 6:00 PM
Roll: 6:30 PM
Alert: BRING LIGHTS! Helmets strongly encouraged!
Plan:
- Gather 6 PM at Camp Taco — arrive early for food & bring a lock
- 6:30 PM roll out to Moody Brews
- Moody Brews opens just for us
- Wrap up the night at Lost Forty
```

Attach the flyer image and that's the whole email.

Labels are forgiving — `Ride Name` / `Title` all mean Theme, `Starting Point` /
`Location` / `Meet` all mean Start, `Roll Out` / `Depart` / `Kickstands` all
mean Roll, `Heads up` / `Note` mean Alert. Times can be `6pm`, `6:30 PM`,
`6 p.m.` or `18:30`.

**The three pills always come from Start, Gather and Roll**, in that order:
📍 location · 🕕 gather time · 🚲 roll time. If any of the three is missing the
script does *not* publish — it emails you instead saying which one it couldn't
find, and labels the thread `PedalParty/NeedsAttention`. A half-empty card never
goes live.

Free prose works too. This parses correctly:

> Pizza Party Pedal
>
> This week we're keeping it easy and flat. Gather at Zaza around 6:00 PM,
> we roll out at 6:30 PM sharp. Bring a lock!
>
> 1. Meet at Zaza for slices
> 2. Ride to the river trail
> 3. Finish at Stone's Throw

## Setting it up

1. **Site:** in Vercel → Settings → Environment Variables, add
   `REVALIDATE_SECRET` — any long random string. Redeploy.
2. Go to [script.google.com](https://script.google.com), signed in as the Pedal
   Party Google account, and create a new project.
3. Add two files and paste in the contents of `parseRideEmail.js` and
   `rideSync.gs` from this folder.
4. Fill in `CONFIG` at the top of `rideSync.gs`: `SENDER` (your friend's
   address), `SHEET_ID`, `SITE_URL`, and the same `REVALIDATE_SECRET`.
5. Run `setUp()` once and grant the permissions it asks for. It creates the
   header row, the Gmail labels, and the 5-minute trigger.
6. Run `dryRun()` against a real email to see exactly what the parser gets
   before it goes anywhere near the sheet.

## Checking it

Run the parser tests before changing anything in it:

```bash
node automation/parseRideEmail.test.js
```

The email format isn't settled yet, so **when a real email parses wrong, paste
it into `parseRideEmail.test.js` as a new case first, then fix the parser.**
That way the same mistake can't come back.

## Gmail labels the script uses

| Label | Meaning |
| ----- | ------- |
| `PedalParty/Published` | Done — on the site. |
| `PedalParty/Held` | Parsed and staged, waiting for Saturday noon. |
| `PedalParty/NeedsAttention` | Couldn't parse. You've been emailed. Remove the label to retry. |

## If something goes wrong

The sheet is the source of truth, so **any failure is one hand-edit away from
fixed** — open the sheet, correct the last row, and the site picks it up within
5 minutes (or call `/api/revalidate` to make it instant).

- **Card didn't update.** Check Apps Script → Executions for errors. Confirm
  `REVALIDATE_SECRET` matches on both sides; a mismatch returns 401 and the
  script logs it but still writes the sheet, so the ride appears within 5 min.
- **Wrong details on the card.** Fix the last row of the sheet directly.
- **Image missing.** The script only picks up the *first image attachment*.
  Inline-pasted images usually work; images inside a PDF do not.
