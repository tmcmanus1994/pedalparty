/**
 * Acceptance test for the extractor — a live call against the real post.
 *
 *     ANTHROPIC_API_KEY=sk-ant-... npm run test:extract
 *
 * Every assertion below is one of the extraction rules. When a rule changes,
 * change the assertion in the same commit; when a real post comes out wrong,
 * add it as a case here first, then fix the prompt.
 *
 * This costs a fraction of a cent to run.
 */
import { extractRide } from "../src/lib/extractRide";
import { NEXUS_POST } from "./nexus-post";

const PLAN_LINE_LIMIT = 75;

let failures = 0;
function check(name: string, pass: boolean, detail?: string) {
  if (pass) {
    console.log(`  ok    ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ""}`);
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set — this test makes a real API call.");
    process.exit(2);
  }

  const result = await extractRide(NEXUS_POST);
  if (!result.ok) {
    console.error(`Extraction failed: ${result.error}`);
    process.exit(1);
  }
  const r = result.extraction;
  console.log(JSON.stringify(r, null, 2));
  console.log("");

  const everyField = [r.title, r.sub, r.location, r.gatherTime, r.rollTime, r.alert, ...r.plan];
  const planText = r.plan.join(" ").toLowerCase();

  // The post never names the ride, so a title has to be written, not extracted.
  check("title is present", r.title.trim().length > 0);
  check(
    "title isn't the greeting",
    !/hey friends|ready for another/i.test(r.title),
    `got: ${r.title}`,
  );
  check("title is short", r.title.length <= 40, `${r.title.length} chars: ${r.title}`);

  // Pills: where and when a rider shows up.
  check(
    "location is the gathering venue, by its proper name",
    /nexus coffee roasters/i.test(r.location),
    `got: ${r.location}`,
  );
  check(
    "gather is the official start (6:00 PM), not doors-open (5:45)",
    /gather/i.test(r.gatherTime) && /\b6:?0?0?\s*p\.?m\.?/i.test(r.gatherTime) && !/5:45/.test(r.gatherTime),
    `got: ${r.gatherTime}`,
  );
  check(
    "roll is 6:30 PM",
    /roll/i.test(r.rollTime) && /6:30\s*p\.?m\.?/i.test(r.rollTime),
    `got: ${r.rollTime}`,
  );

  // The details the pills couldn't hold have to survive somewhere.
  check(
    "doors-open time kept in the plan",
    /5:45|doors/.test(planText),
    `plan: ${r.plan.join(" | ")}`,
  );
  check(
    "the rally point the group rolls out from is kept in the plan",
    /river market|rally/.test(planText),
    `plan: ${r.plan.join(" | ")}`,
  );

  // Handles become venue names, everywhere.
  check(
    "no @handles left anywhere",
    !everyField.some((f) => /@[a-z0-9._]+/i.test(f)),
    everyField.filter((f) => /@[a-z0-9._]+/i.test(f)).join(" | "),
  );

  // Both shouted callouts, merged into one field.
  check("alert mentions lights", /light/i.test(r.alert), `got: ${r.alert}`);
  check("alert mentions helmets", /helmet/i.test(r.alert), `got: ${r.alert}`);

  // The plan.
  check("plan has 3 or 4 steps", r.plan.length >= 3 && r.plan.length <= 4, `${r.plan.length} steps`);
  const long = r.plan.filter((l) => l.length > PLAN_LINE_LIMIT);
  check(
    `every plan line is under ~${PLAN_LINE_LIMIT} chars`,
    long.length === 0,
    long.map((l) => `${l.length}: ${l}`).join("\n        "),
  );

  check("sub is present", r.sub.trim().length > 0);

  console.log(
    failures === 0 ? "\nAll extraction rules hold." : `\n${failures} rule(s) FAILED.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
