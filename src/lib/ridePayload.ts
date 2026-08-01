import { z } from "zod";
import { STATUSES, type RideContent } from "./ride";

/**
 * The wire shape of a ride, shared by everything that writes one.
 *
 * `/api/ride` (external automation, secret-gated) and `/api/admin/publish`
 * (the console, cookie-gated) both validate against this, so the two write
 * paths can't drift into accepting different things.
 */

const trimmed = z.string().trim();

/** An empty string from a form means "leave this off the card", not "". */
const optionalText = trimmed.transform((s) => s || undefined).optional();

export const RidePayload = z.object({
  status: z.enum(STATUSES as [(typeof STATUSES)[number], ...(typeof STATUSES)[number][]]),
  title: optionalText,
  sub: optionalText,
  location: optionalText,
  gatherTime: optionalText,
  rollTime: optionalText,
  plan: z
    .array(trimmed)
    .transform((lines) => {
      const kept = lines.filter(Boolean);
      return kept.length ? kept : undefined;
    })
    .optional(),
  alert: optionalText,
  imageUrl: optionalText,
  note: optionalText,
});

export type RidePayload = z.infer<typeof RidePayload>;

/** Narrow a validated payload to the type the store and the card both use. */
export function toRideContent(payload: RidePayload): RideContent {
  return payload;
}

/** The first problem, phrased for a human reading a curl response. */
export function firstIssue(err: unknown): string {
  if (err instanceof z.ZodError) {
    const issue = err.issues[0];
    if (!issue) return "Malformed request.";
    const where = issue.path.length ? `\`${issue.path.join(".")}\`: ` : "";
    return `${where}${issue.message}`;
  }
  return "Malformed request.";
}
