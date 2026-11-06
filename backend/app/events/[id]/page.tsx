import { storage } from "@/lib/storage";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { isPastEvent } from "@/lib/utils";
import { isRegistrationOpen } from "@/lib/campRegistration";
import { buildDynamicMetadata } from "@/lib/seo/resolve";
import { eventPageDefaults } from "@/lib/seo/eventSeo";
import { getStructuredData } from "@/lib/seo/structuredDataResolve";
import { StructuredData } from "@/components/seo/StructuredData";
import { CampEventPage } from "@/components/events/CampEventPage";
import { renamedEventSlug } from "@/lib/eventSlugs";

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
  return buildDynamicMetadata(eventPageDefaults(event));
}

export default async function EventDetail({ params }: PageProps) {
  const { id } = await params;
  const event = await storage.getEventBySlug(id);

  if (!event) {
    // An old address of a renamed event goes to the new one (only when the new page exists).
    const renamed = renamedEventSlug(id);
    if (renamed && (await storage.getEventBySlug(renamed))) permanentRedirect(`/events/${renamed}`);
    notFound();
  }

  const eventEnded = isPastEvent(event.endDate);
  const registrationClosed = eventEnded || !isRegistrationOpen(event);
  const schema = await getStructuredData(`/events/${event.slug}`, event.title);

  if (event.details) {
    return (
      <>
        <StructuredData data={schema} />
        <CampEventPage event={event} details={event.details} />
      </>
    );
  }

  return (
    <>
      <StructuredData data={schema} />
      <div className="bg-[#FF6C0E] text-white py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="inline-block px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-widest mb-6">
             {event.status}
          </div>
          <h1 className="page-title text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6" data-testid="text-event-detail-title">{event.title}</h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-white/90 font-bold uppercase tracking-widest text-sm">
            <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> {event.date}</div>
            <div className="flex items-center gap-2"><Clock className="h-5 w-5" /> {event.time}</div>
            <div className="flex items-center gap-2"><MapPin className="h-5 w-5" /> {event.location}</div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-12">
            <section>
               {event.image && (
                 <div className="relative w-full h-[400px] mb-8">
                   <Image src={event.image} alt={event.imageAlt?.trim() || event.title} fill className="object-cover shadow-xl" />
                 </div>
               )}
               <h2 className="text-3xl font-black uppercase mb-4">Event Overview</h2>
               <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line" data-testid="text-event-description">{event.description}</p>
            </section>
          </div>

          <div className="space-y-8">
             <div className="bg-black text-white p-8 sticky top-24">
                <h3 className="text-2xl font-black uppercase mb-2">{eventEnded ? "Event Completed" : registrationClosed ? "Registration Closed" : "Secure Your Spot"}</h3>
                <p className="text-gray-400 text-sm mb-6">{eventEnded ? "This event has ended. Registration is closed." : registrationClosed ? "Registration for this event is now closed." : "Limited availability, register now."}</p>
                <div className="space-y-4 mb-8">
                   <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-sm uppercase tracking-wider text-gray-400">Date</span>
                      <span className="font-bold" data-testid="text-event-sidebar-date">{event.date}</span>
                   </div>
                   <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-sm uppercase tracking-wider text-gray-400">Location</span>
                      <span className="font-bold text-right" data-testid="text-event-sidebar-location">{event.location}</span>
                   </div>
                   {event.price && (
                     <div className="flex justify-between border-b border-gray-800 pb-2">
                        <span className="text-sm uppercase tracking-wider text-gray-400">Price</span>
                        <span className="font-bold text-primary text-xl" data-testid="text-event-sidebar-price">{event.price}</span>
                     </div>
                   )}
                   <div className="flex justify-between border-b border-gray-800 pb-2">
                      <span className="text-sm uppercase tracking-wider text-gray-400">Status</span>
                      <span className="font-bold" data-testid="text-event-sidebar-status">{event.status}</span>
                   </div>
                </div>
                {registrationClosed ? (
                  <Button size="lg" disabled className="w-full bg-gray-700 text-gray-400 uppercase font-bold tracking-wider rounded-none h-14 cursor-not-allowed hover:bg-gray-700 disabled:opacity-100" data-testid="button-register-now">
                    {eventEnded ? "Event Completed" : "Registration Closed"}
                  </Button>
                ) : (
                  <Link href={`/events/${id}/register`} data-testid="link-register-now">
                    <Button size="lg" className="w-full bg-[#FF6C0E] hover:bg-[#ff8534] text-white uppercase font-bold tracking-wider rounded-none h-14" data-testid="button-register-now">
                      Register Now
                    </Button>
                  </Link>
                )}
             </div>
          </div>

        </div>
      </div>
    </>
  );
}
