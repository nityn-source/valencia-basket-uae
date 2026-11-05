import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { storage } from "@/lib/storage";
import RegisterClient from "./RegisterClient";
import { buildDynamicMetadata } from "@/lib/seo/resolve";
import { eventRegisterPageDefaults } from "@/lib/seo/eventSeo";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await storage.getEventBySlug(id);
  if (!event) {
    return { title: "Event Not Found" };
  }
  return buildDynamicMetadata(eventRegisterPageDefaults(event));
}

export default async function EventRegistrationPage({ params }: PageProps) {
  const { id } = await params;
  const event = await storage.getEventBySlug(id);
  // Camp pages register through the form on the event page itself.
  if (event?.details) redirect(`/events/${id}#register`);
  return <RegisterClient />;
}
