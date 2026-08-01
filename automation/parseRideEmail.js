/**
 * Turns the Saturday ride email into the fields the Next Ride card needs.
 *
 * Plain JavaScript with no imports on purpose: this same file is pasted into
 * Google Apps Script, and it is exercised by automation/parseRideEmail.test.js
 * here so the parsing is verified before it ever runs against a real inbox.
 *
 * It accepts two shapes, in this order of preference:
 *
 * 1. LABELLED — the reliable one. Any subset of these lines, in any order:
 *
 *      Theme: Taco 'Bout Halfway
 *      Sub: Halfway through the season, y'all!
 *      Start: Camp Taco
 *      Gather: 6:00 PM
 *      Roll: 6:30 PM
 *      Alert: BRING LIGHTS!
 *      Plan:
 *      - Gather 6 PM at Camp Taco
 *      - 6:30 roll out to Moody Brews
 *
 *    Aliases are generous: "Location"/"Starting Point"/"Meet" all mean Start,
 *    "Roll Out"/"Depart"/"Kickstands" all mean Roll, and so on.
 *
 * 2. FREE TEXT — best effort. First line becomes the theme; times are found by
 *    pattern and assigned by the words around them ("gather"/"meet"/"arrive"
 *    vs "roll"/"depart"/"leave"); the start location is read from a "at X"
 *    phrase near the gather time; bulleted or numbered lines become the plan.
 *
 * Whatever it can't find comes back undefined, and `warnings` says what is
 * missing so the caller can flag it rather than publish a half-empty card.
 */

/** The three pills the card always shows, in order. */
const REQUIRED_FIELDS = ["location", "gatherTime", "rollTime"];

const LABELS = {
  title: ["theme", "title", "ride", "ride name", "name"],
  sub: ["sub", "subtitle", "sub text", "blurb", "description", "details"],
  location: [
    "start",
    "starting point",
    "starting location",
    "start location",
    "location",
    "meet",
    "meeting spot",
    "meetup",
    "where",
  ],
  gatherTime: ["gather", "gather time", "arrive", "arrival", "meet time", "gather at"],
  rollTime: ["roll", "roll out", "rollout", "depart", "departure", "leave", "kickstands"],
  alert: ["alert", "heads up", "headsup", "note", "warning", "reminder"],
  plan: ["plan", "da plan", "route", "itinerary", "stops", "schedule"],
};

/** "6", "6pm", "6:30 PM", "18:30" → "6:00 PM". Returns null if not a time. */
function normalizeTime(raw) {
  if (!raw) return null;
  const m = String(raw)
    .trim()
    .match(/\b(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m?\.?\b/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const pm = m[3].toLowerCase() === "p";
    if (h === 12) h = 0;
    if (pm) h += 12;
    if (h > 23 || min > 59) return null;
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(min).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  }
  // 24-hour, e.g. "18:30". Bare hours are too ambiguous to guess at.
  const h24 = String(raw)
    .trim()
    .match(/\b(\d{1,2}):(\d{2})\b/);
  if (h24) {
    const h = parseInt(h24[1], 10);
    const min = parseInt(h24[2], 10);
    if (h > 23 || min > 59) return null;
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(min).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  }
  return null;
}

function labelFor(word) {
  const key = word.trim().toLowerCase().replace(/\s+/g, " ");
  for (const field of Object.keys(LABELS)) {
    if (LABELS[field].indexOf(key) !== -1) return field;
  }
  return null;
}

function stripBullet(line) {
  return line.replace(/^\s*(?:[-–—*•]|\d+[.)])\s*/, "").trim();
}

function isBullet(line) {
  return /^\s*(?:[-–—*•]|\d+[.)])\s+/.test(line);
}

/** Drop quoted replies, signatures and the usual mail cruft. */
function cleanBody(body) {
  return String(body || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => !/^\s*>/.test(l))
    .join("\n")
    .split(/^\s*(?:--\s*$|On .+ wrote:|Sent from my )/m)[0]
    .replace(/ /g, " ")
    .trim();
}

