"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { CAMP_PICK_EVENT, chooseCamp } from "@/lib/campPick";

export interface FeeCard {
  name: string;
  dates: string;
  fee: string;
  best: boolean;
  /** The camp chip in the registration form this card selects. */
  pickId: string | null;
}

/**
 * The fee options as buttons: tapping one scrolls down to the registration form with that camp already
 * chosen (and flashed there). The card you picked stays marked as selected.
 */
export function CampFeeCards({ rows, clickable }: { rows: FeeCard[]; clickable: boolean }) {
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    const onPick = (e: Event) => setPicked((e as CustomEvent<string>).detail);
    window.addEventListener(CAMP_PICK_EVENT, onPick);
    return () => window.removeEventListener(CAMP_PICK_EVENT, onPick);
  }, []);

  const choose = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    chooseCamp(id);
  };

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {rows.map((row) => {
        const selected = row.pickId !== null && picked === row.pickId;
        const body = (
          <div
            className={`relative flex h-full flex-col justify-center border-2 p-7 text-center transition-all duration-300 ${
              row.best ? "bg-[#fff5ec]" : "bg-white"
            } ${selected ? "border-primary shadow-[0_0_0_3px_rgba(255,108,14,0.25)]" : row.best ? "border-primary" : "border-[#e8e2d6]"} ${
              clickable ? "group-hover:-translate-y-1.5 group-hover:border-primary group-hover:shadow-xl group-active:translate-y-0 group-active:scale-[0.98]" : ""
            }`}
          >
            {row.best && <span className="mb-3 inline-block bg-primary px-2.5 py-1 text-[11px] font-black tracking-widest text-white">BEST VALUE</span>}
            <div className="font-bold">{row.name}</div>
            <div className="mt-1 text-sm text-[#6b6258]">{row.dates}</div>
            <div className={`mt-2 text-4xl font-black text-primary transition-transform duration-300 md:text-5xl ${clickable ? "group-hover:scale-105" : ""}`}>{row.fee}</div>
            {clickable && (
              <span className={`mt-4 inline-flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-widest transition-colors ${selected ? "text-primary" : "text-[#4a4339] group-hover:text-primary"}`}>
                {selected ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" /> Selected
                  </>
                ) : (
                  <>
                    Choose this camp <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true" />
                  </>
                )}
              </span>
            )}
          </div>
        );
        return clickable && row.pickId ? (
          <a
            key={row.name}
            href="#register"
            onClick={(e) => choose(e, row.pickId!)}
            aria-label={`${row.name}, ${row.fee}. Choose this camp and go to the registration form`}
            data-testid={`fee-card-${row.pickId}`}
            className="group block cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          >
            {body}
          </a>
        ) : (
          <div key={row.name}>{body}</div>
        );
      })}
    </div>
  );
}
