/**
 * Tests for the half of the pipeline that doesn't call a model.
 *
 *     npm run test:store
 *
 * The hold-until-Saturday-noon behaviour lives entirely in
 * `resolveStoredRide`, which is why there's no scheduled job anywhere in this
 * project — so it's worth pinning down.
 */
import { resolveStoredRide, type RideContent } from "../src/lib/ride";
import { RidePayload } from "../src/lib/ridePayload";
import type { StoredRide } from "../src/lib/rideStore";
import { nextSaturdayNoonCentral, centralParts } from "../src/lib/time";

let failures = 0;
function check(name: string, pass: boolean, detail?: string) {
  if (pass) console.log(`  ok    ${name}`);
  else {
    failures++;
    console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ""}`);
  }
}

const RIDE: RideContent = {
  status: "Schedule",
  title: "Coffee & Pool Tables",
  location: "Nexus Coffee Roasters",
};

const stored = (publishAt: string | null, ride: RideContent = RIDE): StoredRide => ({
  ride,
  publishAt,
  updatedAt: "2026-08-01T00:00:00.000Z",
  source: "test",
});

const NOW = Date.parse("2026-08-01T12:00:00.000Z");

// Live now.
{
  const r = resolveStoredRide(stored(null), NOW);
  check("no hold → the ride renders", r.status === "Schedule" && r.title === RIDE.title);
  check("no hold → a countdown target is filled in", Boolean(r.countdownTarget));
}

// Held.
{
  const at = new Date(NOW + 60 * 60 * 1000).toISOString();
  const r = resolveStoredRide(stored(at), NOW);
  check("held → shows the Waiting card instead", r.status === "Waiting", `got ${r.status}`);
  check("held → counts down to the release instant", r.countdownTarget === at, r.countdownTarget);
  check("held → the ride's own fields are not leaked", r.title === undefined);
}

// The hold expires on its own — this is what replaces a cron job.
{
  const at = new Date(NOW - 1000).toISOString();
  const r = resolveStoredRide(stored(at), NOW);
  check("hold in the past → the ride is live, no job required", r.status === "Schedule");
}

// A malformed timestamp must fail open, not hide the ride forever.
{
  const r = resolveStoredRide(stored("not a date"), NOW);
  check("unparseable publishAt → ride still renders", r.status === "Schedule");
}

// Off-season counts down to the opener, not to Saturday.
{
  const r = resolveStoredRide(stored(null, { status: "Hibernating" }), NOW);
  const target = Date.parse(r.countdownTarget);
  check(
    "hibernating → counts down to the season opener, months out",
    target - NOW > 60 * 24 * 60 * 60 * 1000,
    r.countdownTarget,
  );
}

// The instant "Hold until Saturday noon" resolves to.
{
  const iso = nextSaturdayNoonCentral(NOW);
  const p = centralParts(Date.parse(iso));
  check("next Saturday noon is a Saturday", p.weekday === 6, `weekday ${p.weekday}`);
  check("next Saturday noon is at 12:00 Central", p.hour === 12 && p.minute === 0, iso);
  check("next Saturday noon is in the future", Date.parse(iso) > NOW, iso);
}

// ---------------------------------------------------------------------------
// The wire contract. This is the shape documented in the README, so an
// external automation is writing against these assertions whether it knows it
// or not — which makes them the thing not to break casually.
// ---------------------------------------------------------------------------

// The README's worked example, verbatim.
{
  const parsed = RidePayload.safeParse({
    status: "Schedule",
    title: "Coffee, Views & Pool Tables",
    sub: "An easy 4.5 miles from downtown coffee to the river and back.",
    location: "Nexus Coffee Roasters",
    gatherTime: "Gather 6:00 PM",
    rollTime: "Roll 6:30 PM",
    plan: [
      "Doors open 5:45 at Nexus Coffee Roasters — bring a lock",
      "6:30 roll out from the River Market park rally point",
      "Cruise to Rock City Yacht Club for river views — BYOB",
      "Close out the night at Flying Saucer, basement pool tables",
    ],
    alert: "BRING LIGHTS! HELMETS ARE STRONGLY ENCOURAGED!",
    imageUrl: "https://example.com/flyer.jpg",
  });
  check(
    "the README's example payload validates",
    parsed.success,
    parsed.success ? "" : JSON.stringify(parsed.error.issues[0]),
  );
  check("plan survives intact", parsed.success && parsed.data.plan?.length === 4);
}

// Status is the only thing an external caller must send.
{
  const parsed = RidePayload.safeParse({ status: "NoRide" });
  check("status alone is a valid ride", parsed.success);
}

// Empty strings from a form mean "leave it off the card".
{
  const parsed = RidePayload.safeParse({ status: "Schedule", title: "  ", sub: "" });
  check(
    "blank fields drop out rather than rendering empty",
    parsed.success && parsed.data.title === undefined && parsed.data.sub === undefined,
  );
}

// Blank plan rows in the console shouldn't become blank bullets on the card.
{
  const parsed = RidePayload.safeParse({
    status: "Schedule",
    plan: ["Meet at Zaza", "", "  ", "Finish at Stone's Throw"],
  });
  check(
    "blank plan rows are filtered out",
    parsed.success && parsed.data.plan?.length === 2,
    parsed.success ? JSON.stringify(parsed.data.plan) : "",
  );
}

// A typo in status must fail loudly rather than silently becoming Waiting.
{
  const parsed = RidePayload.safeParse({ status: "schedule" });
  check("a bad status is rejected, not coerced", !parsed.success);
}
{
  const parsed = RidePayload.safeParse({ title: "No status here" });
  check("a missing status is rejected", !parsed.success);
}

console.log(failures === 0 ? "\nAll store tests passed." : `\n${failures} test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
