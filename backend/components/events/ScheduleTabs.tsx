"use client";

import { useEffect, useRef, useState } from "react";
import { parseWeekdays, type DayTile } from "@/lib/campDays";

interface Schedule {
  title: string;
  headers: string[];
  rows: string[][];
}

/** Day tiles for one week. They light up one after another when scrolled into view; tap a day for its time. */
function DayStrip({ days, picked, onPick }: { days: DayTile[]; picked: number; onPick: (i: number) => void }) {
  const [seen, setSeen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.4 });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  const day = days[picked];
  return (
    <div ref={ref} className="border-b border-[#e8e2d6] px-4 py-5" data-testid="camp-day-strip">
      <div className="flex gap-2" role="group" aria-label="Camp days">
        {days.map((d, i) => (
          <button
            key={`${d.date}-${d.month}`}
            type="button"
            disabled={!d.time}
            aria-pressed={picked === i}
            onClick={() => onPick(i)}
            style={{ transitionDelay: seen ? `${i * 90}ms` : "0ms" }}
            className={`flex min-w-0 flex-1 flex-col items-center border-2 py-2.5 text-[11px] font-extrabold uppercase tracking-wider transition-all duration-500 ${
              seen ? "translate-y-0 opacity-100" : "[@media(scripting:enabled)]:translate-y-3 [@media(scripting:enabled)]:opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
            } ${!d.time ? "border-[#e8e2d6] text-[#b3aa9a]" : picked === i ? "border-primary bg-primary text-white" : "border-black bg-white text-black hover:border-primary hover:text-primary"}`}
          >
            {d.label}
            <b className="mt-0.5 text-xl font-black leading-none">{d.date}</b>
          </button>
        ))}
      </div>
      {day?.time && (
        <p key={picked} className="camp-step-in mt-4 text-sm font-bold">
          {day.label} {day.date} {day.month} <span className="text-primary">·</span> {day.time}
        </p>
      )}
    </div>
  );
}

/** Both timetables stay in the page HTML; the tab only shows one at a time. */
export function ScheduleTabs({ schedules, days }: { schedules: Schedule[]; days?: (DayTile[] | null)[] }) {
  const [active, setActive] = useState(0);
  // The day picked in each week; the timetable below shows the column that belongs to that day.
  const [picked, setPicked] = useState<number[]>(() => schedules.map((_, i) => Math.max(0, days?.[i]?.findIndex((d) => d.time) ?? 0)));
  return (
    <div>
      <div role="tablist" className="mb-0 flex gap-1.5">
        {schedules.map((s, i) => (
          <button
            key={s.title}
            role="tab"
            id={`sched-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`sched-panel-${i}`}
            onClick={() => setActive(i)}
            className={`flex-1 border-2 border-black px-3 py-3.5 text-xs font-black uppercase tracking-wider sm:text-sm ${active === i ? "bg-black text-white" : "bg-white text-black"}`}
          >
            {s.title}
          </button>
        ))}
      </div>
      {schedules.map((s, i) => {
        const day = days?.[i]?.[picked[i]];
        // With a day picked, keep only the time column that covers it ("Mon - Thu" or "Friday"); other headings stay.
        const keep = s.headers.map((h, c) => c === 0 || !day || !parseWeekdays(h) || parseWeekdays(h)!.has(day.weekday));
        const shown = keep.some((k, c) => c > 0 && k) ? keep : keep.map(() => true);
        return (
        <div
          key={s.title}
          role="tabpanel"
          id={`sched-panel-${i}`}
          aria-labelledby={`sched-tab-${i}`}
          hidden={active !== i}
          className="border-2 border-t-0 border-black bg-white"
        >
          {days?.[i] && <DayStrip days={days[i]!} picked={picked[i]} onPick={(n) => setPicked((cur) => cur.map((v, k) => (k === i ? n : v)))} />}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#f6f1e8] text-[11px] font-black uppercase tracking-widest max-sm:hidden">
                  {s.headers.map((h, c) => shown[c] && (
                    <th key={h} scope="col" className="px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.rows.map((row, r) => {
                  const isBreak = /^break/i.test(row[0] ?? "");
                  return (
                    <tr key={r} className={`border-t border-[#e8e2d6] max-sm:block max-sm:px-4 max-sm:py-3 ${isBreak ? "italic text-[#8a8175]" : ""}`}>
                      {row.map((cell, c) => shown[c] && (
                        <td
                          key={c}
                          data-label={s.headers[c] ?? ""}
                          className={`px-4 py-3 max-sm:block max-sm:px-0 max-sm:py-0.5 ${c === 0 ? "max-sm:font-bold" : "whitespace-nowrap max-sm:before:mr-2 max-sm:before:text-[11px] max-sm:before:font-bold max-sm:before:uppercase max-sm:before:tracking-wider max-sm:before:text-[#8a8175] max-sm:before:content-[attr(data-label)]"} ${c > 0 && !isBreak ? "font-bold" : ""}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        );
      })}
    </div>
  );
}
