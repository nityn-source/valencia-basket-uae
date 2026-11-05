"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { CampDetails, CampProgramme } from "@shared/campDetails";

type Setter = (next: CampDetails) => void;

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <details className="border bg-white" open={false}>
      <summary className="cursor-pointer select-none bg-gray-50 px-4 py-3 text-sm font-bold uppercase tracking-wide">
        {title}
        {hint && <span className="ml-2 text-xs font-normal normal-case text-gray-400">{hint}</span>}
      </summary>
      <div className="space-y-4 p-4">{children}</div>
    </details>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

/** Text box whose lines/columns are parsed into a list; keeps what you type (blank lines, trailing spaces) until you leave. */
function ParsedField<T>({
  label,
  value,
  serialize,
  parse,
  onChange,
  rows = 4,
  multiline = true,
}: {
  label: string;
  value: T;
  serialize: (v: T) => string;
  parse: (raw: string) => T;
  onChange: (v: T) => void;
  rows?: number;
  multiline?: boolean;
}) {
  const [raw, setRaw] = useState(() => serialize(value));
  const external = serialize(value);
  useEffect(() => {
    if (serialize(parse(raw)) !== external) setRaw(external);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [external]);
  const handle = (next: string) => {
    setRaw(next);
    onChange(parse(next));
  };
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {multiline ? <Textarea value={raw} onChange={(e) => handle(e.target.value)} rows={rows} /> : <Input value={raw} onChange={(e) => handle(e.target.value)} />}
    </div>
  );
}

/** Repeating rows with add / remove / reorder. */
function ListEditor<T>({
  label,
  items,
  onChange,
  blank,
  addLabel,
  render,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  blank: () => T;
  addLabel: string;
  render: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 border bg-gray-50 p-3">
          <div className="grid flex-1 gap-2">{render(item, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))))}</div>
          <div className="flex flex-col gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Move up" onClick={() => move(i, i - 1)}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label="Move down" onClick={() => move(i, i + 1)}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-600" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, blank()])}>
        <Plus className="mr-1 h-3.5 w-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

const lines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);
const cells = (v: string) => v.split("|").map((c) => c.trim());

