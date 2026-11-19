/**
 * chrns.co contact form → email + Google Sheet log.
 * Deploy: script.google.com (logged in as chronos.cov1@gmail.com) → New project → paste this
 * → Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → copy the URL
 * → paste into public/contact.html as FORM_ENDPOINT.
 */
const NOTIFY_TO = "chronos.cov1@gmail.com,arriesgado.jafaith@gmail.com";
const NOTIFY_CC = "arvindelasalas96@gmail.com";
const SHEET_NAME = "Inquiries"; // optional log, created on first submission in the bound spreadsheet

function doPost(e) {
  try {
    const d = e.parameter || {};
    if (d._honey) return ok(); // bot filled the hidden field, drop silently

    const name = (d.name || "").trim();
    const phone = (d.phone || "").trim();
    const email = (d.email || "").trim();
    const topic = (d.topic || "General").trim();
    const watch = (d.watch || "").trim();
    const message = (d.message || "").trim();
    if (!name || !phone || !message) return fail("Name, mobile number and message are required.");

    const subject = `[chrns.co] ${topic}${watch ? " · " + watch : ""} · ${name}`;
    const body =
      `New inquiry from chrns.co\n\n` +
      `Name: ${name}\nMobile: ${phone}\nEmail: ${email || "(none)"}\n` +
      `Topic: ${topic}\nWatch: ${watch || "(none)"}\n\n${message}\n\n` +
      `Reply: ${email ? "mailto:" + email : "call/Viber " + phone}`;

    MailApp.sendEmail({ to: NOTIFY_TO, cc: NOTIFY_CC, subject, body, replyTo: email || undefined });

    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
        if (sh.getLastRow() === 0) sh.appendRow(["When", "Name", "Mobile", "Email", "Topic", "Watch", "Message"]);
        sh.appendRow([new Date(), name, phone, email, topic, watch, message]);
      }
    } catch (_) {}

    return ok();
  } catch (err) {
    return fail(err.message);
  }
}

function ok() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
function fail(msg) {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: msg })).setMimeType(ContentService.MimeType.JSON);
}
