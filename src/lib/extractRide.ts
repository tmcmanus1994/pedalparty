import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

/**
 * Turn the volunteer's freeform hype post into the Next Ride card.
 *
 * The post is written for Instagram, in his voice, with no labels and no
 * fixed shape — venues are @handles, three different times mean three
 * different things, safety callouts are shouted in two separate places, and
 * the ride usually has no name at all. Reading that correctly is judgment,
 * not parsing, which is why it's a model call and not a regex.
 *
 * The rules below are the product decisions. They are what make the output
 * predictable across wildly different posts, so change them deliberately —
 * `npm run test:extract` checks them against a real post.
 */

/**
 * The card fields, as the model returns them.
 *
 * Deliberately free of `.min()` / `.max()` constraints: structured outputs
 * don't support length constraints server-side, and the SDK would enforce
 * them client-side by throwing — turning "one plan line ran long" into a
 * total failure. Length is a prompt rule and a soft warning in the admin UI
 * instead, so a slightly-long line is something you edit, not something that
 * loses you the whole draft.
 */
export const RideExtraction = z.object({
  title: z
    .string()
    .describe(
      "The ride's name. Title Case, under ~30 characters. If the post names the ride, use that name. If it doesn't — which is common — write one in the site's voice: playful, concrete, often a pun on the venues or the route. Never invent facts to make the pun work.",
    ),
  sub: z
    .string()
    .describe(
      "One line of flavor under the title, under ~90 characters. Distance, terrain, or the vibe of the night. Plain sentence, no emoji.",
    ),
  location: z
    .string()
    .describe(
      "PILL 1 — the proper name of the place a rider shows up to at the start. Venue name only, no address, no time.",
    ),
  gatherTime: z
    .string()
    .describe(
      'PILL 2 — when the ride officially starts, formatted exactly like "Gather 6:00 PM".',
    ),
  rollTime: z
    .string()
    .describe('PILL 3 — when the group rolls out, formatted exactly like "Roll 6:30 PM".'),
  plan: z
    .array(z.string())
    .describe(
      "The night in order: 3 or 4 steps, each under ~75 characters. Compress; don't quote. This is where doors-open times, rally points, and any roll-out location that isn't the starting point go.",
    ),
  alert: z
    .string()
    .describe(
      "Every safety callout in the post, merged into one line. Keep the shouting — these are shouted on purpose.",
    ),
  notes: z
    .string()
    .describe(
      "For the human reviewing this, not for the site. Any judgment call you made, anything ambiguous, and anything you could not find. Empty string if the post was unambiguous.",
    ),
});

export type RideExtraction = z.infer<typeof RideExtraction>;

const SYSTEM = `You turn a Pedal Party ride announcement into the fields of the "Next Ride" card on pedalpartylr.com.

Pedal Party is an inclusive, family-friendly Monday evening bike ride in Little Rock, Arkansas. A volunteer writes the weekly announcement as a hype post for Instagram — in his own voice, with no labels and no fixed structure. Your job is to read it the way a person would and fill in the card.

THE SITE'S VOICE
Playful, warm, a little goofy, never corporate. It calls itself "Little Rock's raddest, chillest, most epic, least hyperbolic Monday SOCIAL RIDE." Past ride names look like "Taco 'Bout Halfway" and "Pizza Party Pedal" — a short pun, usually on the venues or the route. Match that register in \`title\` and \`sub\`. Do not carry the post's greeting, sign-off, or hashtags onto the card.

THE THREE PILLS
The card always shows exactly three pills, and they answer one question: where and when does a rider show up?
  - \`location\` is the gathering spot — where riders physically go first.
  - \`gatherTime\` is the official start time.
  - \`rollTime\` is when the group rolls out.
A post often mentions more times and more places than these three. A doors-open or arrive-early time is NOT the gather time — the official start is. A rally point or a second location the group departs from is NOT the starting location. Those extra details are real and riders need them, so they go into the plan lines. They never displace a pill.

VENUE NAMES
Venues are usually written as Instagram handles. Convert each to its proper display name: @nexuscoffeeroasters becomes "Nexus Coffee Roasters", @rockcityyachtclub becomes "Rock City Yacht Club". Never leave an @handle in any field.

SAFETY CALLOUTS
Posts shout safety notes in several places, often in all caps and far apart. Collect every one of them into the single \`alert\` field, joined into one line. Keep the capitalization — the shouting is intentional.

THE PLAN
3 or 4 steps, in the order the night happens, each under about 75 characters. Compress the post's bullets into short steps; do not quote them. Drop the asides and the encouragement, keep what a rider needs to know: where, when, what happens there.

HONESTY
Fill every field from what the post actually says. Never invent a venue, a time, or a distance. If something a field needs genuinely isn't in the post, put your best reading in the field and say so plainly in \`notes\` so a human can check it. \`notes\` is the one field written for the reviewer rather than the site — use it for every judgment call you made.`;

export type ExtractResult =
  | { ok: true; extraction: RideExtraction }
  | { ok: false; error: string };

/**
 * `medium` effort: this is a short extraction plus two sentences of
 * copywriting, and Opus 5 is strong at the low end of the ladder. Raise it if
 * titles start coming out flat.
 */
const EFFORT = "medium" as const;

export async function extractRide(post: string): Promise<ExtractResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "ANTHROPIC_API_KEY is not set on the server." };
  }
  const text = post.trim();
  if (!text) return { ok: false, error: "Nothing to read — paste the post first." };

  const client = new Anthropic();

  try {
    const message = await client.beta.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      // Safety classifiers can decline a request outright. A bike-ride flyer
      // is about as far from that as text gets, but the fallback costs
      // nothing when it doesn't fire and turns a dead Saturday into a
      // slightly different model answering.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: EFFORT, format: zodOutputFormat(RideExtraction) },
      system: SYSTEM,
      messages: [{ role: "user", content: text }],
    });

    if (message.stop_reason === "refusal") {
      return { ok: false, error: "The model declined to read that text." };
    }
    if (!message.parsed_output) {
      return { ok: false, error: "The model's reply didn't match the card's shape." };
    }
    return { ok: true, extraction: message.parsed_output };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[pedalparty] extraction failed:", err);
    return { ok: false, error: detail };
  }
}
