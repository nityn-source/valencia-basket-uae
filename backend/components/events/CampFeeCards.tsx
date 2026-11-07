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

/** What the both-weeks price saves, worked out from the weekly fees (all text, formatted like the fees on the page). */
export interface FeeCompare {
  /** The weeks added up: "AED 2,000". */
  was: string;
  /** "AED 400". */
  save: string;
  /** Whole percent saved, e.g. 20. */
  pct: number;
  /** First week's fee, and the second week's effective price within the bundle ("AED 600"). */
  weekOne: string;
  weekTwoNow: string;
  weekTwoWas: string;
}

type PriceStyle = "a" | "1" | "2" | "3" | "4" | "5";

/**
 * The fee options as buttons: tapping one scrolls down to the registration form with that camp already
 * chosen (and flashed there). The card you picked stays marked as selected.
 */
export function CampFeeCards({ rows, clickable, compare }: { rows: FeeCard[]; clickable: boolean; compare: FeeCompare | null }) {
  const [picked, setPicked] = useState<string | null>(null);
  const style = "2" as PriceStyle; // the dark 20% OFF card; the other looks below are unused alternatives

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
        const deal = row.best && compare ? style : null;
        const dark = deal === "2";
        const solid = deal === "1";
        const body = (
          <div
            className={`relative flex h-full flex-col justify-center overflow-hidden border-2 p-7 text-center transition-all duration-300 ${
              solid ? "bg-primary text-white" : dark ? "bg-black text-white" : row.best ? "bg-[#fff5ec]" : "bg-white"
            } ${selected ? "border-primary shadow-[0_0_0_3px_rgba(255,108,14,0.25)]" : row.best ? "border-primary" : "border-[#e8e2d6]"} ${dark && !selected ? "border-black" : ""} ${
              clickable ? "group-hover:-translate-y-1.5 group-hover:border-primary group-hover:shadow-xl group-active:translate-y-0 group-active:scale-[0.98]" : ""
            }`}
          >
            {deal === "2" && compare && (
              <span aria-hidden="true" className="absolute right-[-34px] top-[18px] w-[130px] rotate-[40deg] bg-primary py-1 text-[11px] font-black tracking-widest text-white">{compare.pct}% OFF</span>
            )}
            {deal === "5" && compare && (
              <span className="-mx-7 -mt-7 mb-5 block bg-primary py-2 text-xs font-black uppercase tracking-[0.2em] text-white">Save {compare.save}</span>
            )}
            {row.best && deal !== "5" && (
              <span className={`mb-3 inline-block self-center px-2.5 py-1 text-[11px] font-black tracking-widest text-white ${solid ? "bg-black" : "bg-primary"}`}>BEST VALUE</span>
            )}
            {deal === "3" && compare && (
              <span className="mb-2 inline-block self-center bg-primary px-2 py-0.5 text-[11px] font-black tracking-widest text-white">{compare.pct}% OFF</span>
            )}
            <div className="font-bold">{row.name}</div>
            <div className={`mt-1 text-sm ${solid ? "text-white/85" : dark ? "text-white/70" : "text-[#6b6258]"}`}>{row.dates}</div>

            {deal === "4" && compare ? (
              <>
                <div className="mt-4 flex justify-center gap-2 text-sm font-bold">
                  <div className="flex-1 border-2 border-black bg-white px-2 py-2 text-black">Week 1<span className="block text-lg font-black">{compare.weekOne.replace("AED ", "")}</span></div>
                  <div className="flex-1 border-2 border-primary bg-primary px-2 py-2 text-white">Week 2<span className="block text-lg font-black"><span className="mr-1 text-sm line-through opacity-80">{compare.weekTwoWas.replace("AED ", "")}</span>{compare.weekTwoNow.replace("AED ", "")}</span></div>
                </div>
                <div className={`mt-4 text-4xl font-black text-primary transition-transform duration-300 md:text-5xl ${clickable ? "group-hover:scale-105" : ""}`}>{row.fee}</div>
                <div className="mt-1 text-sm font-bold text-[#4a4339]">instead of <span className="line-through">{compare.was}</span></div>
              </>
            ) : (
              <>
                {deal && compare && (
                  <div className={`mt-4 text-xl font-bold line-through decoration-2 ${solid ? "text-white/70" : dark ? "text-white/50" : "text-[#8a8175]"}`}>{compare.was}</div>
                )}
                <div className={`${deal ? "mt-1" : "mt-2"} text-4xl font-black transition-transform duration-300 md:text-5xl ${solid ? "text-white" : "text-primary"} ${clickable ? "group-hover:scale-105" : ""}`}>{row.fee}</div>
                {deal && compare && deal !== "5" && (
                  <div className={`mt-3 text-sm font-extrabold uppercase tracking-[0.14em] ${solid ? "inline-block self-center bg-black px-3 py-1.5 text-white" : dark ? "text-primary" : "text-black"}`}>
                    {dark ? `You save ${compare.save}` : `Save ${compare.save}`}
                  </div>
                )}
                {deal === "5" && <div className="mt-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6b6258]">Best value · 10 days</div>}
              </>
            )}

            {clickable && (
              <span className={`mt-4 inline-flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-widest transition-colors ${selected ? (solid || dark ? "text-white" : "text-primary") : solid || dark ? "text-white/90 group-hover:text-white" : "text-[#4a4339] group-hover:text-primary"}`}>
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
