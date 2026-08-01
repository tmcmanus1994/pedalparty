/**
 * Pedal Party — Saturday ride sync.
 *
 * Watches Gmail for the weekly ride email, turns it into the Next Ride card,
 * and pushes the site to refresh.
 *
 * Paste this file AND automation/parseRideEmail.js into one Apps Script
 * project (script.google.com), fill in CONFIG below, then run `setUp()` once.
 *
 *   inbox  ->  parse  ->  Drive (image)  ->  ride sheet  ->  /api/revalidate
 *
 * Runs on a time trigger, so "as soon as the email arrives" really means
 * "within one trigger interval" — 5 minutes by default, and 1 minute is
 * allowed if you want it tighter.
 */

// ============================================================================
// CONFIG — everything you need to change is in this block.
// ============================================================================
var CONFIG = {
  /** Who sends the ride email. Leave "" to accept any sender (not advised). */
  SENDER: "tmcmanus1994@gmail.com",

  /** Extra Gmail search terms. Narrow this if the sender emails about other things. */
  EXTRA_QUERY: "",

  /** The ride sheet: File > Share > copy the /d/<THIS PART>/edit id. */
  SHEET_ID: "1MPnTwn_oEgF15pQCvik_Bhb6gpSyvKMGsHD6QIbPhV0",

  /** Tab name inside that spreadsheet. */
  SHEET_NAME: "Rides",

  /** Drive folder for ride images. Created on first run if left blank. */
  DRIVE_FOLDER_ID: "",

  /** Your deployed site, no trailing slash. */
  SITE_URL: "https://pedalparty-lac.vercel.app",

  /**
   * Must match REVALIDATE_SECRET in the Vercel project.
   *
   * Leave this "" and put the real value in Apps Script under Project
   * Settings > Script Properties, key `REVALIDATE_SECRET`. This repo is
   * public — anything typed on this line is published to the world.
   */
  REVALIDATE_SECRET: "",

  /**
   * true  — parse as soon as the email lands, but hold the ride back until
   *         Saturday noon Central. Before then the site shows the countdown.
   * false — publish the moment the email is parsed.
   */
  PUBLISH_AT_NOON: true,

  /** Where to send a heads-up when an email can't be parsed cleanly. */
  NOTIFY: "pedalpartylr@gmail.com",

  /** Gmail labels used to track state. Created automatically. */
  LABEL_DONE: "PedalParty/Published",
  LABEL_HELD: "PedalParty/Held",
  LABEL_FAILED: "PedalParty/NeedsAttention",
};

/** Column order in the sheet. Must match what the site reads. */
var COLUMNS = [
  "Ride Date",
  "Theme/Title",
  "Sub Text",
  "Starting Location",
  "Gathering Time",
  "Start Rolling",
  "Plan 1",
  "Plan 2",
  "Plan 3",
  "Plan 4",
  "Alert",
  "Status",
  "Next Ride",
  "Image URL",
];

var TZ = "America/Chicago";

// ============================================================================
// SET-UP — run once from the Apps Script editor.
// ============================================================================
function setUp() {
  var required = ["SHEET_ID", "SITE_URL"];
  for (var i = 0; i < required.length; i++) {
    if (!CONFIG[required[i]]) throw new Error("CONFIG." + required[i] + " is empty.");
  }
  if (!revalidateSecret_()) {
    throw new Error(
      "No revalidate secret. Project Settings > Script Properties > add " +
        "REVALIDATE_SECRET, matching the one in Vercel.",
    );
  }

  ensureHeaderRow_();
  getLabel_(CONFIG.LABEL_DONE);
  getLabel_(CONFIG.LABEL_HELD);
  getLabel_(CONFIG.LABEL_FAILED);

  // Clear any triggers from a previous run so setUp() is safe to re-run.
  var triggers = ScriptApp.getProjectTriggers();
  for (var t = 0; t < triggers.length; t++) {
    if (triggers[t].getHandlerFunction() === "syncRide") ScriptApp.deleteTrigger(triggers[t]);
  }
  ScriptApp.newTrigger("syncRide").timeBased().everyMinutes(5).create();

  Logger.log("Set up. syncRide() now runs every 5 minutes.");
}

