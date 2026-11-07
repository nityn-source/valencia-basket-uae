"use client";

import { useEffect, useRef, useState } from "react";
import { parseWeekdays, type DayTile } from "@/lib/campDays";
import { buildBlocks, scaleMarks, type ScheduleBlock } from "@/lib/scheduleBlocks";
import { ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";

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

/**
 * The session as one proportional bar: orange blocks are training, thin grey blocks are breaks, so the shape of the
 * three hours is clear at a glance. Tap a block (or use the arrows or the left/right keys) for its name, time and length.
 */
function TimeBar({ blocks, selected, onSelect }: { blocks: ScheduleBlock[]; selected: number; onSelect: (i: number) => void }) {
  const total = blocks[blocks.length - 1].end - blocks[0].start;
  const marks = scaleMarks(blocks);
  const block = blocks[selected];
  const move = (by: number) => onSelect((selected + by + blocks.length) % blocks.length);
  return (
    <div className="px-4 pb-4 pt-5" data-testid="schedule-bar">
      <div
        role="group"
        aria-label="The session in time order. Use the left and right arrow keys to move between blocks."
        className="relative flex h-14 gap-[2px] sm:h-16"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") (e.preventDefault(), move(1));
          if (e.key === "ArrowLeft") (e.preventDefault(), move(-1));
        }}
      >
        {blocks.map((b, i) => {
          const on = i === selected;
          const wide = b.minutes >= 12;
          return (
            <button
              key={`${b.start}-${b.name}`}
              type="button"
              aria-pressed={on}
              aria-label={`${b.name}, ${b.time}, ${b.minutes} minutes`}
              onClick={() => onSelect(i)}
              style={{ flexGrow: b.end - b.start, flexBasis: 0 }}
              className={`relative min-w-0 overflow-hidden px-1.5 text-left text-[11px] font-extrabold leading-tight transition-colors duration-200 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/40 sm:px-2.5 sm:text-xs ${
                on
                  ? "bg-black text-white after:absolute after:-bottom-[1px] after:left-1/2 after:h-0 after:w-0 after:-translate-x-1/2 after:border-x-[7px] after:border-b-[7px] after:border-x-transparent after:border-b-white"
                  : b.isBreak
                    ? "bg-[#d9d3c7] text-black hover:bg-[#c9c2b3]"
                    : "bg-primary text-black hover:brightness-95"
              }`}
            >
              {wide && !b.isBreak && (
                <>
                  <span className="block text-sm sm:text-base">{b.minutes}′</span>
                  <span className="hidden truncate sm:block">{b.name}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <div className="relative mt-1.5 h-4 text-[11px] font-bold text-[#6b6258]" aria-hidden="true">
        {marks.map((m) => (
          <span key={m.at} className="absolute top-0 -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full" style={{ left: `${m.at}%` }}>
            {m.label}
            {m.suffix}
          </span>
        ))}
      </div>
      <div className="mt-1 flex items-center gap-4 text-[11px] font-bold text-[#6b6258]" aria-hidden="true">
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 bg-primary" /> Training</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 bg-[#d9d3c7]" /> Break</span>
      </div>

      <div className="mt-3 flex items-stretch gap-2" aria-live="polite">
        <button type="button" onClick={() => move(-1)} aria-label="Previous block" className="flex w-11 shrink-0 items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white">
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className={`min-w-0 flex-1 border-2 px-3 py-2.5 ${block.isBreak ? "border-[#d9d3c7] bg-[#f6f1e8]" : "border-primary bg-[#fff5ec]"}`}>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-primary">
            {block.isBreak ? "Break" : "Training"} · {block.minutes} minutes
          </div>
          <div className="text-base font-black leading-snug sm:text-lg">{block.name.replace(/^break:\s*/i, "")}</div>
          <div className="text-sm font-bold text-[#4a4339]">{block.time}</div>
        </div>
        <button type="button" onClick={() => move(1)} aria-label="Next block" className="flex w-11 shrink-0 items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white">
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <span className="sr-only">{total} minutes in total</span>
    </div>
  );
}

/** Both timetables stay in the page HTML; the tab only shows one at a time. */
export function ScheduleTabs({ schedules, days }: { schedules: Schedule[]; days?: (DayTile[] | null)[] }) {
  const [active, setActive] = useState(0);
  // The day picked in each week; the timetable below shows the column that belongs to that day.
  const [picked, setPicked] = useState<number[]>(() => schedules.map((_, i) => Math.max(0, days?.[i]?.findIndex((d) => d.time) ?? 0)));
  // The block picked on each week's time bar, and whether each week's full table is open.
  const [block, setBlock] = useState<number[]>(() => schedules.map(() => -1));
  const [open, setOpen] = useState<boolean[]>(() => schedules.map(() => false));
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
        // The bar reads the first visible time column ("Mon - Thu", "Friday" or "Time"); if it can't be read, only the table shows.
        const timeCol = shown.findIndex((k, c) => c > 0 && k);
        const blocks = buildBlocks(s.rows, timeCol);
        const sel = blocks ? Math.min(block[i] >= 0 ? block[i] : Math.max(0, blocks.findIndex((b) => !b.isBreak)), blocks.length - 1) : 0;
        const tableOpen = !blocks || open[i];
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
          {blocks && (
            <>
              <TimeBar blocks={blocks} selected={sel} onSelect={(n) => setBlock((cur) => cur.map((v, k) => (k === i ? n : v)))} />
              <div className="px-4 pb-4">
                <button
                  type="button"
                  aria-expanded={open[i]}
                  aria-controls={`sched-table-${i}`}
                  onClick={() => setOpen((cur) => cur.map((v, k) => (k === i ? !v : v)))}
                  className="flex w-full items-center justify-between border-2 border-black bg-white px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors hover:bg-black hover:text-white"
                  data-testid="schedule-reveal"
                >
                  {open[i] ? "Hide full timetable" : "See full timetable"}
                  {open[i] ? <Minus className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </>
          )}
          <div id={`sched-table-${i}`} hidden={!tableOpen} className="overflow-x-auto">
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
