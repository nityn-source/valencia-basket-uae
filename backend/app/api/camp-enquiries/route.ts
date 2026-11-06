import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { campEnquiryFormSchema } from "@shared/schema";
import { sendEventRegistrationNotification, sendCustomerAutoReply } from "@/lib/email";
import { appendEventRegistrationToSheet } from "@/lib/sheets";
import { isRegistrationOpen } from "@/lib/campRegistration";

/** Camp page sign-up: saved as an event registration for that camp (admin: Event Registrations), with the camp chosen. */
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

    const { website, formStartedAt, camp, gender, playerAge, sourcePage, ...data } = parsed.data;

    // The source page names the event ("camp-<slug>"); the sign-up belongs to that event and only while it is open.
    const event = await storage.getEventBySlug(sourcePage.slice("camp-".length));
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (!isRegistrationOpen(event)) {
      return NextResponse.json({ error: "Registration for this camp is closed" }, { status: 400 });
    }

    const registration = await storage.createEventRegistration({
      eventId: event.id,
      eventTitle: event.title,
      parentName: data.parentName,
      email: data.email,
      phone: data.phone,
      playerName: data.playerName,
      playerAge,
      camp,
      gender,
      whatsapp: data.whatsapp,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      landingPage: data.landingPage,
      referrer: data.referrer,
      sourcePage,
    });

    sendEventRegistrationNotification({
      eventTitle: registration.eventTitle,
      parentName: registration.parentName,
      email: registration.email,
      phone: registration.phone,
      playerName: registration.playerName,
      playerAge: registration.playerAge,
      camp: registration.camp,
      gender: registration.gender,
    }).catch((err) => console.error("Email notification failed for camp registration:", err));
    sendCustomerAutoReply({ email: registration.email, name: registration.parentName, form: "camp enquiry" });
    appendEventRegistrationToSheet(registration).catch((err) => console.error("Sheets sync failed for camp registration:", err));

    return NextResponse.json({ id: registration.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating camp registration:", error);
    return NextResponse.json({ error: "Invalid enquiry data" }, { status: 400 });
  }
}
