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
import { parseVimeo, type VimeoVideo } from "@/lib/vimeo";
import { getVimeoInfo, type VimeoInfo } from "@/lib/vimeoServer";
import { EventCardVideo } from "@/components/events/EventCardVideo";
import { campCardTags } from "@/lib/campTags";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/events");
}

type Film = { video: VimeoVideo; info: VimeoInfo | null };

function EventCard({ event, past = false, buttonLabel, completedLabel, film }: { event: Event; past?: boolean; buttonLabel: string; completedLabel: string; film?: Film | null }) {
  if (film) {
    // A poster card: the film as a bordered poster with an orange offset block, an orange line across the top, and the
    // details beside it. The card is not one big link here (a playable film can't sit inside a link): an overlay link
    // covers it and the film sits above.
    const tags = campCardTags(event.details);
    return (
      <div className={`group relative flex flex-col items-center gap-8 overflow-hidden border border-t-4 border-gray-100 border-t-primary bg-[#fffdfa] p-6 pb-8 shadow-sm transition-shadow duration-300 hover:shadow-xl md:flex-row md:gap-10 md:p-8 ${past ? "opacity-80" : ""}`}>
        <Link href={`/events/${event.slug}`} aria-label={`${event.title}: ${buttonLabel}`} className="absolute inset-0 z-10" data-testid={`link-event-${event.slug}`} />
        <div className="relative z-20 shrink-0 pb-2.5 pr-2.5">
          <EventCardVideo
            video={film.video}
            poster={film.info?.thumbnail ?? null}
            title={film.info?.title || `${event.title}: the camp film`}
            seconds={film.info?.duration ?? 0}
            shape={film.info ? { width: film.info.width, height: film.info.height } : undefined}
          />
        </div>
        <div className="flex w-full flex-col items-start justify-center">
          <span className="mb-3 bg-primary px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">{past ? completedLabel : event.status}</span>
          <h2 className="mb-4 text-3xl font-black uppercase transition-colors group-hover:text-primary" data-testid={`text-event-title-${event.slug}`}>{event.title}</h2>
          <div className="mb-4 flex flex-wrap gap-4 text-sm font-medium text-gray-500 md:gap-8">
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> {event.date}</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {event.time}</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {event.location}</div>
          </div>
          {tags.length > 0 && (
            <ul className="mb-4 flex flex-wrap gap-1.5" aria-label="Camp details">
              {tags.map((tag) => (
                <li key={tag} className="border border-gray-200 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-600">{tag}</li>
              ))}
            </ul>
          )}
          <p className="mb-8 max-w-2xl text-lg text-gray-600">{event.description}</p>
          <Button disabled={event.status === "Sold Out"} variant={past ? "outline" : "default"} className="rounded-none px-8 font-bold uppercase tracking-wider" data-testid={`button-view-event-${event.slug}`} tabIndex={-1}>
            {buttonLabel}
          </Button>
        </div>
      </div>
    );
  }
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

  // Events whose camp page has a Vimeo film show the film on their card.
  const films = new Map<string, Film | null>(
    await Promise.all(
      events.map(async (event): Promise<[string, Film | null]> => {
        const video = parseVimeo(event.details?.heroVideo);
        return [event.id, video ? { video, info: await getVimeoInfo(video) } : null];
      }),
    ),
  );

  const upcoming = events.filter((e) => !isPastEvent(e.endDate));
  const past = events
    .filter((e) => isPastEvent(e.endDate))
    .sort((a, b) => (b.endDate ?? "").localeCompare(a.endDate ?? ""));

  return (
    <>
      <StructuredData data={schema} />
      <div className="bg-black text-white py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="page-title text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">{c("events.hero.title")}</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {c("events.intro")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-20">
        {upcoming.length > 0 ? (
          <div className="space-y-12">
              {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} film={films.get(event.id)} buttonLabel={c("events.card.button")} completedLabel={c("events.card.completed")} />
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
                    <EventCard key={event.id} event={event} past film={films.get(event.id)} buttonLabel={c("events.card.button")} completedLabel={c("events.card.completed")} />
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