export function CampPageEditor({ value, onChange }: { value: CampDetails; onChange: Setter }) {
  const set = <K extends keyof CampDetails>(key: K, v: CampDetails[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-3" data-testid="camp-page-editor">
      <p className="text-xs text-gray-500">
        Everything on the camp page is edited here. Sections left empty are hidden on the website. Click a section to open it.
      </p>

      <Section title="Top of page" hint="headline, intro line, strip, buttons, photo">
        <Field label="First day of the event (YYYY-MM-DD, for Google)" value={value.startDate} onChange={(v) => set("startDate", v)} placeholder="2026-12-07" />
        <Field label="Headline (H1)" value={value.headline} onChange={(v) => set("headline", v)} />
        <Field label="Sub text" value={value.subtext} onChange={(v) => set("subtext", v)} textarea />
        <ParsedField label="Trust strip (one item per line)" value={value.strip} serialize={(v) => v.join("\n")} parse={lines} onChange={(v) => set("strip", v)} rows={5} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Register button text" value={value.ctaLabel} onChange={(v) => set("ctaLabel", v)} />
          <Field label="WhatsApp button text" value={value.whatsappLabel} onChange={(v) => set("whatsappLabel", v)} />
        </div>
        <Field label="'Open for' line" value={value.openFor} onChange={(v) => set("openFor", v)} />
        <Field label="Hero photo (image link or /images/… path)" value={value.heroImage} onChange={(v) => set("heroImage", v)} />
      </Section>

      <Section title="Programmes (camps)" hint="week cards, details, Classcard links, dropdown options">
        <p className="text-xs text-gray-500">
          Each programme becomes a card, a details list and an option in the registration dropdown. The "Both Weeks" style option can have just a name, dates, fee and Classcard link. Website tracking tags are added to each Classcard link automatically.
        </p>
        <ListEditor<CampProgramme>
          label="Programmes"
          items={value.programmes}
          onChange={(v) => set("programmes", v)}
          addLabel="Add programme"
          blank={() => ({ id: `programme-${value.programmes.length + 1}`, weekLabel: "", name: "New programme", tagline: "", venue: "", dates: "", timeLines: [], fee: "", intro: "", heading: "", bullets: [], optionLabel: "New programme", classcardUrl: "" })}
          render={(p, up) => (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Name" value={p.name} onChange={(v) => up({ name: v })} />
                <Field label="Week label (e.g. Week 1)" value={p.weekLabel} onChange={(v) => up({ weekLabel: v })} />
              </div>
              <Field label="Short description" value={p.tagline} onChange={(v) => up({ tagline: v })} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Venue" value={p.venue} onChange={(v) => up({ venue: v })} />
                <Field label="Dates" value={p.dates} onChange={(v) => up({ dates: v })} />
              </div>
              <ParsedField label="Times (one line each)" value={p.timeLines} serialize={(v) => v.join("\n")} parse={lines} onChange={(v) => up({ timeLines: v })} rows={2} />
              <Field label="Fee (e.g. AED 1,000). Also used for Google's price info." value={p.fee} onChange={(v) => up({ fee: v })} />
              <Field label="Details heading" value={p.heading} onChange={(v) => up({ heading: v })} />
              <Field label="Details intro line" value={p.intro} onChange={(v) => up({ intro: v })} />
              <ParsedField
                label="Details list (one per line: Title | description)"
                value={p.bullets}
                serialize={(v) => v.map((b) => (b.text ? `${b.title} | ${b.text}` : b.title)).join("\n")}
                parse={(raw) => lines(raw).map((l) => { const [title, ...rest] = cells(l); return { title, text: rest.join(" | ") }; })}
                onChange={(v) => up({ bullets: v })}
                rows={6}
              />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Dropdown option text" value={p.optionLabel} onChange={(v) => up({ optionLabel: v })} />
                <Field label="Tracking key (letters, no spaces)" value={p.id} onChange={(v) => up({ id: v.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
              </div>
              <Field label="Classcard registration link (without tracking tags)" value={p.classcardUrl} onChange={(v) => up({ classcardUrl: v })} placeholder="https://valenciabasketuae.classcard.app/en/packages/details/…" />
            </>
          )}
        />
      </Section>

      <Section title="Intro and fees">
        <Field label="Intro heading" value={value.introTitle} onChange={(v) => set("introTitle", v)} />
        <Field label="Intro text" value={value.introText} onChange={(v) => set("introText", v)} textarea rows={5} />
        <Field label="Fees heading" value={value.fees.title} onChange={(v) => set("fees", { ...value.fees, title: v })} />
        <ListEditor
          label="Fee boxes"
          items={value.fees.rows}
          onChange={(rows) => set("fees", { ...value.fees, rows })}
          addLabel="Add fee box"
          blank={() => ({ name: "", dates: "", fee: "", best: false })}
          render={(r, up) => (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Name" value={r.name} onChange={(v) => up({ name: v })} />
                <Field label="Dates" value={r.dates} onChange={(v) => up({ dates: v })} />
                <Field label="Fee" value={r.fee} onChange={(v) => up({ fee: v })} />
              </div>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox checked={r.best} onCheckedChange={(c) => up({ best: c === true })} /> Highlight as best value
              </label>
            </>
          )}
        />
        <Field label="Note under fees" value={value.fees.note} onChange={(v) => set("fees", { ...value.fees, note: v })} />
      </Section>

      <Section title="Schedule" hint="timetables">
        <Field label="Heading" value={value.scheduleTitle} onChange={(v) => set("scheduleTitle", v)} />
        <ListEditor
          label="Timetables (each one is a tab)"
          items={value.schedules}
          onChange={(v) => set("schedules", v)}
          addLabel="Add timetable"
          blank={() => ({ title: "New timetable", headers: ["Session", "Time"], rows: [] })}
          render={(s, up) => (
            <>
              <Field label="Tab title" value={s.title} onChange={(v) => up({ title: v })} />
              <ParsedField label="Column headings (separate with |)" value={s.headers} serialize={(v) => v.join(" | ")} parse={cells} onChange={(v) => up({ headers: v })} multiline={false} />
              <ParsedField label="Rows (one per line, columns separated with |). Start a row with 'Break' to grey it out." value={s.rows} serialize={(v) => v.map((r) => r.join(" | ")).join("\n")} parse={(raw) => lines(raw).map(cells)} onChange={(v) => up({ rows: v })} rows={10} />
            </>
          )}
        />
      </Section>

      <Section title="Coaches">
        <Field label="Heading" value={value.coachesTitle} onChange={(v) => set("coachesTitle", v)} />
        <ListEditor
          label="Coaches"
          items={value.coaches}
          onChange={(v) => set("coaches", v)}
          addLabel="Add coach"
          blank={() => ({ name: "", title: "", credential: "", photo: "" })}
          render={(c, up) => (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Name" value={c.name} onChange={(v) => up({ name: v })} />
                <Field label="Title" value={c.title} onChange={(v) => up({ title: v })} />
              </div>
              <Field label="Credentials line" value={c.credential} onChange={(v) => up({ credential: v })} />
              <Field label="Photo (image link or /images/… path)" value={c.photo} onChange={(v) => up({ photo: v })} />
            </>
          )}
        />
      </Section>

      <Section title="Reels" hint="Instagram highlight reels">
        <Field label="Heading" value={value.reelsTitle} onChange={(v) => set("reelsTitle", v)} />
        <Field label="Text under heading" value={value.reelsText} onChange={(v) => set("reelsText", v)} />
        <ParsedField label="Instagram reel links (one per line)" value={value.reels} serialize={(v) => v.map((r) => r.url).join("\n")} parse={(raw) => lines(raw).map((url) => ({ url, caption: "" }))} onChange={(v) => set("reels", v)} rows={5} />
        <Field label="Facebook reel link (shown as a 'Watch more on Facebook' link; Facebook can't be embedded here)" value={value.facebookReelUrl} onChange={(v) => set("facebookReelUrl", v)} />
      </Section>

      <Section title="Why this camp, groups, what campers get, system">
        <Field label="'What makes this camp different' heading" value={value.whyTitle} onChange={(v) => set("whyTitle", v)} />
        <ParsedField label="Points (one per line)" value={value.why} serialize={(v) => v.join("\n")} parse={lines} onChange={(v) => set("why", v)} rows={6} />
        <Field label="Groups heading" value={value.groupsTitle} onChange={(v) => set("groupsTitle", v)} />
        <ParsedField label="Groups paragraphs (blank line between paragraphs)" value={value.groupsText} serialize={(v) => v.join("\n\n")} parse={(raw) => raw.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)} onChange={(v) => set("groupsText", v)} rows={8} />
        <Field label="Groups photo (image link or /images/… path)" value={value.groupsImage} onChange={(v) => set("groupsImage", v)} />
        <Field label="'Every camper leaves with' heading" value={value.leaveTitle} onChange={(v) => set("leaveTitle", v)} />
        <ListEditor
          label="Items"
          items={value.leaves}
          onChange={(v) => set("leaves", v)}
          addLabel="Add item"
          blank={() => ({ icon: "", title: "", text: "" })}
          render={(l, up) => (
            <div className="grid grid-cols-[70px_1fr_1fr] gap-2">
              <Field label="Icon" value={l.icon} onChange={(v) => up({ icon: v })} />
              <Field label="Title" value={l.title} onChange={(v) => up({ title: v })} />
              <Field label="Text" value={l.text} onChange={(v) => up({ text: v })} />
            </div>
          )}
        />
        <Field label="'Train like a Valencia player' heading" value={value.systemTitle} onChange={(v) => set("systemTitle", v)} />
        <ListEditor
          label="Columns"
          items={value.system}
          onChange={(v) => set("system", v)}
          addLabel="Add column"
          blank={() => ({ title: "", text: "" })}
          render={(s, up) => (
            <>
              <Field label="Title" value={s.title} onChange={(v) => up({ title: v })} />
              <Field label="Text" value={s.text} onChange={(v) => up({ text: v })} textarea rows={2} />
            </>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Motto" value={value.motto} onChange={(v) => set("motto", v)} />
          <Field label="Motto translation" value={value.mottoSub} onChange={(v) => set("mottoSub", v)} />
        </div>
      </Section>

      <Section title="Registration form text" hint="dropdown label, button, error message">
        <Field label="Heading" value={value.formTitle} onChange={(v) => set("formTitle", v)} />
        <Field label="Intro line" value={value.formIntro} onChange={(v) => set("formIntro", v)} />
        <Field label="Dropdown label" value={value.formLabel} onChange={(v) => set("formLabel", v)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dropdown placeholder" value={value.formPlaceholder} onChange={(v) => set("formPlaceholder", v)} />
          <Field label="Button text" value={value.formButton} onChange={(v) => set("formButton", v)} />
        </div>
        <Field label="Message if nothing is selected" value={value.formError} onChange={(v) => set("formError", v)} />
      </Section>

      <Section title="FAQs and contact" hint="also sent to Google as FAQ data">
        <Field label="FAQ heading" value={value.faqTitle} onChange={(v) => set("faqTitle", v)} />
        <ListEditor
          label="Questions"
          items={value.faqs}
          onChange={(v) => set("faqs", v)}
          addLabel="Add question"
          blank={() => ({ question: "", answer: "" })}
          render={(f, up) => (
            <>
              <Field label="Question" value={f.question} onChange={(v) => up({ question: v })} />
              <Field label="Answer" value={f.answer} onChange={(v) => up({ answer: v })} textarea rows={3} />
            </>
          )}
        />
        <Field label="Contact heading" value={value.contactTitle} onChange={(v) => set("contactTitle", v)} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Phone" value={value.phone} onChange={(v) => set("phone", v)} />
          <Field label="WhatsApp link" value={value.whatsappUrl} onChange={(v) => set("whatsappUrl", v)} />
          <Field label="Email" value={value.email} onChange={(v) => set("email", v)} />
        </div>
      </Section>
    </div>
  );
}
