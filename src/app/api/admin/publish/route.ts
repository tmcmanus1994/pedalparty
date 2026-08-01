import { NextResponse } from "next/server";
import { z } from "zod";
import { isSignedIn } from "@/lib/adminAuth";
import { refreshSite } from "@/lib/refresh";
import { STATUSES } from "@/lib/ride";
import { clearDraft, storeConfigured, writeStoredRide } from "@/lib/rideStore";
import { nextSaturdayNoonCentral } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const trimmed = z.string().trim();
/** Empty strings from the form mean "leave this off the card", not "". */
const optionalText = trimmed.transform((s) => s || undefined).optional();

const PublishBody = z.object({
  ride: z.object({
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
  }),
  /** true = hold until Saturday noon Central; false = live now. */
  hold: z.boolean(),
});

export async function POST(request: Request) {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!storeConfigured()) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is not set, so there's nowhere to publish to." },
      { status: 503 },
    );
  }

  let parsed;
  try {
    parsed = PublishBody.parse(await request.json());
  } catch (err) {
    const detail = err instanceof z.ZodError ? err.issues[0]?.message : "Malformed request.";
    return NextResponse.json({ error: detail ?? "Malformed request." }, { status: 400 });
  }

  const publishAt = parsed.hold ? nextSaturdayNoonCentral() : null;

  await writeStoredRide({
    ride: parsed.ride,
    publishAt,
    updatedAt: new Date().toISOString(),
    source: "admin",
  });

  // The pasted post has become a card; don't offer it again next time.
  await clearDraft().catch(() => {});

  refreshSite();

  return NextResponse.json({ ok: true, publishAt });
}
