import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { campEnquiryFormSchema, ageGroupFor } from "@shared/schema";
import { sendTrialBookingNotification, sendCustomerAutoReply } from "@/lib/email";
import { appendTrialBookingToSheet } from "@/lib/sheets";

/** Short camp enquiry: saved as a trial booking so it shows up in the admin leads, tagged with the camp page and the camp chosen. */
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

    const { website, formStartedAt, camp, gender, playerAge, ...data } = parsed.data;
    const booking = await storage.createTrialBooking({
      ...data,
      playerAge,
      ageGroup: ageGroupFor(playerAge),
      area: "",
      howHeard: "",
      programInterest: camp,
      additionalInfo: `Camp: ${camp} · ${gender}, age ${playerAge}`,
    });

    sendTrialBookingNotification(booking).catch((err) => console.error("Email notification failed for camp enquiry:", err));
    sendCustomerAutoReply({ email: booking.email, name: booking.parentName, form: "camp enquiry" });
    appendTrialBookingToSheet(booking).catch((err) => console.error("Sheets sync failed for camp enquiry:", err));

    return NextResponse.json({ id: booking.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating camp enquiry:", error);
    return NextResponse.json({ error: "Invalid enquiry data" }, { status: 400 });
  }
}
