import type { CampCardSummary } from "@/lib/campCardWeeks";

/** The weeks of a camp as small boxes on an event card, with the both-weeks price underneath. */
export function CampCardWeeks({ summary }: { summary: CampCardSummary }) {
  return (
    <div className="mb-4 w-full max-w-[640px]" data-testid="camp-card-weeks">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {summary.weeks.map((week) => (
          <div key={week.name} className="border border-l-4 border-gray-200 border-l-primary bg-white px-3.5 py-3">
            {week.label && <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-primary">{week.label}</div>}
            <div className="text-lg font-black uppercase leading-tight">{week.name}</div>
            <div className="mt-0.5 text-[12.5px] leading-snug text-gray-600">
              {week.focus && <div>{week.focus}</div>}
              {week.times && <div>{week.times}</div>}
            </div>
            {week.fee && <div className="mt-2 text-lg font-black">{week.fee}</div>}
          </div>
        ))}
      </div>
      {summary.bundle && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-black px-3.5 py-2.5 text-[13px] font-bold text-white">
          <span><b className="text-[#ff9a4d]">{summary.bundle.text}</b>{summary.bundle.save && ` · ${summary.bundle.save}`}</span>
        </div>
      )}
    </div>
  );
}
