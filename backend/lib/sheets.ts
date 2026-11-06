/**
 * Google Sheets sync — fire-and-forget row appender.
 *
 * Uses a Google service account (JSON stored in GOOGLE_SERVICE_ACCOUNT_JSON secret)
 * and a target spreadsheet ID (GOOGLE_SHEETS_ID env var).
 *
 * All functions are safe to call without awaiting — errors are logged, never thrown.
 */

import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "";
const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "";

const TRIAL_SHEET = "Trial Bookings";
const ENQUIRY_SHEET = "Contact Enquiries";

const TRIAL_HEADERS = [
  "Timestamp",
  "Source Page",
  "Parent Name",
  "Child Name",
  "Age Group",
  "Area",
  "Current Level",
  "Phone",
  "WhatsApp",
  "Email",
  "How Heard",
  "UTM Source",
  "UTM Medium",
  "UTM Campaign",
  "Landing Page",
  "Referrer",
  "Notes",
];

const ENQUIRY_HEADERS = [
  "Timestamp",
  "Name",
  "Email",
  "Phone",
  "Subject",
  "Message",
  "UTM Source",
  "UTM Medium",
  "UTM Campaign",
  "Landing Page",
  "Referrer",
];

function isConfigured(): boolean {
  return !!(SPREADSHEET_ID && SERVICE_ACCOUNT_JSON);
}

function getAuth() {
  const key = JSON.parse(SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function ensureHeaderRow(
  sheets: ReturnType<typeof google.sheets>,
  sheetName: string,
  headers: string[]
): Promise<void> {
  // Read first row; if empty or missing, write headers.
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:A1`,
  });
  const firstCell = res.data.values?.[0]?.[0];
  if (!firstCell) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }
}

export async function appendTrialBookingToSheet(booking: {
  createdAt?: Date | string;
  sourcePage?: string;
  parentName: string;
  playerName: string;
  ageGroup: string;
  area: string;
  programInterest?: string | null;
  phone: string;
  whatsapp?: boolean;
  email: string;
  howHeard?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPage?: string;
  referrer?: string;
  additionalInfo?: string | null;
}): Promise<void> {
  if (!isConfigured()) {
    console.log("[Sheets] Not configured — skipping trial booking sync");
    return;
  }
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    await ensureHeaderRow(sheets, TRIAL_SHEET, TRIAL_HEADERS);

    const row = [
      booking.createdAt
        ? new Date(booking.createdAt).toISOString()
        : new Date().toISOString(),
      booking.sourcePage || "home",
      booking.parentName,
      booking.playerName,
      booking.ageGroup,
      booking.area,
      booking.programInterest || "",
      booking.phone,
      booking.whatsapp ? "Yes" : "No",
      booking.email,
      booking.howHeard || "",
      booking.utmSource || "direct",
      booking.utmMedium || "direct",
      booking.utmCampaign || "direct",
      booking.landingPage || "",
      booking.referrer || "",
      booking.additionalInfo || "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TRIAL_SHEET}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    console.log("[Sheets] Trial booking row appended");
  } catch (err) {
    console.error("[Sheets] Failed to append trial booking:", err);
  }
}

export async function appendContactEnquiryToSheet(enquiry: {
  createdAt?: Date | string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPage?: string;
  referrer?: string;
}): Promise<void> {
  if (!isConfigured()) {
    console.log("[Sheets] Not configured — skipping contact enquiry sync");
    return;
  }
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    await ensureHeaderRow(sheets, ENQUIRY_SHEET, ENQUIRY_HEADERS);

    const row = [
      enquiry.createdAt
        ? new Date(enquiry.createdAt).toISOString()
        : new Date().toISOString(),
      enquiry.name,
      enquiry.email,
      enquiry.phone,
      enquiry.subject,
      enquiry.message,
      enquiry.utmSource || "direct",
      enquiry.utmMedium || "direct",
      enquiry.utmCampaign || "direct",
      enquiry.landingPage || "",
      enquiry.referrer || "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${ENQUIRY_SHEET}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    console.log("[Sheets] Contact enquiry row appended");
  } catch (err) {
    console.error("[Sheets] Failed to append contact enquiry:", err);
  }
}
