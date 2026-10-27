"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IMAGE_LIMITS_TEXT, imageFileProblem } from "@/lib/blogPaste";
import { FaqManager } from "./FaqManager";
import { ReelsManager } from "./ReelsManager";
import { VideoTestimonialsManager } from "./VideoTestimonialsManager";
import { SwitchButton, useToggleSave } from "./SectionSwitch";
import { useCoverHealth } from "./reelCoverHealth";

interface ContentRow {
  key: string;
  page: string;
  section: string | null;
  label: string;
  type: "text" | "textarea" | "image" | "toggle";
  maxLength: number | null;
  default: string;
  value: string;
  isOverridden: boolean;
  lastModified: string | null;
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

function ContentFieldEditor({ row }: { row: ContentRow }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [value, setValue] = useState(row.value);
  const [uploading, setUploading] = useState(false);
  const toggleSave = useToggleSave(row.key);

  const save = useMutation({
    mutationFn: async (nextValue: string | null) => {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: row.key, value: nextValue }),
      });
      if (!res.ok) throw new Error(await readError(res, "Unable to save"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-content"] });
      toast({ title: "Content saved" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const handleReset = () => {
    setValue(row.default);
    save.mutate(null);
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    const problem = imageFileProblem(file);
    if (problem) {
      toast({ title: problem, variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/blog/upload-image", { method: "POST", body });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to upload image");
      setValue(result.url as string);
      save.mutate(result.url as string);
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to upload image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-bold">{row.label}</span>
        {row.isOverridden && <span className="text-xs font-bold uppercase text-[#FF6C0E]">Customized</span>}
        <span className="text-[11px] text-gray-400">
          {row.lastModified ? `Last modified: ${new Date(row.lastModified).toLocaleDateString()}` : "Using site default"}
        </span>
      </div>

      {row.type === "toggle" ? (
        <div className="flex items-center gap-3">
          <SwitchButton on={row.value !== "off"} onChange={(next) => toggleSave.mutate(next)} disabled={toggleSave.isPending} label={row.label} />
          <span className="text-sm text-gray-600">{row.value !== "off" ? "Shown (the block still hides itself when it has nothing to show)" : "Hidden"}</span>
        </div>
      ) : row.type === "image" ? (
        <div className="space-y-3">
          <img src={value} alt="" className="max-h-48 w-full max-w-md rounded object-cover" />
          <label className="inline-flex cursor-pointer items-center gap-2 border border-gray-300 px-3 py-2 text-sm font-bold">
            {uploading ? "Uploading…" : "Replace image"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => uploadImage(event.target.files?.[0])}
            />
          </label>
        </div>
      ) : (
        <>
          {row.type === "textarea" ? (
            <Textarea value={value} onChange={(event) => setValue(event.target.value)} rows={3} maxLength={row.maxLength ?? undefined} />
          ) : (
            <Input value={value} onChange={(event) => setValue(event.target.value)} maxLength={row.maxLength ?? undefined} />
          )}
          {row.maxLength && (
            <p className="text-xs text-gray-400">{value.length}/{row.maxLength} characters</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => save.mutate(value)} disabled={save.isPending || !value.trim()}>Save</Button>
            <Button type="button" variant="ghost" onClick={handleReset} disabled={save.isPending}>Reset to default</Button>
          </div>
        </>
      )}
    </div>
  );
}

/** Where each Page Content group shows on the site, and how the side menu groups it. */
const PAGE_INFO: Record<string, { url: string; menu: "Main pages" | "Program pages" }> = {
  Home: { url: "/", menu: "Main pages" },
  Programs: { url: "/programs", menu: "Main pages" },
  Location: { url: "/facilities", menu: "Main pages" },
  Methodology: { url: "/methodology", menu: "Main pages" },
  Admissions: { url: "/admissions", menu: "Main pages" },
  Contact: { url: "/contact", menu: "Main pages" },
  Staff: { url: "/coaches", menu: "Main pages" },
  "Events & Camps": { url: "/events", menu: "Main pages" },
  Blog: { url: "/blog", menu: "Main pages" },
  FAQs: { url: "/faqs", menu: "Main pages" },
  "Instagram reels": { url: "/", menu: "Main pages" },
  "Video testimonials": { url: "/", menu: "Main pages" },
  "Future Ballers": { url: "/programs/future-ballers", menu: "Program pages" },
  "Mini Basket": { url: "/programs/mini-basket", menu: "Program pages" },
  "Youth Academy": { url: "/programs/youth-academy", menu: "Program pages" },
  "Private Training": { url: "/programs/private-training", menu: "Program pages" },
};
/** Not a list of fields: its questions are edited in the FAQ manager. */
const FAQ_PAGE = "FAQs";
const REELS_PAGE = "Instagram reels";
const VIDEOS_PAGE = "Video testimonials";
/** Pages that aren't a list of text fields: they have their own editors. */
const EDITOR_PAGES = [FAQ_PAGE, REELS_PAGE, VIDEOS_PAGE];
const MENUS = ["Main pages", "Program pages"] as const;
const sectionId = (page: string, section: string) => `content-${page}-${section}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function PageFields({ page, fields }: { page: string; fields: ContentRow[] }) {
  const sections = [...new Set(fields.map((row) => row.section).filter((section): section is string => !!section))];
  const info = PAGE_INFO[page];
  return (
    <div data-testid={`content-page-${page}`}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 pb-2">
        <h2 className="text-lg font-black uppercase tracking-tight">{page}</h2>
        <span className="text-xs text-gray-500">
          {fields.length} field{fields.length === 1 ? "" : "s"}
          {info && (
            <>
              {" · "}
              <a href={info.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#FF6C0E] hover:underline">
                View page {info.url} <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
        </span>
      </div>

      {sections.length > 1 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-gray-500">Jump to:</span>
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:border-[#FF6C0E] hover:text-[#FF6C0E]"
              onClick={() => document.getElementById(sectionId(page, section))?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              {section}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {fields.map((row, index) => {
          const startsSection = row.section && row.section !== fields[index - 1]?.section;
          return (
            <div key={row.key}>
              {startsSection && (
                <h3
                  id={sectionId(page, row.section!)}
                  className={`mb-4 scroll-mt-28 border-b-2 border-[#FF6C0E] pb-1 text-sm font-black uppercase tracking-wide ${index > 0 ? "mt-4" : ""}`}
                >
                  {row.section}
                </h3>
              )}
              <div className={index > 0 && !startsSection ? "border-t border-gray-100 pt-6" : ""}>
                <ContentFieldEditor row={row} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PageContentManager() {
  const [selected, setSelected] = useState<string | null>(null);
  // A "!" on the Instagram reels entry when automatic reel covers have stopped working.
  const coverBroken = useCoverHealth().data?.state === "failing";
  const { data: rows = [], isLoading } = useQuery<ContentRow[]>({
    queryKey: ["admin-page-content"],
    queryFn: async () => {
      const res = await fetch("/api/admin/content");
      if (!res.ok) throw new Error(await readError(res, "Failed to load page content"));
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">Loading page content...</div>;
  }

  const groups = new Map<string, ContentRow[]>();
  for (const row of rows) {
    const group = groups.get(row.page) ?? [];
    group.push(row);
    groups.set(row.page, group);
  }
  const order = Object.keys(PAGE_INFO);
  const pages = [...groups.keys(), ...EDITOR_PAGES].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const current = selected && pages.includes(selected) ? selected : pages[0];
  const menuOf = (page: string) => PAGE_INFO[page]?.menu ?? "Main pages";
  const choose = (page: string) => {
    setSelected(page);
    window.scrollTo({ top: document.getElementById("page-content-manager")?.offsetTop ?? 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-4" id="page-content-manager" data-testid="page-content-manager">
      <p className="text-sm text-gray-500">Edit key text and images on the live site without touching code. Fields left untouched keep the site default.</p>

      {/* Phones: pick the page from a dropdown. */}
      <select
        aria-label="Page to edit"
        value={current}
        onChange={(event) => choose(event.target.value)}
        className="h-11 w-full border border-gray-300 bg-white px-3 text-sm font-semibold md:hidden"
        data-testid="content-page-select"
      >
        {MENUS.map((menu) => (
          <optgroup key={menu} label={menu}>
            {pages.filter((page) => menuOf(page) === menu).map((page) => (
              <option key={page} value={page}>{EDITOR_PAGES.includes(page) ? `${page}${page === REELS_PAGE && coverBroken ? " ⚠ needs attention" : ""}` : `${page} (${groups.get(page)!.length} fields)`}</option>
            ))}
          </optgroup>
        ))}
      </select>

      <div className="grid items-start gap-6 md:grid-cols-[210px_minmax(0,1fr)]">
        {/* Computers and tablets: side menu that stays in view while scrolling. */}
        <nav aria-label="Pages" className="hidden border border-gray-200 bg-white md:sticky md:top-28 md:block" data-testid="content-side-menu">
          {MENUS.map((menu) => {
            const inMenu = pages.filter((page) => menuOf(page) === menu);
            if (!inMenu.length) return null;
            return (
              <div key={menu}>
                <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">{menu}</div>
                {inMenu.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => choose(page)}
                    aria-current={page === current ? "page" : undefined}
                    className={`flex w-full items-center justify-between border-b border-gray-100 px-3 py-2.5 text-left text-sm ${
                      page === current ? "bg-orange-50 font-bold shadow-[inset_3px_0_0_#FF6C0E]" : "hover:bg-orange-50/50"
                    }`}
                  >
                    <span>{page}</span>
                    {page === REELS_PAGE && coverBroken && <span className="ml-auto mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-black text-white" title="Automatic reel covers have stopped working" data-testid="cover-alert-dot">!</span>}
                    {!EDITOR_PAGES.includes(page) && <span className="text-xs text-gray-400">{groups.get(page)!.length}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {current === FAQ_PAGE ? (
          <div className="min-w-0" data-testid={`content-page-${FAQ_PAGE}`}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 pb-2">
              <h2 className="text-lg font-black uppercase tracking-tight">FAQs</h2>
              <a href="/faqs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF6C0E] hover:underline">
                View page /faqs <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <FaqManager />
          </div>
        ) : current === REELS_PAGE ? (
          <div className="min-w-0" data-testid={`content-page-${REELS_PAGE}`}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 pb-2">
              <h2 className="text-lg font-black uppercase tracking-tight">Instagram reels</h2>
              <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF6C0E] hover:underline">
                View homepage <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ReelsManager />
          </div>
        ) : current === VIDEOS_PAGE ? (
          <div className="min-w-0" data-testid={`content-page-${VIDEOS_PAGE}`}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 pb-2">
              <h2 className="text-lg font-black uppercase tracking-tight">Video testimonials</h2>
              <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF6C0E] hover:underline">
                View homepage <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <VideoTestimonialsManager />
          </div>
        ) : (
          <PageFields key={current} page={current} fields={groups.get(current)!} />
        )}
      </div>
    </div>
  );
}
