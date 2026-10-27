import { Shield, Award, Users, Activity, Star } from "lucide-react";
import { getContentGetter } from "@/lib/content/pageContent";

// How many extra copies of the row follow the original. The track slides left by half of
// its width, so it loops seamlessly as long as half the track is wider than the screen.
const COPIES = 5;

export async function TrustBar() {
  const c = await getContentGetter();
  const icons = [Award, Users, Activity, Shield, Star];
  const items = icons.map((icon, i) => ({ icon, text: c(`home.trust${i + 1}.text`) }));

  const row = (prefix: string) =>
    items.map((item, idx) => (
      <div key={`${prefix}-${idx}`} className="group flex items-center gap-3 px-8 md:px-12">
        <div className="shrink-0 rounded-full bg-black/20 p-2 text-white transition-colors group-hover:bg-black">
          <item.icon className="h-5 w-5" />
        </div>
        <span className="whitespace-nowrap text-sm font-bold uppercase tracking-wider text-white">{item.text}</span>
      </div>
    ));

  return (
    <div className="bg-primary py-5 md:py-6">
      {/* Sliding banner on every screen size; it pauses when hovered. With reduced motion it stops and can be scrolled by hand. */}
      <div className="marquee-container overflow-hidden">
        <div className="marquee-track flex w-max items-center hover:[animation-play-state:paused]" aria-label="Trust bar">
          {row("a")}
          {/* Copies for the seamless loop, hidden from screen readers */}
          {Array.from({ length: COPIES }, (_, copy) => (
            <div key={copy} className="marquee-duplicate contents" aria-hidden="true">
              {row(`b${copy}`)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
