import Image from "next/image";
import { MapPin, CalendarDays, Clock } from "lucide-react";
import type { Event } from "@shared/schema";
import type { CampDetails } from "@shared/campDetails";
import { ReelsCarousel } from "@/components/reels/ReelsCarousel";
import { reelId, type Reel } from "@/lib/reels";
import { isRegistrationOpen } from "@/lib/campRegistration";
import { CampEnquiryForm, type CampChoice } from "./CampEnquiryForm";
import { ScheduleTabs } from "./ScheduleTabs";
import { CampCountdown } from "./CampCountdown";
import { CampProgrammeCards } from "./CampProgrammeCards";
import { CampFeeCards } from "./CampFeeCards";
import { DrillTimeline } from "./DrillTimeline";
import { buildDays, campStart, compactDates } from "@/lib/campDays";

const H2 = "text-3xl md:text-5xl font-black uppercase tracking-tight leading-none mb-5";
const EYEBROW = "mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-primary";
const LEAD = "text-base md:text-lg leading-relaxed text-[#4a4339]";
const SECTION = "py-12 md:py-20";

const escapeRegex = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The week's heading without the "Week 1 Skill Lab:" lead-in, which the label above it already says. */
function weekHeading(p: { heading: string; name: string; weekLabel: string }) {
  const base = p.heading || p.name;
  const lead = new RegExp(`^\\s*${escapeRegex(`${p.weekLabel} ${p.name}`.trim())}\\s*[:\\-–]\\s*`, "i");
  return base.replace(lead, "") || base;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className={EYEBROW}>{children}</div>;
}

