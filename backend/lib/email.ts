import nodemailer from "nodemailer";
import { buildAutoReply } from "@/lib/emailTemplates/autoReply";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getNotificationEmail() {
  return process.env.NOTIFICATION_EMAIL || "";
}

function getFromEmail() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@valenciabasketuae.com";
}

/** Escape user-supplied values before interpolating into HTML email templates. */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS && getNotificationEmail());
}

export async function sendTrialBookingNotification(booking: {
  parentName: string;
  email: string;
  phone: string;
  whatsapp?: boolean;
  playerName: string;
  ageGroup: string;
  area: string;
  programInterest?: string | null;
  howHeard?: string;
  additionalInfo?: string | null;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}) {
  if (!isEmailConfigured()) {
    console.log("Email not configured — skipping trial booking notification");
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #FF6C0E; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Trial Booking</h1>
      </div>
      <div style="padding: 24px; background: #f9f9f9;">
        <h2 style="color: #333; margin-top: 0;">Booking Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee; width: 40%;">Parent Name</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${esc(booking.parentName)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Email</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;"><a href="mailto:${esc(booking.email)}">${esc(booking.email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Phone</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;"><a href="tel:${esc(booking.phone)}">${esc(booking.phone)}</a>${booking.whatsapp ? " (on WhatsApp)" : ""}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Child's Name</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${esc(booking.playerName)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Age Group</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${esc(booking.ageGroup)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Area</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${esc(booking.area)}</td>
          </tr>
          ${booking.programInterest ? `
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Current Level</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${esc(booking.programInterest)}</td>
          </tr>
          ` : ""}
          ${booking.howHeard ? `
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Heard About Us Via</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${esc(booking.howHeard)}</td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Source</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${esc(booking.utmSource || "direct")} / ${esc(booking.utmMedium || "direct")} / ${esc(booking.utmCampaign || "direct")}</td>
          </tr>
          ${booking.additionalInfo ? `
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Additional Info</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${esc(booking.additionalInfo)}</td>
          </tr>
          ` : ""}
        </table>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">This is an automated notification from Valencia Basket UAE.</p>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: `"Valencia Basket UAE" <${getFromEmail()}>`,
      to: getNotificationEmail(),
      subject: `New Trial Booking: ${esc(booking.playerName)} (${esc(booking.ageGroup)})`,
      html,
    });
    console.log("Trial booking notification email sent successfully");
  } catch (error) {
    console.error("Failed to send trial booking notification email:", error);
  }
}

export async function sendContactEnquiryNotification(enquiry: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}) {
  if (!isEmailConfigured()) {
    console.log("Email not configured — skipping contact enquiry notification");
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #FF6C0E; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New General Enquiry</h1>
      </div>
      <div style="padding: 24px; background: #f9f9f9;">
        <h2 style="color: #333; margin-top: 0;">Enquiry Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee; width: 40%;">Name</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${esc(enquiry.name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Email</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;"><a href="mailto:${esc(enquiry.email)}">${esc(enquiry.email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Phone</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;"><a href="tel:${esc(enquiry.phone)}">${esc(enquiry.phone)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Subject</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #FF6C0E;">${esc(enquiry.subject)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Message</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${esc(enquiry.message)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Source</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${esc(enquiry.utmSource || "direct")} / ${esc(enquiry.utmMedium || "direct")} / ${esc(enquiry.utmCampaign || "direct")}</td>
          </tr>
        </table>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">This is an automated notification from Valencia Basket UAE.</p>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: `"Valencia Basket UAE" <${getFromEmail()}>`,
      to: getNotificationEmail(),
      subject: `New General Enquiry: ${esc(enquiry.subject)} — ${esc(enquiry.name)}`,
      html,
    });
    console.log("Contact enquiry notification email sent successfully");
  } catch (error) {
    console.error("Failed to send contact enquiry notification email:", error);
  }
}

export async function sendEventRegistrationNotification(registration: {
  eventTitle: string;
  parentName: string;
  email: string;
  phone: string;
  playerName: string;
  playerAge: number;
}) {
  if (!isEmailConfigured()) {
    console.log("Email not configured — skipping event registration notification");
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #FF6C0E; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Event Registration</h1>
      </div>
      <div style="padding: 24px; background: #f9f9f9;">
        <h2 style="color: #333; margin-top: 0;">Registration Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee; width: 40%;">Event</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #FF6C0E;">${esc(registration.eventTitle)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Parent Name</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${esc(registration.parentName)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Email</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;"><a href="mailto:${esc(registration.email)}">${esc(registration.email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Phone</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;"><a href="tel:${esc(registration.phone)}">${esc(registration.phone)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Player Name</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${esc(registration.playerName)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Player Age</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${esc(registration.playerAge)}</td>
          </tr>
        </table>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">This is an automated notification from Valencia Basket UAE.</p>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: `"Valencia Basket UAE" <${getFromEmail()}>`,
      to: getNotificationEmail(),
      subject: `New Event Registration: ${esc(registration.playerName)} — ${esc(registration.eventTitle)}`,
      html,
    });
    console.log("Event registration notification email sent successfully");
  } catch (error) {
    console.error("Failed to send event registration notification email:", error);
  }
}

// ---- Automatic reply to the person who submitted a form ----

/** Off until AUTO_REPLY_ENABLED=true is set in Railway, so it can be tested before going live. */
export function isAutoReplyEnabled(): boolean {
  return process.env.AUTO_REPLY_ENABLED === "true" && !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** At most one auto-reply per address per 10 minutes, so the form can't be used to spam someone. */
const recentAutoReplies = new Map<string, number>();
const AUTO_REPLY_COOLDOWN_MS = 10 * 60 * 1000;

export function shouldSendAutoReply(email: string, now = Date.now()): boolean {
  const key = email.trim().toLowerCase();
  for (const [address, sentAt] of recentAutoReplies) {
    if (now - sentAt > AUTO_REPLY_COOLDOWN_MS) recentAutoReplies.delete(address);
  }
  if (recentAutoReplies.has(key)) return false;
  recentAutoReplies.set(key, now);
  return true;
}

/**
 * Sends the shared "thanks, we've got your message" email (see
 * lib/emailTemplates/autoReply.ts). Never throws: a failed auto-reply must not
 * affect the submission, the team notification or the Google Sheet.
 */
export async function sendCustomerAutoReply(recipient: { email: string; name: string | null | undefined; form: string }): Promise<void> {
  if (!isAutoReplyEnabled()) return;
  if (!shouldSendAutoReply(recipient.email)) {
    console.log(`[AutoReply] Skipped (${recipient.form}): already replied to this address in the last 10 minutes`);
    return;
  }
  const { subject, html, text } = buildAutoReply(recipient.name);
  try {
    await getTransporter().sendMail({
      from: `"Valencia Basket Academy UAE" <${getFromEmail()}>`,
      to: recipient.email,
      replyTo: getFromEmail(),
      subject,
      html,
      text,
      // Marks it as automatic, so other auto-responders don't reply back (RFC 3834).
      headers: { "Auto-Submitted": "auto-replied", "X-Auto-Response-Suppress": "All" },
    });
    console.log(`[AutoReply] Sent (${recipient.form})`);
  } catch (error) {
    console.error(`[AutoReply] Failed to send (${recipient.form}):`, error);
  }
}
