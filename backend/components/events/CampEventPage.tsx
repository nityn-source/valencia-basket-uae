import Image from "next/image";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import type { Event } from "@shared/schema";
import type { CampDetails } from "@shared/campDetails";
import { ReelsCarousel } from "@/components/reels/ReelsCarousel";
import { reelId, type Reel } from "@/lib/reels";
import { classcardLink, isRegistrationOpen } from "@/lib/campRegistration";
import { CampRegisterForm } from "./CampRegisterForm";
import { ScheduleTabs } from "./ScheduleTabs";

const H2 = "text-3xl md:text-5xl font-black uppercase tracking-tight leading-none mb-5";
const EYEBROW = "mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-primary";
const LEAD = "text-base md:text-lg leading-relaxed text-[#4a4339]";
const SECTION = "py-12 md:py-20";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className={EYEBROW}>{children}</div>;
}

export function CampEventPage({ event, details }: { event: Event; details: CampDetails }) {
  const open = isRegistrationOpen(event);
  const d = details;
  const programmes = d.programmes;
  const cards = programmes.filter((p) => p.weekLabel || p.timeLines.length > 0);
  const options = programmes
    .filter((p) => p.classcardUrl)
    .map((p) => ({ id: p.id, label: p.optionLabel, url: classcardLink(p.classcardUrl, event.slug, p.id) }));
  const reels: Reel[] = d.reels
    .filter((r) => reelId(r.url))
    .map((r, i) => ({ url: r.url, caption: r.caption, target: "homepage", sortOrder: i, visible: true }));
  const heroImage = d.heroImage || event.image || "";
  const whatsapp = d.whatsappUrl || "https://wa.me/971544386838";

  return (
    <div className="bg-white text-[#111]">
      {/* HERO */}
      <div className="grid lg:grid-cols-[1.05fr_.95fr]">
        <div className="flex flex-col justify-center px-4 py-10 md:px-10 lg:px-16 lg:py-20">
          <Eyebrow>
            {event.location} · {event.date}
          </Eyebrow>
          <h1
            className="mb-5 text-4xl font-black uppercase leading-[0.95] tracking-tighter sm:text-5xl lg:text-7xl"
            data-testid="text-event-detail-title"
          >
            {d.headline || event.title}
          </h1>
          {d.subtext && <p className={`${LEAD} max-w-xl`}>{d.subtext}</p>}
          {d.strip.length > 0 && (
            <ul className="my-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-extrabold uppercase tracking-wider">
              {d.strip.map((item, i) => (
                <li key={item} className="flex items-center gap-4">
                  {item}
                  {i < d.strip.length - 1 && <span aria-hidden="true" className="text-primary">●</span>}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-3">
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
          <div className="relative min-h-[260px] border-l-0 border-primary lg:min-h-[640px] lg:border-l-[10px]">
            <Image src={heroImage} alt={event.imageAlt?.trim() || event.title} fill priority sizes="(min-width:1024px) 48vw, 100vw" className="object-cover" />
          </div>
        )}
      </div>

      {/* PROGRAMME CARDS */}
      {cards.length > 0 && (
        <section className="px-4 pb-4 pt-12 md:px-10 lg:px-16">
          <div className="grid gap-5 md:grid-cols-2">
            {cards.map((p, i) => (
              <div key={p.id} className="relative overflow-hidden border-2 border-black bg-white p-7 md:p-8">
                <span aria-hidden="true" className="absolute -top-8 right-3 text-[150px] font-black leading-none text-primary opacity-10">{i + 1}</span>
                {p.weekLabel && <Eyebrow>{p.weekLabel}</Eyebrow>}
                <h2 className="mb-2 text-4xl font-black uppercase leading-none">{p.name}</h2>
                {p.tagline && <p className="text-base text-[#4a4339]">{p.tagline}</p>}
                <div className="my-4 space-y-1.5 text-[15px] font-bold">
                  {p.venue && <div className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{p.venue}</div>}
                  {p.dates && <div className="flex gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{p.dates}</div>}
                  {p.timeLines.map((line) => (
                    <div key={line} className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{line}</div>
                  ))}
                </div>
                {p.fee && <span className="text-2xl font-black text-primary">{p.fee}</span>}
              </div>
            ))}
          </div>
          {d.openFor && <p className="mt-5 text-sm font-extrabold uppercase tracking-widest">{d.openFor}</p>}
        </section>
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

      {/* PROGRAMME DETAILS */}
      {programmes.some((p) => p.bullets.length > 0) && (
        <section className={SECTION}>
          <div className="grid gap-14 px-4 md:px-10 lg:grid-cols-2 lg:gap-16 lg:px-16">
            {programmes
              .filter((p) => p.bullets.length > 0)
              .map((p) => (
                <div key={p.id}>
                  {p.weekLabel && <Eyebrow>{p.weekLabel} · {p.name}</Eyebrow>}
                  <h2 className="mb-4 text-2xl font-black uppercase leading-tight md:text-4xl">{p.heading || p.name}</h2>
                  {p.intro && <p className={`${LEAD} mb-3`}>{p.intro}</p>}
                  <ul>
                    {p.bullets.map((b) => (
                      <li key={b.title} className="relative border-b border-[#e8e2d6] py-4 pl-10">
                        <span aria-hidden="true" className="absolute left-0 top-[18px] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">✓</span>
                        <strong className="block text-[17px]">{b.title}</strong>
                        {b.text && <span className="text-[15px] text-[#5b5348]">{b.text}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* FEES */}
      {d.fees.rows.length > 0 && (
        <section className={`${SECTION} bg-[#f6f1e8]`}>
          <div className="px-4 md:px-10 lg:px-16">
            <h2 className={H2}>{d.fees.title || "Camp Fees"}</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {d.fees.rows.map((row) => (
                <div key={row.name} className={`flex flex-col justify-center border-2 p-7 text-center ${row.best ? "border-primary bg-[#fff5ec]" : "border-[#e8e2d6] bg-white"}`}>
                  {row.best && <span className="mb-3 inline-block bg-primary px-2.5 py-1 text-[11px] font-black tracking-widest text-white">BEST VALUE</span>}
                  <div className="font-bold">{row.name}</div>
                  <div className="mt-1 text-sm text-[#6b6258]">{row.dates}</div>
                  <div className="mt-2 text-4xl font-black text-primary md:text-5xl">{row.fee}</div>
                </div>
              ))}
            </div>
            {d.fees.note && <p className="mt-5 text-lg font-extrabold">{d.fees.note}</p>}
          </div>
        </section>
      )}

      {/* SCHEDULE */}
      {d.schedules.length > 0 && (
        <section className={SECTION}>
          <div className="px-4 md:px-10 lg:px-16">
            <h2 className={H2}>{d.scheduleTitle || "Schedule"}</h2>
            <ScheduleTabs schedules={d.schedules} />
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

      {/* REGISTER */}
      <section id="register" className={`${SECTION} scroll-mt-20 bg-[#f6f1e8]`}>
        <div className="px-4 md:px-10 lg:px-16">
          <div className="mx-auto max-w-2xl bg-[#111] p-7 text-white md:p-12">
            <Eyebrow>{event.title}</Eyebrow>
            <h2 className="mb-3 text-3xl font-black uppercase leading-none md:text-4xl">{d.formTitle || "Claim your spot"}</h2>
            {open && options.length > 0 ? (
              <>
                {d.formIntro && <p className="mb-6 text-[#cfc7ba]">{d.formIntro}</p>}
                <CampRegisterForm
                  options={options}
                  label={d.formLabel || "Select your programme"}
                  placeholder={d.formPlaceholder || "Select a programme"}
                  button={d.formButton || "Continue to Registration"}
                  error={d.formError || "Please select a programme to continue."}
                />
              </>
            ) : (
              <p className="text-[#cfc7ba]" data-testid="text-registration-closed-note">
                Registration for this camp is now closed.{" "}
                <a href={whatsapp} className="font-bold text-primary underline" target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a> and we’ll let you know about the next one.
              </p>
            )}
          </div>
        </div>
      </section>

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

      {/* Mobile register bar (kept clear of the WhatsApp button on the right) */}
      {open && (
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 bg-primary py-3 pl-4 pr-24 text-sm font-black uppercase text-white md:hidden">
          <span>{event.price || "Winter Camp"}</span>
          <a href="#register" className="bg-black px-4 py-3 text-xs tracking-widest">{d.ctaLabel || "Register Now"}</a>
        </div>
      )}
    </div>
  );
}