// ============================================================================
// MAIN
// ============================================================================
function syncRide() {
  // Publish anything that was parsed earlier and held for noon.
  releaseHeldRides_();

  var query = ["is:inbox", "-label:" + CONFIG.LABEL_DONE, "-label:" + CONFIG.LABEL_FAILED];
  if (CONFIG.SENDER) query.push("from:" + CONFIG.SENDER);
  if (CONFIG.EXTRA_QUERY) query.push(CONFIG.EXTRA_QUERY);
  query.push("newer_than:7d");

  var threads = GmailApp.search(query.join(" "), 0, 10);
  if (!threads.length) return;

  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];
    if (hasLabel_(thread, CONFIG.LABEL_HELD)) continue;

    var messages = thread.getMessages();
    var message = messages[messages.length - 1];

    try {
      handleMessage_(message, thread);
    } catch (err) {
      Logger.log("Failed on '" + message.getSubject() + "': " + err);
      thread.addLabel(getLabel_(CONFIG.LABEL_FAILED));
      notify_(
        "Pedal Party: ride email could not be processed",
        "Subject: " + message.getSubject() + "\n\nError: " + err + "\n\n" +
          "The thread is labelled " + CONFIG.LABEL_FAILED + ". Fix and remove the label to retry.",
      );
    }
  }
}

function handleMessage_(message, thread) {
  var parsed = parseRideEmail(message.getPlainBody());

  if (!parsed.ok) {
    thread.addLabel(getLabel_(CONFIG.LABEL_FAILED));
    notify_(
      "Pedal Party: ride email needs a look",
      "Subject: " + message.getSubject() + "\n\n" +
        "Couldn't fill the card from this email:\n  - " + parsed.warnings.join("\n  - ") + "\n\n" +
        "What did come through:\n" + JSON.stringify(parsed, null, 2) + "\n\n" +
        "Edit the sheet by hand, or reply to the sender and remove the " +
        CONFIG.LABEL_FAILED + " label to retry.",
    );
    return;
  }

  parsed.imageUrl = saveFirstImage_(message);

  var publishNow = !CONFIG.PUBLISH_AT_NOON || isPastSaturdayNoon_();
  writeRow_(parsed, publishNow ? "Schedule" : "Waiting");

  if (publishNow) {
    thread.addLabel(getLabel_(CONFIG.LABEL_DONE));
    revalidateSite_();
    Logger.log("Published: " + parsed.title);
  } else {
    // Stage it, and mark the thread so the noon pass knows to release it.
    thread.addLabel(getLabel_(CONFIG.LABEL_HELD));
    revalidateSite_();
    Logger.log("Staged for Saturday noon: " + parsed.title);
  }
}

/** At/after Saturday noon, flip anything staged to Schedule. */
function releaseHeldRides_() {
  if (!CONFIG.PUBLISH_AT_NOON || !isPastSaturdayNoon_()) return;

  var held = GmailApp.search("label:" + CONFIG.LABEL_HELD, 0, 5);
  if (!held.length) return;

  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var statusCol = COLUMNS.indexOf("Status") + 1;
  sheet.getRange(lastRow, statusCol).setValue("Schedule");

  for (var i = 0; i < held.length; i++) {
    held[i].removeLabel(getLabel_(CONFIG.LABEL_HELD));
    held[i].addLabel(getLabel_(CONFIG.LABEL_DONE));
  }
  revalidateSite_();
  Logger.log("Released staged ride at Saturday noon.");
}

// ============================================================================
// SHEET
// ============================================================================
function getSheet_() {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  return sheet;
}

function ensureHeaderRow_() {
  var sheet = getSheet_();
  var first = sheet.getRange(1, 1, 1, COLUMNS.length).getValues()[0];
  if (String(first[0]).trim() !== COLUMNS[0]) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    sheet.setFrozenRows(1);
  }
}

/**
 * The site reads the LAST non-empty row, so appending is how you publish.
 * Re-sending on the same day overwrites rather than piling up duplicates.
 */
