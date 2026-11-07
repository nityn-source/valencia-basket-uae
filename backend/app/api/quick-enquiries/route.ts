import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { quickEnquiryFormSchema, QUICK_FORM_SOURCE } from "@shared/schema";
import { sendTrialBookingNotification } from "@/lib/email";
import { appendTrialBookingToSheet } from "@/lib/sheets";

/** Quick enquiry strip: saved as a trial booking with only what was asked (name, number, child's age group); the team follows up on WhatsApp. */
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

    const parsed = quickEnquiryFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid enquiry data", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { website, formStartedAt, ageGroup, ...data } = parsed.data;
    const booking = await storage.createTrialBooking({
      ...data,
      email: "",
      whatsapp: true,
      playerName: "Not given",
      ageGroup,
      area: "",
      howHeard: QUICK_FORM_SOURCE,
      programInterest: null,
      additionalInfo: `Quick enquiry · age group ${ageGroup}`,
      sourcePage: "home-quick",
    });

    // No email was asked for, so there is no automatic reply; the team replies on WhatsApp.
    sendTrialBookingNotification(booking).catch((err) => console.error("Email notification failed for quick enquiry:", err));
    appendTrialBookingToSheet(booking).catch((err) => console.error("Sheets sync failed for quick enquiry:", err));

    return NextResponse.json({ id: booking.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating quick enquiry:", error);
    return NextResponse.json({ error: "Invalid enquiry data" }, { status: 400 });
  }
}
