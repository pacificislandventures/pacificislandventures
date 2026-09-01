/**
 * Space Traders closed-beta signup backend.
 *
 * Deploy: bound to a Google Sheet (Extensions > Apps Script), as a Web App,
 * "Execute as: Me", "Who has access: Anyone". Paste the /exec URL into
 * assets/config.js on the website.
 *
 * The website POSTs {credential: <Google ID token>}. This script verifies the
 * token with Google (signature, audience, expiry) and only records addresses
 * Google reports as verified — the client is never trusted to name an email.
 */

// Must match GOOGLE_CLIENT_ID in the site's assets/config.js.
var CLIENT_ID = "PASTE_CLIENT_ID_HERE.apps.googleusercontent.com";
var SHEET_NAME = "Signups";

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!body.credential) return respond({ ok: false, error: "missing_credential" });

    // Google validates the token's signature and expiry; a bad/expired token is a non-200.
    var resp = UrlFetchApp.fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(body.credential),
      { muteHttpExceptions: true }
    );
    if (resp.getResponseCode() !== 200) return respond({ ok: false, error: "invalid_token" });

    var info = JSON.parse(resp.getContentText());
    if (info.aud !== CLIENT_ID) return respond({ ok: false, error: "wrong_audience" });
    if (String(info.email_verified) !== "true") return respond({ ok: false, error: "email_not_verified" });

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = getSheet();
      var emails = sheet.getRange(2, 2, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
      for (var i = 0; i < emails.length; i++) {
        if (emails[i][0] === info.email) return respond({ ok: true, duplicate: true });
      }
      sheet.appendRow([new Date(), info.email, info.name || "", info.sub]);
    } finally {
      lock.releaseLock();
    }
    return respond({ ok: true, duplicate: false });
  } catch (err) {
    return respond({ ok: false, error: "server_error" });
  }
}

// Liveness check: open the /exec URL in a browser and expect {"ok":true,...}.
function doGet() {
  return respond({ ok: true, service: "space-traders-beta-signup" });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Email", "Name", "Google ID"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