export function CampEventPage({ event, details }: { event: Event; details: CampDetails }) {
  const open = isRegistrationOpen(event);
  const d = details;
  const programmes = d.programmes;
  const cards = programmes.filter((p) => p.weekLabel || p.timeLines.length > 0);
  const reels: Reel[] = d.reels
    .filter((r) => reelId(r.url))
    .map((r, i) => ({ url: r.url, caption: r.caption, target: "homepage", sortOrder: i, visible: true }));
  const heroImage = d.heroImage || event.image || "";
  const whatsapp = d.whatsappUrl || "https://wa.me/971544386838";
  // "Starts in" clock: only while the camp is still ahead (the client hides it the moment it starts).
  const start = campStart(d.startDate, [...programmes.map((p) => p.dates), event.date]);
  const upcoming = open && start !== null && new Date(`${start}T00:00:00+04:00`).getTime() > Date.now() ? start : null;
  // Day tiles above each timetable, read from the programme dates and times (schedule i belongs to card i).
  const scheduleDays = d.schedules.length === cards.length ? cards.map((p) => buildDays(p.dates, p.timeLines)) : d.schedules.map(() => null);
  // The "both weeks" option comes from the Fees section's best-value row.
  const bestFee = d.fees.rows.find((r) => r.best);
  const bundle = bestFee ? { name: bestFee.name, dates: bestFee.dates, fee: bestFee.fee, note: d.fees.note } : null;
  // The camps a parent can pick in the form: each week, then both weeks.
  const choices: CampChoice[] = [
    ...cards.map((p) => ({ id: p.id, title: p.weekLabel || p.name, sub: p.weekLabel ? p.name : "", dates: compactDates(p.dates), label: [p.weekLabel, p.name].filter(Boolean).join(" ") })),
    ...(bundle ? [{ id: "both", title: "Both weeks", sub: "Best value", dates: compactDates(bundle.dates), label: bundle.name || "Both weeks" }] : []),
  ];
  // Each fee card selects a form chip: the best-value row is "both weeks", the others follow the week order.
  const weekIds = cards.map((p) => p.id);
  let weekIndex = 0;
  const feePickId = (row: { best: boolean }) => {
    if (row.best) return bundle ? "both" : null;
    return weekIds[weekIndex++] ?? null;
  };
  const ageRange = d.openFor.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
  const ages = Array.from({ length: (ageRange ? Number(ageRange[2]) : 18) - (ageRange ? Number(ageRange[1]) : 5) + 1 }, (_, i) => (ageRange ? Number(ageRange[1]) : 5) + i);


  return (
    <div className="bg-white text-[#111]">
      {/* HERO: photo first on phones; on desktop the text sits left and the photo wipes open on the right */}
      <div className="grid lg:grid-cols-[1.05fr_.95fr]">
        <div className="flex flex-col justify-center px-4 py-10 md:px-10 lg:px-16 lg:py-20">
          <Eyebrow>
            {event.location} · {event.date}
          </Eyebrow>
          <h1
            className="page-title mb-5 text-4xl font-black uppercase leading-[0.95] tracking-tighter sm:text-5xl lg:text-7xl"
            data-testid="text-event-detail-title"
          >
            {d.headline || event.title}
          </h1>
          {d.subtext && <p className={`${LEAD} max-w-xl`}>{d.subtext}</p>}
          {upcoming && (
            <div className="hero-fade" style={{ animationDelay: "0.6s" }}>
              <CampCountdown start={upcoming} />
            </div>
          )}
          <div className="hero-fade mt-6 flex flex-wrap gap-3" style={{ animationDelay: "0.75s" }}>
            {open ? (
              <a href="#register" className="bg-primary px-7 py-4 text-sm font-extrabold uppercase tracking-widest text-white hover:bg-orange-600" data-testid="link-register-now">
                {d.ctaLabel || "Register Now"}
              </a>
            ) : (
              <span className="bg-gray-200 px-7 py-4 text-sm font-extrabold uppercase tracking-widest text-gray-600" data-testid="text-registration-closed">
                Registration closed
              </span>
            )}
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="border-2 border-black px-7 py-[14px] text-sm font-extrabold uppercase tracking-widest hover:bg-black hover:text-white">
              {d.whatsappLabel || "WhatsApp Us"}
            </a>
          </div>
        </div>
        {heroImage && (
          <div className="camp-photo relative min-h-[280px] border-l-0 border-primary max-lg:order-first lg:min-h-[640px] lg:border-l-[10px]">
            <Image src={heroImage} alt={event.imageAlt?.trim() || event.title} fill priority sizes="(min-width:1024px) 48vw, 100vw" className="camp-photo-img object-cover" />
          </div>
        )}
      </div>

      {/* HIGHLIGHTS BANNER: sliding strip like the homepage trust bar (pauses on hover; still and scrollable with reduced motion) */}
      {d.strip.length > 0 && (
        <div className="bg-primary py-5 md:py-6" data-testid="camp-highlights-banner">
          <div className="marquee-container overflow-hidden">
            <div className="marquee-track flex w-max items-center hover:[animation-play-state:paused]" aria-label="Camp highlights">
              {[0, 1, 2, 3, 4, 5].map((copy) => (
                <div key={copy} className={copy === 0 ? "contents" : "marquee-duplicate contents"} aria-hidden={copy === 0 ? undefined : true}>
                  {d.strip.map((item) => (
                    <div key={`${copy}-${item}`} className="group flex items-center gap-3 px-8 md:px-12">
                      <span aria-hidden="true" className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-black/20 transition-colors group-hover:bg-black">
                        <span className="h-[7px] w-[7px] rounded-full bg-white" />
                      </span>
                      <span className="whitespace-nowrap text-sm font-bold uppercase tracking-wider text-white">{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROGRAMME CARDS: a vertical stack that builds as you scroll, ending with the best-value both-weeks option */}
      {cards.length > 0 && (
        <CampProgrammeCards
          cards={cards.map((p) => ({ id: p.id, weekLabel: p.weekLabel, name: p.name, tagline: p.tagline, venue: p.venue, dates: p.dates, timeLines: p.timeLines, fee: p.fee }))}
          bundle={bundle}
          openFor={d.openFor}
          registerOpen={open}
        />
      )}

      {/* INTRO */}
      {(d.introTitle || d.introText) && (
        <section className={`${SECTION} mt-8 bg-[#f6f1e8]`}>
          <div className="px-4 md:px-10 lg:px-16">
            {d.introTitle && <h2 className={H2}>{d.introTitle}</h2>}
            {d.introText && <p className={`${LEAD} max-w-3xl`}>{d.introText}</p>}
          </div>
        </section>
      )}

      {/* PROGRAMME DETAILS: each week's drills as a timeline that fills as you scroll; the week title stays pinned beside it on desktop */}
      {programmes
        .filter((p) => p.bullets.length > 0)
        .map((p, i) => (
          <section key={p.id} className={`${SECTION} ${i % 2 === 0 ? "" : "bg-[#f6f1e8]"}`}>
            <div className="grid gap-8 px-4 md:px-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16 lg:px-16">
              <div className="relative lg:sticky lg:top-28 lg:self-start">
                <span aria-hidden="true" className="pointer-events-none absolute -top-10 right-0 hidden select-none text-[190px] font-black leading-none text-primary opacity-[0.08] lg:block">{i + 1}</span>
                {p.weekLabel && <Eyebrow>{p.weekLabel} · {p.name}</Eyebrow>}
                <h2 className="mb-4 text-3xl font-black uppercase leading-[1.02] md:text-5xl">{weekHeading(p)}</h2>
                {p.intro && <p className={`${LEAD} max-w-md`}>{p.intro}</p>}
              </div>
              <DrillTimeline drills={p.bullets} />
            </div>
          </section>
        ))}

      {/* FEES */}
      {d.fees.rows.length > 0 && (
        <section className={`${SECTION} bg-[#f6f1e8]`}>
          <div className="px-4 md:px-10 lg:px-16">
            <h2 className={H2}>{d.fees.title || "Camp Fees"}</h2>
            <CampFeeCards
              clickable={open}
              rows={d.fees.rows.map((row) => ({ ...row, pickId: feePickId(row) }))}
            />
            {d.fees.note && <p className="mt-5 text-lg font-extrabold">{d.fees.note}</p>}
          </div>
        </section>
      )}

      {/* SCHEDULE */}
      {d.schedules.length > 0 && (
        <section className={SECTION}>
          <div className="px-4 md:px-10 lg:px-16">
            <h2 className={H2}>{d.scheduleTitle || "Schedule"}</h2>
            <ScheduleTabs schedules={d.schedules} days={scheduleDays} />
          </div>
        </section>
      )}

      {/* COACHES */}
      {d.coaches.length > 0 && (
        <section className={`${SECTION} bg-[#f6f1e8]`}>
          <div className="px-4 md:px-10 lg:px-16">
            <h2 className={H2}>{d.coachesTitle || "Your coaches"}</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {d.coaches.map((c) => (
                <div key={c.name} className="flex items-center gap-5 border-2 border-[#e8e2d6] bg-white p-5">
                  {c.photo ? (
                    <Image src={c.photo} alt={c.name} width={104} height={104} className="h-[104px] w-[104px] shrink-0 rounded-full object-cover object-top" />
                  ) : (
                    <div className="h-[104px] w-[104px] shrink-0 rounded-full bg-gray-200" aria-hidden="true" />
                  )}
                  <div>
                    <h3 className="mb-1 text-xl font-black uppercase leading-tight md:text-2xl">{c.name}</h3>
                    {c.title && <p className="mb-1 text-sm text-[#5b5348]">{c.title}</p>}
                    {c.credential && <p className="text-sm font-bold text-[#c85a0c]">{c.credential}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* REELS */}
      {reels.length > 0 && (
        <div>
          <ReelsCarousel reels={reels} eyebrow="Highlights" title={d.reelsTitle || "Highlights"} text={d.reelsText} followLabel="Follow us on Instagram" watchLabel="Watch on Instagram" />
          {d.facebookReelUrl && (
            <div className="bg-[#16130F] pb-10 text-center">
              <a href={d.facebookReelUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold uppercase tracking-widest text-[#E8722C] underline underline-offset-4">
                Watch more on Facebook
              </a>
            </div>
          )}
        </div>
      )}

      {/* WHY */}
      {d.why.length > 0 && (
        <section className={`${SECTION} bg-[#f6f1e8]`}>
          <div className="px-4 md:px-10 lg:px-16">
            <h2 className={H2}>{d.whyTitle || "What makes this camp different"}</h2>
            <ol className="max-w-3xl">
              {d.why.map((item, i) => (
                <li key={item} className="flex items-baseline gap-5 border-b border-[#e0d8c6] py-5 text-base font-bold md:text-lg">
                  <span className="min-w-[34px] text-2xl font-black text-primary">{String(i + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* GROUPS */}
      {(d.groupsTitle || d.groupsText.length > 0) && (
        <section className={SECTION}>
          <div className="grid items-center gap-10 px-4 md:px-10 lg:grid-cols-2 lg:gap-14 lg:px-16">
            {d.groupsImage && (
              <div className="relative aspect-[4/3]">
                <Image src={d.groupsImage} alt="" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
              </div>
            )}
            <div className={d.groupsImage ? "" : "lg:col-span-2 max-w-3xl"}>
              {d.groupsTitle && <h2 className={`${H2} md:text-4xl`}>{d.groupsTitle}</h2>}
              {d.groupsText.map((para) => (
                <p key={para.slice(0, 30)} className={`${LEAD} mb-4`}>{para}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LEAVES WITH */}
      {d.leaves.length > 0 && (
        <section className={`${SECTION} bg-[#f6f1e8]`}>
          <div className="px-4 md:px-10 lg:px-16">
            <h2 className={H2}>{d.leaveTitle || "Every camper leaves with"}</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {d.leaves.map((l) => (
                <div key={l.title} className="border-2 border-black bg-white p-6">
                  {l.icon && <div aria-hidden="true" className="mb-2 text-4xl">{l.icon}</div>}
                  <b className="text-lg">{l.title}</b>
                  {l.text && <p className="mt-1.5 text-[#5b5348]">{l.text}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SYSTEM */}
      {d.system.length > 0 && (
        <section className={SECTION}>
          <div className="px-4 md:px-10 lg:px-16">
            <h2 className={H2}>{d.systemTitle || "Train like a Valencia player"}</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {d.system.map((s) => (
                <div key={s.title} className="border-t-[5px] border-primary pt-4 leading-relaxed text-[#4a4339]">
                  <b className="mb-1.5 block text-lg text-black">{s.title}</b>
                  {s.text}
                </div>
              ))}
            </div>
            {d.motto && (
              <p className="mt-9 text-2xl font-black uppercase tracking-tight text-primary md:text-4xl">
                {d.motto}
                {d.mottoSub && <span className="mt-1.5 block text-[13px] font-bold tracking-[0.14em] text-[#6b6258]">{d.mottoSub}</span>}
              </p>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      {d.faqs.length > 0 && (
        <section className={SECTION}>
          <div className="mx-auto max-w-4xl px-4 md:px-10">
            <h2 className={H2}>{d.faqTitle || "Frequently asked questions"}</h2>
            {d.faqs.map((f, i) => (
              <details key={f.question} className="group border-b border-[#e8e2d6]" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-extrabold md:text-lg [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <span aria-hidden="true" className="text-2xl leading-none text-primary group-open:hidden">+</span>
                  <span aria-hidden="true" className="hidden text-2xl leading-none text-primary group-open:inline">–</span>
                </summary>
                <p className="max-w-3xl pb-5 leading-relaxed text-[#4a4339]">{f.answer}</p>
              </details>
            ))}
            {(d.phone || d.email) && (
              <div className="mt-12">
                <h3 className="mb-3 text-2xl font-black uppercase">{d.contactTitle || "Still have questions?"}</h3>
                <div className="flex flex-wrap gap-x-8 gap-y-3 text-lg font-extrabold">
                  {d.phone && <a href={`tel:${d.phone.replace(/[^+\d]/g, "")}`} className="border-b-[3px] border-primary">{d.phone}</a>}
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="border-b-[3px] border-primary">WhatsApp</a>
                  {d.email && <a href={`mailto:${d.email}`} className="border-b-[3px] border-primary">{d.email}</a>}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* REGISTER: the enquiry form closes the page; every Register Now button points here.
          A short one-screen form (with a WhatsApp shortcut); desktop adds a sticky summary of the camp beside it. */}
      <section id="register" className={`${SECTION} scroll-mt-20 bg-[#f6f1e8]`}>
        <div className="px-4 md:px-10 lg:px-16">
          {open ? (
            <div className="mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <CampEnquiryForm
                slug={event.slug}
                eventTitle={event.title}
                heading={d.formTitle || "Claim your spot"}
                choices={choices}
                ages={ages}
                whatsappUrl={whatsapp}
              />
              <aside className="hidden bg-[#111] p-7 text-white lg:sticky lg:top-28 lg:block" aria-label="Camp summary">
                <Eyebrow>{event.location}</Eyebrow>
                <h3 className="mb-5 text-2xl font-black uppercase leading-tight">{event.title}</h3>
                <div className="space-y-5">
                  {programmes.filter((p) => p.dates || p.fee).map((p) => (
                    <div key={p.id} className="border-t border-white/15 pt-4">
                      <div className="text-xs font-extrabold uppercase tracking-widest text-primary">{p.weekLabel || p.name}</div>
                      {p.weekLabel && <div className="font-bold">{p.name}</div>}
                      {p.dates && <div className="mt-1 flex gap-2 text-sm text-[#cfc7ba]"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{p.dates}</div>}
                      {p.fee && <div className="mt-1 text-xl font-black">{p.fee}</div>}
                    </div>
                  ))}
                </div>
                {cards[0]?.venue && <div className="mt-5 flex gap-2 border-t border-white/15 pt-4 text-sm text-[#cfc7ba]"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{cards[0].venue}</div>}
              </aside>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl bg-[#111] p-7 text-white md:p-12">
              <Eyebrow>{event.title}</Eyebrow>
              <h2 className="mb-3 text-3xl font-black uppercase leading-none md:text-4xl">{d.formTitle || "Claim your spot"}</h2>
              <p className="text-[#cfc7ba]" data-testid="text-registration-closed-note">
                Registration for this camp is now closed.{" "}
                <a href={whatsapp} className="font-bold text-primary underline" target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a> and we’ll let you know about the next one.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Mobile register bar (kept clear of the WhatsApp button on the right) */}
      {open && (
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 bg-primary py-3 pl-4 pr-24 text-sm font-black uppercase text-white md:hidden">
          <span>
            {upcoming && <CampCountdown start={upcoming} variant="bar" />}
            {event.price || "Winter Camp"}
          </span>
          <a href="#register" className="whitespace-nowrap bg-black px-4 py-3 text-xs tracking-widest">{d.ctaLabel || "Register Now"}</a>
        </div>
      )}
    </div>
  );
}
