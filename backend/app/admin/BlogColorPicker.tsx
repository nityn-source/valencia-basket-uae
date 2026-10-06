"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Hsv = { h: number; s: number; v: number };
type Rgb = { r: number; g: number; b: number };

/** Site colours first, so articles stay on brand. */
const SWATCHES = [
  { name: "Academy orange", hex: "#ff6c0e" },
  { name: "Dark orange", hex: "#c2410c" },
  { name: "Black", hex: "#111827" },
  { name: "Dark grey", hex: "#4b5563" },
  { name: "Grey", hex: "#9ca3af" },
  { name: "Blue", hex: "#1d4ed8" },
  { name: "Green", hex: "#15803d" },
  { name: "Red", hex: "#b91c1c" },
];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))));
  };
  return { r: f(5), g: f(3), b: f(1) };
}

function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const delta = max - Math.min(rr, gg, bb);
  let h = 0;
  if (delta) {
    if (max === rr) h = 60 * (((gg - bb) / delta) % 6);
    else if (max === gg) h = 60 * ((bb - rr) / delta + 2);
    else h = 60 * ((rr - gg) / delta + 4);
  }
  return { h: (h + 360) % 360, s: max ? delta / max : 0, v: max };
}

const toHex = ({ r, g, b }: Rgb) => `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;

function fromHex(value: string): Rgb | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].split("").map((c) => c + c).join("") : match[1];
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}

/** Drag handler for the shade square and hue bar: reports the pointer position as 0–1 fractions. */
function useDrag(onMove: (x: number, y: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (event: React.PointerEvent) => {
    const box = ref.current!.getBoundingClientRect();
    onMove(clamp((event.clientX - box.left) / box.width), clamp((event.clientY - box.top) / box.height));
  };
  return {
    ref,
    onPointerDown: (event: React.PointerEvent) => {
      event.preventDefault(); // keep the article's text selection
      ref.current!.setPointerCapture(event.pointerId);
      move(event);
    },
    onPointerMove: (event: React.PointerEvent) => event.buttons === 1 && move(event),
  };
}

/**
 * Text colour picker: a shade square (light → dark, grey → full colour), a hue bar, brand
 * swatches and the colour's HEX and R/G/B numbers, all editable.
 */
export function BlogColorPicker({ initial, onApply, onRemove, onClose }: {
  initial: string | null;
  onApply: (hex: string) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [hsv, setHsv] = useState<Hsv>(() => rgbToHsv(fromHex(initial ?? "") ?? fromHex("#ff6c0e")!));
  const rgb = hsvToRgb(hsv);
  const hex = toHex(rgb);
  const [hexDraft, setHexDraft] = useState(hex);
  const panelRef = useRef<HTMLDivElement>(null);
  // Opens leftwards from the button; flips to rightwards when that would run past the editor's left edge.
  const [alignLeft, setAlignLeft] = useState(false);
  useLayoutEffect(() => {
    const panel = panelRef.current?.getBoundingClientRect();
    const editor = panelRef.current?.closest("[data-testid=article-editor]")?.getBoundingClientRect();
    if (panel && editor && panel.left < editor.left) setAlignLeft(true);
  }, []);

  useEffect(() => setHexDraft(hex), [hex]);

  // Close on Escape or a click outside the panel.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    const onDown = (event: PointerEvent) => panelRef.current && !panelRef.current.contains(event.target as Node) && onClose();
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [onClose]);

  const shade = useDrag((x, y) => setHsv((current) => ({ ...current, s: x, v: 1 - y })));
  const hue = useDrag((x) => setHsv((current) => ({ ...current, h: Math.min(359.9, x * 360) })));
  const setRgb = (next: Rgb) => setHsv(rgbToHsv(next));

  return (
    <div ref={panelRef} className={`absolute ${alignLeft ? "left-0" : "right-0"} top-full z-30 mt-1 w-[300px] border border-gray-300 bg-white p-3 text-xs shadow-xl`} data-testid="color-picker">
      <div
        {...shade}
        className="relative h-36 w-full cursor-crosshair touch-none rounded-sm"
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${hsv.h} 100% 50%)` }}
        aria-label="Shade: drag left/right for strength, up/down for light/dark"
        data-testid="color-shade"
      >
        <span className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }} />
      </div>
      <div
        {...hue}
        className="relative mt-3 h-3 w-full cursor-pointer touch-none rounded-full"
        style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
        aria-label="Colour"
        data-testid="color-hue"
      >
        <span className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }} />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <div className="h-9 w-9 shrink-0 rounded border border-gray-300" style={{ background: hex }} data-testid="color-preview" />
        <label className="flex w-[78px] flex-col gap-0.5 text-gray-500">HEX
          <input
            value={hexDraft}
            onChange={(event) => {
              setHexDraft(event.target.value);
              const parsed = fromHex(event.target.value);
              if (parsed) setRgb(parsed);
            }}
            className="h-7 border border-gray-300 px-1.5 font-mono uppercase text-gray-900"
            data-testid="color-hex"
          />
        </label>
        {(["r", "g", "b"] as const).map((channel) => (
          <label key={channel} className="flex w-12 flex-col gap-0.5 uppercase text-gray-500">{channel}
            <input
              inputMode="numeric"
              maxLength={3}
              value={rgb[channel]}
              onChange={(event) => setRgb({ ...rgb, [channel]: clamp(Math.round(Number(event.target.value) || 0), 0, 255) })}
              className="h-7 w-full border border-gray-300 px-1.5 text-center text-gray-900"
              data-testid={`color-${channel}`}
            />
          </label>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" onMouseDown={(event) => event.preventDefault()}>
        {SWATCHES.map((swatch) => (
          <button key={swatch.hex} type="button" title={`${swatch.name} ${swatch.hex}`} aria-label={swatch.name} onClick={() => setRgb(fromHex(swatch.hex)!)} className={`h-6 w-6 rounded border ${swatch.hex === hex ? "ring-2 ring-black ring-offset-1" : "border-gray-300"}`} style={{ background: swatch.hex }} />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t pt-3" onMouseDown={(event) => event.preventDefault()}>
        <button type="button" onClick={onRemove} className="text-gray-600 underline" data-testid="color-remove">Remove colour</button>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="border border-gray-300 px-3 py-1.5 font-semibold">Cancel</button>
          <button type="button" onClick={() => onApply(hex)} className="bg-black px-3 py-1.5 font-semibold text-white" data-testid="color-apply">Apply</button>
        </div>
      </div>
    </div>
  );
}
