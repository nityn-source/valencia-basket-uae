import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar } from "lucide-react";
import { cn, isPastEvent, resolveImageSrc } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { parseVimeo } from "@/lib/vimeo";
import { getVimeoInfo } from "@/lib/vimeoServer";
import { EventCardVideo } from "@/components/events/EventCardVideo";
import { campCardTags } from "@/lib/campTags";

export async function EventStrip() {
  const allEvents = await storage.getAllEvents();
  const events = allEvents.filter((e) => e.featured && !isPastEvent(e.endDate));

  if (events.length === 0) return null;

  // An event whose camp page has a Vimeo film shows the film in place of its photo.
  const films = await Promise.all(
    events.map(async (event) => {
      const video = parseVimeo(event.details?.heroVideo);
      return video ? { video, info: await getVimeoInfo(video) } : null;
    }),
  );

  return (
    <div className="w-full bg-neutral-50 border-b border-neutral-200 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-primary"></div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Upcoming Events</h2>
          </div>
          
          <Link href="/events">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors cursor-pointer group" data-testid="link-view-calendar">
              View Calendar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
        
        {/* One event gets a wide card (image beside the text); several share a row of cards. */}
        <div className={events.length === 1 ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-3 gap-6"}>
          {events.map((event, index) => {
            const wide = events.length === 1;
            const film = films[index];
            if (film) {
              // A poster card: the film as a bordered poster with an orange offset block, an orange line across the top,
              // and the details beside it. The card is not one big link here (a playable film can't sit inside a link):
              // an overlay link covers the card and the film sits above it.
              const tags = campCardTags(event.details);
              return (
                <div key={event.id} className={cn("group relative z-10 flex h-full flex-col items-center gap-7 overflow-hidden border border-t-4 border-gray-100 border-t-primary bg-[#fffdfa] p-6 pb-7 shadow-sm transition-all duration-300 hover:shadow-xl", wide ? "md:flex-row md:gap-10 md:p-8" : "")}>
                  <Link href={`/events/${event.slug}`} aria-label={`${event.title}: view details and register`} className="absolute inset-0 z-10" data-testid={`link-event-strip-${event.slug}`} />
                  <div className="relative z-20 shrink-0 pr-2.5 pb-2.5">
                    <EventCardVideo
                      video={film.video}
                      poster={film.info?.thumbnail ?? null}
                      title={film.info?.title || `${event.title}: the camp film`}
                      seconds={film.info?.duration ?? 0}
                      shape={film.info ? { width: film.info.width, height: film.info.height } : undefined}
                    />
                  </div>
                  <div className={cn("flex w-full flex-grow flex-col", wide && "md:justify-center")}>
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                      <Calendar className="h-3 w-3" /> {event.category || "Camp"} · {event.date}
                    </div>
                    <h3 className={cn("mb-2 font-black uppercase leading-tight transition-colors group-hover:text-primary", wide ? "text-2xl md:text-4xl" : "text-xl")}>{event.title}</h3>
                    {event.location && <p className="mb-1 text-sm text-gray-500">{event.location}</p>}
                    {tags.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Camp details">
                        {tags.map((tag) => (
                          <li key={tag} className="border border-gray-200 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-600">{tag}</li>
                        ))}
                      </ul>
                    )}
                    <div className={cn("mt-auto flex items-center justify-between border-t border-gray-100 pt-4", wide ? "md:mt-6 md:max-w-sm" : "mt-5")}>
                      <span className="text-xs font-bold uppercase text-gray-400 transition-colors group-hover:text-primary">{wide ? "View details and register" : "Learn More"}</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-primary group-hover:text-white">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <Link key={event.id} href={`/events/${event.slug}`} data-testid={`link-event-strip-${event.slug}`}>
                <div className={cn("block h-full group cursor-pointer bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex relative z-10", wide ? "flex-col md:flex-row" : "flex-col")}>
                  <div className={cn("relative overflow-hidden", wide ? "h-56 md:h-auto md:w-2/5 md:min-h-[240px]" : "h-48")}>
                    <div className="absolute top-3 left-3 z-10">
                      <span className={cn("px-3 py-1 text-xs font-bold uppercase tracking-wider text-white bg-primary")}>
                        {event.category || "Camp"}
                      </span>
                    </div>
                    <Image
                      src={resolveImageSrc(event.image) || "/images/mini-basket-team.jpg"}
                      alt={event.imageAlt?.trim() || event.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  </div>

                  <div className={cn("p-6 flex flex-col flex-grow", wide && "md:p-10 md:justify-center")}>
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest mb-2">
                      <Calendar className="h-3 w-3" /> {event.date}
                    </div>
                    <h3 className={cn("font-black uppercase mb-2 leading-tight group-hover:text-primary transition-colors", wide ? "text-2xl md:text-4xl" : "text-xl")}>
                      {event.title}
                    </h3>
                    {wide && event.location && <p className="text-sm text-gray-500 mb-2">{event.location}</p>}
                    <div className={cn("mt-auto pt-4 border-t border-gray-100 flex items-center justify-between", wide && "md:mt-6 md:max-w-sm")}>
                      <span className="text-xs font-bold uppercase text-gray-400 group-hover:text-primary transition-colors">{wide ? "View details and register" : "Learn More"}</span>
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
