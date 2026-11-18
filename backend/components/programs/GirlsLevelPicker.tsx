"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export type GirlsLevel = {
  n: number;
  age: string;
  title: string;
  tagline: string;
  desc: string;
  focus: string[];
  href: string;
  label: string;
};

/** "4–6" with a little air around the dash, so a heavy, tightly-set font doesn't run the digits into it. Other text is shown as it is. */
function Big({ text }: { text: string }) {
  const m = text.match(/^(\d+)\s*[–-]\s*(\d+)$/);
  if (!m) return <>{text}</>;
  return (
    <>
      {m[1]}
      <span aria-hidden="true" className="mx-[0.1em] inline-block w-[0.4em] border-b-[0.09em] border-current align-middle" />
      <span className="sr-only">–</span>
      {m[2]}
    </>
  );
}

// Age buttons act as the finder; every panel stays in the page (hidden) so the copy is crawlable.
export function GirlsLevelPicker({ levels }: { levels: GirlsLevel[] }) {
  const [active, setActive] = useState(0);
  // Elite's "age" is a phrase ("Invitation only"), so its big label is the first word of its name.
  const bigOf = (l: GirlsLevel) => (l.n < 4 ? l.age.replace(/^ages\s*/i, "") : l.title.split(/[\s/]+/)[0]);
  const subOf = (l: GirlsLevel) => (l.n < 4 ? l.title : l.age);

  return (
    <div>
      <div role="tablist" aria-label="Choose her age group" className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {levels.map((l, i) => (
          <button
            key={l.n}
            type="button"
            role="tab"
            id={`girls-tab-${l.n}`}
            aria-selected={active === i}
            aria-controls={`girls-level-${l.n}`}
            onClick={() => setActive(i)}
            data-testid={`girls-tab-${l.n}`}
            className={`border-2 px-3 py-3 text-center transition-colors ${active === i ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-black hover:border-primary"}`}
          >
            <span className="block text-2xl font-black uppercase leading-none tracking-tight"><Big text={bigOf(l)} /></span>
            <span className={`mt-1 block text-xs font-bold uppercase tracking-wider ${active === i ? "text-white/90" : "text-gray-500"}`}>{subOf(l)}</span>
          </button>
        ))}
      </div>

      {levels.map((l, i) => (
        <article
          key={l.n}
          role="tabpanel"
          id={`girls-level-${l.n}`}
          aria-labelledby={`girls-tab-${l.n}`}
          hidden={active !== i}
          data-testid={`girls-level-${l.n}`}
          className="grid grid-cols-1 items-center gap-6 bg-orange-50 p-5 md:grid-cols-[260px_1fr] md:gap-10 md:p-8"
        >
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-0.5 bg-black px-6 py-5 text-white md:flex md:aspect-square md:flex-col md:justify-center md:gap-3 md:px-4" data-testid={`girls-age-${l.n}`}>
            <span className="col-start-2 row-start-1 self-end text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 md:tracking-[0.28em]">{l.n < 4 ? `Level ${l.n}` : "Top level"}</span>
            <span className="col-start-1 row-span-2 row-start-1 text-6xl font-black uppercase leading-none tracking-tight text-primary md:text-7xl"><Big text={bigOf(l)} /></span>
            <span className="col-start-2 row-start-2 self-start text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 md:w-24 md:border-t md:border-white/25 md:pt-3 md:text-center md:tracking-[0.28em]">{l.n < 4 ? "Years old" : "By invitation"}</span>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">{l.tagline}</p>
            <h2 className="mb-3 text-3xl font-black uppercase tracking-tight">{l.n === 4 ? `${l.title} (${l.age})` : l.title}</h2>
            <p className="mb-5 leading-relaxed text-gray-700">{l.desc}</p>
            <ul className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {l.focus.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <Check className="h-4 w-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            {l.href.startsWith("#") ? (
              <a href={l.href}><Button className="h-auto rounded-none py-3 font-bold uppercase tracking-wider">{l.label} <ArrowRight className="ml-2 h-4 w-4" /></Button></a>
            ) : (
              <Link href={l.href}><Button className="h-auto rounded-none py-3 font-bold uppercase tracking-wider">{l.label} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
