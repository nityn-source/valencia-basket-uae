import { Shield, Award, Users, Activity, Star } from "lucide-react";
import { getContentGetter } from "@/lib/content/pageContent";

export async function TrustBar() {
  const c = await getContentGetter();
  const icons = [Award, Users, Activity, Shield, Star];
  const items = icons.map((icon, i) => ({ icon, text: c(`home.trust${i + 1}.text`) }));

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 py-8">

      {/* ── Mobile: auto-scrolling marquee ── */}
      <div className="md:hidden marquee-container overflow-hidden">
        {/* Track contains items duplicated once so -50% translateX loops perfectly */}
        <div className="marquee-track flex w-max items-center" aria-label="Trust bar">
          {/* Original set */}
          {items.map((item, idx) => (
            <div key={`a-${idx}`} className="flex items-center gap-3 px-8">
              <div className="p-2 rounded-full bg-neutral-800 text-primary shrink-0">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-white whitespace-nowrap">
                {item.text}
              </span>
            </div>
          ))}
          {/* Duplicate set — seamless loop, hidden from screen readers */}
          <div className="marquee-duplicate contents" aria-hidden="true">
            {items.map((item, idx) => (
              <div key={`b-${idx}`} className="flex items-center gap-3 px-8">
                <div className="p-2 rounded-full bg-neutral-800 text-primary shrink-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-white whitespace-nowrap">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Desktop: static single row — unchanged ── */}
      <div className="hidden md:block container mx-auto px-4">
        <div className="flex justify-between items-center gap-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 group">
              <div className="p-2 rounded-full bg-neutral-800 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-white">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
