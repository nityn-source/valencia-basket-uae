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
            <span className="block text-2xl font-black uppercase leading-none tracking-tighter">{bigOf(l)}</span>
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
          <div className="flex items-center gap-4 bg-black px-5 py-4 text-white md:aspect-square md:flex-col md:justify-center md:gap-2 md:px-4">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-300">{l.n < 4 ? `Level ${l.n}` : l.age}</span>
            <span className={`font-black uppercase leading-none tracking-tighter text-primary text-5xl md:text-7xl`}>{bigOf(l)}</span>
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
