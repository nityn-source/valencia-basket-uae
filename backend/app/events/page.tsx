import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { storage } from "@/lib/storage";
import { isPastEvent, resolveImageSrc } from "@/lib/utils";
import type { Event } from "@shared/schema";
import { buildPageMetadata } from "@/lib/seo/resolve";
import { getStructuredData } from "@/lib/seo/structuredDataResolve";
import { StructuredData } from "@/components/seo/StructuredData";
import { getContentGetter } from "@/lib/content/pageContent";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/events");
}

function EventCard({ event, past = false, buttonLabel, completedLabel }: { event: Event; past?: boolean; buttonLabel: string; completedLabel: string }) {
  return (
    <Link href={`/events/${event.slug}`} data-testid={`link-event-${event.slug}`}>
      <div className={`flex flex-col md:flex-row bg-white border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-shadow duration-300 cursor-pointer ${past ? "opacity-80" : ""}`}>
          <div className="md:w-1/3 aspect-video md:aspect-auto relative overflow-hidden">
              <Image 
                  src={resolveImageSrc(event.image) || "/images/mini-basket-team.jpg"}
                  alt={event.imageAlt?.trim() || event.title} 
                  fill
                  className={`object-cover transition-transform duration-700 group-hover:scale-110 ${past ? "grayscale" : ""}`}
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 text-xs font-bold uppercase tracking-widest text-black">
                  {past ? completedLabel : event.status}
              </div>
          </div>
          <div className="p-8 md:w-2/3 flex flex-col justify-center items-start">
              <h2 className="text-3xl font-black uppercase mb-4 group-hover:text-primary transition-colors" data-testid={`text-event-title-${event.slug}`}>{event.title}</h2>
              
              <div className="flex flex-wrap gap-4 md:gap-8 mb-6 text-sm font-medium text-gray-500">
                  <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" /> {event.date}
                  </div>
                  <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> {event.time}
                  </div>
                  <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" /> {event.location}
                  </div>
                  {!past && event.price && (
                    <div className="flex items-center gap-2 font-bold text-primary">
                        {event.price}
                    </div>
                  )}
              </div>

              <p className="text-gray-600 mb-8 max-w-2xl text-lg">
                  {event.description}
              </p>

              <Button disabled={event.status === "Sold Out"} variant={past ? "outline" : "default"} className="uppercase font-bold tracking-wider rounded-none px-8" data-testid={`button-view-event-${event.slug}`}>
                  {buttonLabel}
              </Button>
          </div>
      </div>
    </Link>
  );
}

export default async function Events() {
  const events = await storage.getAllEvents();
  const schema = await getStructuredData("/events", "Events");
  const c = await getContentGetter();

  const upcoming = events.filter((e) => !isPastEvent(e.endDate));
  const past = events
    .filter((e) => isPastEvent(e.endDate))
    .sort((a, b) => (b.endDate ?? "").localeCompare(a.endDate ?? ""));

  return (
    <>
      <StructuredData data={schema} />
      <div className="bg-black text-white py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">{c("events.hero.title")}</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {c("events.intro")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20">
        {upcoming.length > 0 ? (
          <div className="space-y-12">
              {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} buttonLabel={c("events.card.button")} completedLabel={c("events.card.completed")} />
              ))}
          </div>
        ) : (
          <p className="text-center text-lg text-gray-500" data-testid="text-no-upcoming-events">
            {c("events.no-upcoming")}
          </p>
        )}

        {past.length > 0 && (
          <div className="mt-24">
            <div className="flex items-center gap-3 mb-12">
              <div className="h-8 w-1 bg-gray-300"></div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-500">{c("events.past.heading")}</h2>
            </div>
            <div className="space-y-12">
                {past.map((event) => (
                    <EventCard key={event.id} event={event} past buttonLabel={c("events.card.button")} completedLabel={c("events.card.completed")} />
                ))}
            </div>
          </div>
        )}

        <div className="mt-20 p-12 bg-primary text-white text-center">
            <h2 className="text-3xl font-black uppercase mb-4">{c("events.clinic.title")}</h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                {c("events.clinic.text")}
            </p>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary uppercase font-bold tracking-wider rounded-none px-8" data-testid="button-contact-clinic">
                {c("events.clinic.button")}
            </Button>
        </div>
      </div>
    </>
  );
}
