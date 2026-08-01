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

console.log(failures === 0 ? "\nAll store tests passed." : `\n${failures} test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
