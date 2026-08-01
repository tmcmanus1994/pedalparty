/**
 * Tests for the ride-email parser. Plain Node, no framework:
 *
 *     node automation/parseRideEmail.test.js
 *
 * The email format isn't fixed yet, so these cases are the contract. When a
 * real email arrives that parses wrong, add it here first, then fix the parser.
 */

const { parseRideEmail, normalizeTime } = require("./parseRideEmail");

let failures = 0;

function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.log(`  FAIL ${name}\n         expected ${e}\n         actual   ${a}`);
  }
}

console.log("normalizeTime");
check("6pm", normalizeTime("6pm"), "6:00 PM");
check("6:30 PM", normalizeTime("6:30 PM"), "6:30 PM");
check("6:30pm", normalizeTime("6:30pm"), "6:30 PM");
check("6 p.m.", normalizeTime("6 p.m."), "6:00 PM");
check("12:15 AM", normalizeTime("12:15 AM"), "12:15 AM");
check("18:30", normalizeTime("18:30"), "6:30 PM");
check("not a time", normalizeTime("Camp Taco"), null);

console.log("\nlabelled email");
const labelled = parseRideEmail(`
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
`);
check("title", labelled.title, "Taco 'Bout Halfway");
check("location", labelled.location, "Camp Taco");
check("gatherTime", labelled.gatherTime, "6:00 PM");
check("rollTime", labelled.rollTime, "6:30 PM");
check("alert", labelled.alert, "BRING LIGHTS! Helmets strongly encouraged!");
check("plan length", labelled.plan.length, 4);
check("plan[1]", labelled.plan[1], "6:30 PM roll out to Moody Brews");
check("ok", labelled.ok, true);
check("no warnings", labelled.warnings, []);

console.log("\nlabel aliases");
const aliases = parseRideEmail(`
Ride Name: Hillcrest Hustle
Starting Point: Allsopp Park
Meet Time: 6 pm
Roll Out: 6:30 pm
Heads up: Bring lights, it gets dark early now.
`);
check("title", aliases.title, "Hillcrest Hustle");
check("location", aliases.location, "Allsopp Park");
check("gatherTime", aliases.gatherTime, "6:00 PM");
check("rollTime", aliases.rollTime, "6:30 PM");
check("alert", aliases.alert, "Bring lights, it gets dark early now.");

console.log("\nfree text");
const free = parseRideEmail(`
Pizza Party Pedal

This week we're keeping it easy and flat. Gather at Zaza around 6:00 PM,
we roll out at 6:30 PM sharp. Bring a lock!

1. Meet at Zaza for slices
2. Ride to the river trail
3. Finish at Stone's Throw
`);
check("title", free.title, "Pizza Party Pedal");
check("location", free.location, "Zaza");
check("gatherTime", free.gatherTime, "6:00 PM");
check("rollTime", free.rollTime, "6:30 PM");
check("plan length", free.plan.length, 3);
check("plan[2]", free.plan[2], "Finish at Stone's Throw");

console.log("\nfree text, times only in order");
const terse = parseRideEmail(`
River Loop
We're on at 6:00 PM and 6:30 PM from the Clinton Library.
`);
check("gatherTime", terse.gatherTime, "6:00 PM");
check("rollTime", terse.rollTime, "6:30 PM");

console.log("\nincomplete email reports what's missing");
const partial = parseRideEmail(`
Theme: Mystery Ride
Gather: 6:00 PM
`);
check("ok", partial.ok, false);
check(
  "warnings",
  partial.warnings,
  [
    "Missing location — the card needs all three pills.",
    "Missing rollTime — the card needs all three pills.",
  ],
);

console.log("\nquoted reply and signature are ignored");
const noisy = parseRideEmail(`
Theme: Argenta Amble
Start: Six Bridges
Gather: 6:00 PM
Roll: 6:30 PM

--
Sent from my iPhone

> On Fri, someone wrote:
> Theme: Old Ride
> Start: Somewhere Else
`);
check("title", noisy.title, "Argenta Amble");
check("location", noisy.location, "Six Bridges");

console.log(
  failures === 0 ? "\nAll parser tests passed." : `\n${failures} parser test(s) FAILED.`,
);
process.exit(failures === 0 ? 0 : 1);