function parseRideEmail(body) {
  const text = cleanBody(body);
  const lines = text.split("\n");

  const out = {};
  const plan = [];
  const warnings = [];
  let collectingPlan = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      // A blank line only ends the plan if we've already collected something.
      if (collectingPlan && plan.length) collectingPlan = false;
      continue;
    }

    const labelled = trimmed.match(/^([A-Za-z][A-Za-z '/]{1,24}?)\s*[:\-–—]\s*(.*)$/);
    const field = labelled ? labelFor(labelled[1]) : null;

    if (field) {
      const value = labelled[2].trim();
      collectingPlan = field === "plan";
      if (field === "plan") {
        if (value) plan.push(stripBullet(value));
        continue;
      }
      if (!value) continue;
      if (field === "gatherTime" || field === "rollTime") {
        const t = normalizeTime(value);
        if (t) out[field] = t;
        else warnings.push(`Could not read a time from "${trimmed}"`);
      } else {
        out[field] = value;
      }
      continue;
    }

    if (collectingPlan && isBullet(trimmed)) {
      plan.push(stripBullet(trimmed));
      continue;
    }
    if (collectingPlan && plan.length === 0) {
      // "Plan:" on its own line followed by unbulleted lines.
      plan.push(trimmed);
      continue;
    }
    collectingPlan = false;
  }

  // ---- Free-text fallbacks for anything the labels didn't cover ----------
  const bullets = lines.filter((l) => isBullet(l)).map(stripBullet);
  if (!plan.length && bullets.length) plan.push.apply(plan, bullets);

  if (!out.title) {
    const first = lines.map((l) => l.trim()).filter(Boolean)[0];
    if (first && !isBullet(first) && first.length <= 80) out.title = first;
  }

  if (!out.gatherTime || !out.rollTime) {
    // Pull every time in the body with the sentence around it, then assign by
    // the verbs nearby. "Gather at 6, roll out at 6:30" resolves correctly.
    const re = /([^.\n!?]{0,60}?)\b(\d{1,2}(?::\d{2})?\s*[ap]\.?m?\.?)/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const context = m[1].toLowerCase();
      const t = normalizeTime(m[2]);
      if (!t) continue;
      if (!out.rollTime && /\broll|depart|leav|kickstand|head out|take off/.test(context)) {
        out.rollTime = t;
      } else if (!out.gatherTime && /\bgather|meet|arriv|show up|start|assemble/.test(context)) {
        out.gatherTime = t;
      }
    }
    // Still ambiguous? Two times in order almost always means gather then roll.
    if (!out.gatherTime || !out.rollTime) {
      const all = [];
      const re2 = /\b\d{1,2}(?::\d{2})?\s*[ap]\.?m?\.?/gi;
      let t2;
      while ((t2 = re2.exec(text)) !== null) {
        const norm = normalizeTime(t2[0]);
        if (norm && all.indexOf(norm) === -1) all.push(norm);
      }
      if (!out.gatherTime && all.length >= 1) out.gatherTime = all[0];
      if (!out.rollTime && all.length >= 2) out.rollTime = all[1];
    }
  }

  if (!out.location) {
    // "gather at Camp Taco", "meet at Camp Taco at 6" — take the place, not
    // the time, and stop at punctuation or a trailing "at <time>".
    const m = text.match(
      /\b(?:gather|meet|meeting|start|starting|kick off|kickoff)\s*(?:up)?\s*(?:at|@|from)\s+((?!\d)[^,.\n!?]{2,60})/i,
    );
    if (m) {
      out.location = m[1]
        .replace(/\s+(?:at|around|by)\s+\d.*$/i, "")
        .replace(/\s+\d{1,2}(?::\d{2})?\s*[ap]\.?m?\.?.*$/i, "")
        .trim();
    }
  }

  if (plan.length) out.plan = plan.slice(0, 4);

  for (const f of REQUIRED_FIELDS) {
    if (!out[f]) warnings.push(`Missing ${f} — the card needs all three pills.`);
  }
  if (!out.title) warnings.push("Missing title.");

  out.warnings = warnings;
  out.ok = warnings.length === 0;
  return out;
}

// Apps Script has no module system; Node needs one. Support both.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { parseRideEmail, normalizeTime, cleanBody };
}
