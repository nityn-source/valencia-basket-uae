import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { campEnquiryFormSchema, ageGroupFor } from "@shared/schema";
import { sendEventRegistrationNotification, sendCustomerAutoReply } from "@/lib/email";
import { appendTrialBookingToSheet } from "@/lib/sheets";
import { EVENT_PAGE_SOURCE, leadEventSlug, leadPage } from "@/lib/leadSource";
import { renamedEventSlug } from "@/lib/eventSlugs";

/** Short camp enquiry: saved as an event registration, so it shows in Admin → Event & Camp Sign-ups with the camp chosen. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot: hidden field must be empty
    if (typeof body.website === "string" && body.website.length > 0) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }
    // Bot timing: reject forms completed in under 3 seconds
    if (typeof body.formStartedAt !== "number" || Date.now() - body.formStartedAt < 3000) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }

    const parsed = campEnquiryFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid enquiry data", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { website, formStartedAt, ...data } = parsed.data;
    // The event this page belongs to (an old, renamed address is followed). Its name is saved with the sign-up,
    // so a later rename of the event never leaves the row unlabelled.
    const slug = leadEventSlug(data);
    const event = await storage.getEventBySlug(renamedEventSlug(slug) ?? slug).catch(() => undefined);
    const registration = await storage.createEventRegistration({
      eventId: event?.id ?? "",
      eventTitle: event?.title ?? leadPage(data).replace(/^Event: /, ""),
      parentName: data.parentName,
      email: data.email,
      phone: data.phone,
      playerName: data.playerName,
      playerAge: data.playerAge,
      camp: data.camp,
      gender: data.gender,
      whatsapp: data.whatsapp,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      landingPage: data.landingPage,
      referrer: data.referrer,
      sourcePage: data.sourcePage,
    });

    sendEventRegistrationNotification(registration).catch((err) => console.error("Email notification failed for camp enquiry:", err));
    sendCustomerAutoReply({ email: registration.email, name: registration.parentName, form: "camp enquiry" });
    // The Google Sheet keeps getting a row for each camp sign-up, in the same layout as before.
    appendTrialBookingToSheet({
      createdAt: registration.createdAt,
      sourcePage: registration.sourcePage,
      parentName: registration.parentName,
      playerName: registration.playerName,
      ageGroup: ageGroupFor(registration.playerAge),
      area: "",
      programInterest: registration.camp,
      phone: registration.phone,
      whatsapp: registration.whatsapp,
      email: registration.email,
      howHeard: EVENT_PAGE_SOURCE,
      utmSource: registration.utmSource,
      utmMedium: registration.utmMedium,
      utmCampaign: registration.utmCampaign,
      landingPage: registration.landingPage,
      referrer: registration.referrer,
      additionalInfo: `Camp: ${registration.camp} · ${registration.gender}, age ${registration.playerAge} · Event: ${registration.eventTitle}`,
    }).catch((err) => console.error("Sheets sync failed for camp enquiry:", err));

    return NextResponse.json({ id: registration.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating camp enquiry:", error);
    return NextResponse.json({ error: "Invalid enquiry data" }, { status: 400 });
  }
}