function writeRow_(ride, status) {
  ensureHeaderRow_();
  var sheet = getSheet_();
  var today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");

  var plan = ride.plan || [];
  var row = [
    today,
    ride.title || "",
    ride.sub || "",
    ride.location || "",
    ride.gatherTime || "",
    ride.rollTime || "",
    plan[0] || "",
    plan[1] || "",
    plan[2] || "",
    plan[3] || "",
    ride.alert || "",
    status,
    "", // Next Ride — the site computes the countdown itself
    ride.imageUrl || "",
  ];

  var lastRow = sheet.getLastRow();
  var sameDay =
    lastRow >= 2 &&
    Utilities.formatDate(new Date(sheet.getRange(lastRow, 1).getValue()), TZ, "yyyy-MM-dd") === today;

  var target = sameDay ? lastRow : lastRow + 1;
  sheet.getRange(target, 1, 1, row.length).setValues([row]);
}

// ============================================================================
// IMAGE
// ============================================================================
/** First image attachment -> Drive, shared read-only, returns a direct URL. */
function saveFirstImage_(message) {
  var attachments = message.getAttachments({ includeInlineImages: true });
  for (var i = 0; i < attachments.length; i++) {
    var att = attachments[i];
    if (att.getContentType().indexOf("image/") !== 0) continue;

    var folder = getImageFolder_();
    var stamp = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
    var file = folder.createFile(att.copyBlob()).setName(stamp + " " + att.getName());
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // The /thumbnail form is the one that reliably renders in an <img>.
    return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1200";
  }
  return "";
}

function getImageFolder_() {
  if (CONFIG.DRIVE_FOLDER_ID) return DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  var existing = DriveApp.getFoldersByName("Pedal Party ride images");
  if (existing.hasNext()) return existing.next();
  return DriveApp.createFolder("Pedal Party ride images");
}

// ============================================================================
// SITE
// ============================================================================
/**
 * The shared secret for /api/revalidate.
 *
 * Script Properties first so the real value lives in the Apps Script project
 * and never in this file — the repo is public. CONFIG stays as a fallback for
 * anyone running a private copy.
 */
function revalidateSecret_() {
  var fromProps = PropertiesService.getScriptProperties().getProperty("REVALIDATE_SECRET");
  return fromProps || CONFIG.REVALIDATE_SECRET;
}

function revalidateSite_() {
  var secret = revalidateSecret_();
  if (!CONFIG.SITE_URL || !secret) return;
  try {
    var res = UrlFetchApp.fetch(CONFIG.SITE_URL + "/api/revalidate", {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ secret: secret }),
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) {
      Logger.log("Revalidate returned " + res.getResponseCode() + ": " + res.getContentText());
    }
  } catch (err) {
    // The sheet is already written; the site picks it up within 5 minutes anyway.
    Logger.log("Revalidate call failed: " + err);
  }
}

// ============================================================================
// HELPERS
// ============================================================================
function isPastSaturdayNoon_() {
  var now = new Date();
  var day = Number(Utilities.formatDate(now, TZ, "u")); // 1 = Monday ... 6 = Sat
  var hour = Number(Utilities.formatDate(now, TZ, "H"));
  return day === 6 && hour >= 12;
}

function getLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

function hasLabel_(thread, name) {
  var labels = thread.getLabels();
  for (var i = 0; i < labels.length; i++) if (labels[i].getName() === name) return true;
  return false;
}

function notify_(subject, body) {
  if (!CONFIG.NOTIFY) return;
  MailApp.sendEmail(CONFIG.NOTIFY, subject, body);
}

// ============================================================================
// Run this by hand to check your setup without touching the inbox.
// ============================================================================
function dryRun() {
  var query = CONFIG.SENDER ? "from:" + CONFIG.SENDER : "is:inbox";
  var threads = GmailApp.search(query + " newer_than:14d", 0, 1);
  if (!threads.length) {
    Logger.log("No matching email found.");
    return;
  }
  var messages = threads[0].getMessages();
  var parsed = parseRideEmail(messages[messages.length - 1].getPlainBody());
  Logger.log(JSON.stringify(parsed, null, 2));
}
