"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { FAQ_LIMITS, FAQ_SECTIONS, FAQ_SECTION_IDS, type FaqItem, type FaqSectionId } from "@/lib/content/faq";

interface FaqResponse {
  items: FaqItem[];
}

interface Draft {
  section: FaqSectionId;
  question: string;
  answer: string;
  visible: boolean;
}

type FieldErrors = Partial<Record<keyof Draft, string>>;

const NEW = "new" as const;

function toDraft(item: FaqItem | null, section?: FaqSectionId): Draft {
  return {
    section: item?.section ?? section ?? "about",
    question: item?.question ?? "",
    answer: item?.answer ?? "",
    visible: item?.visible ?? true,
  };
}

async function readError(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({}));
  const error = new Error(data?.error || fallback) as Error & { field?: string };
  error.field = data?.field ?? undefined;
  return error;
}

function Counter({ value, max }: { value: string; max: number }) {
  return <p className="mt-1 text-xs text-gray-400">{value.length}/{max} characters</p>;
}

function FaqEditor({
  item,
  defaultSection,
  onSaved,
  onDeleted,
  onBack,
}: {
  item: FaqItem | null;
  defaultSection?: FaqSectionId;
  onSaved: (item: FaqItem) => void;
  onDeleted: () => void;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft>(() => toDraft(item, defaultSection));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isNew = item === null;

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const save = useMutation({
    mutationFn: async (payload: Draft) => {
      const res = await fetch(isNew ? "/api/admin/faqs" : `/api/admin/faqs/${item!.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await readError(res, "Unable to save");
      return (await res.json()) as FaqItem;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast({ title: isNew ? "Question added. Live within a minute." : "Saved. Live within a minute." });
      onSaved(saved);
    },
    onError: (error: Error & { field?: string }) => {
      if (error.field) setErrors({ [error.field]: error.message } as FieldErrors);
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/faqs/${item!.id}`, { method: "DELETE" });
      if (!res.ok) throw await readError(res, "Unable to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast({ title: "Question deleted" });
      onDeleted();
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const submit = () => {
    const found: FieldErrors = {};
    if (!draft.question.trim()) found.question = "Question is required";
    if (!draft.answer.trim()) found.answer = "Answer is required";
    setErrors(found);
    if (Object.keys(found).length) {
      toast({ title: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }
    save.mutate(draft);
  };

  const errorText = (key: keyof Draft) => errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>;
  const label = "mb-1.5 mt-4 block text-sm font-semibold";

  return (
    <div data-testid="faq-editor">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
        <span className="font-black uppercase tracking-tight">{isNew ? "New question" : "Edit question"}</span>
        <Button type="button" variant="outline" size="sm" className="xl:hidden" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back to list</Button>
      </div>
      <div className="p-4">
        <label htmlFor="faq-question" className="mb-1.5 block text-sm font-semibold">Question *</label>
        <Input id="faq-question" value={draft.question} maxLength={FAQ_LIMITS.question} onChange={(event) => update("question", event.target.value)} />
        <Counter value={draft.question} max={FAQ_LIMITS.question} />
        {errorText("question")}

        <label htmlFor="faq-answer" className={label}>Answer *</label>
        <Textarea id="faq-answer" value={draft.answer} rows={9} maxLength={FAQ_LIMITS.answer} onChange={(event) => update("answer", event.target.value)} />
        <Counter value={draft.answer} max={FAQ_LIMITS.answer} />
        {errorText("answer")}
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-gray-500">
          <li>Leave a blank line to start a new paragraph.</li>
          <li>Start lines with <code>1.</code> <code>2.</code> for a numbered list, or <code>-</code> for bullets.</li>
          <li>Link: <code>[link text](/facilities)</code> for a page on this site, or <code>[link text](https://…)</code>.</li>
        </ul>

        <label htmlFor="faq-section" className={label}>Section</label>
        <select
          id="faq-section"
          value={draft.section}
          onChange={(event) => update("section", event.target.value as FaqSectionId)}
          className="h-9 w-full border border-input bg-transparent px-3 text-sm"
        >
          {FAQ_SECTIONS.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
        </select>
        {!isNew && <p className="mt-1 text-xs text-gray-500">Moving a question puts it at the end of the new section.</p>}

        <label className="mt-5 flex items-center gap-2 text-sm font-semibold">
          <Checkbox checked={draft.visible} onCheckedChange={(value) => update("visible", value === true)} data-testid="faq-visible" /> Show on site
        </label>
        <p className="mt-1 text-xs text-gray-500">Turn off to hide a question without deleting it. Hidden questions are also left out of Google&apos;s FAQ data.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" onClick={submit} disabled={save.isPending}>{isNew ? "Add question" : "Save changes"}</Button>
          {!isNew && (
            <Button type="button" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setConfirmingDelete(true)} disabled={remove.isPending}>Delete</Button>
          )}
          {isNew && <Button type="button" variant="ghost" onClick={onBack}>Cancel</Button>}
        </div>

        {confirmingDelete && item && (
          <div className="mt-4 space-y-3 border border-red-200 bg-red-50 p-4" data-testid="faq-delete-confirm">
            <p className="text-sm font-bold">Delete this question permanently? To keep it for later, switch off &quot;Show on site&quot; instead.</p>
            <div className="flex gap-2">
              <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={() => remove.mutate()} disabled={remove.isPending}>Yes, delete</Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function FaqManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<number | typeof NEW | null>(null);
  const [newSection, setNewSection] = useState<FaqSectionId>("about");
  const [mobileEditing, setMobileEditing] = useState(false);

  const { data, isLoading, isError } = useQuery<FaqResponse>({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/faqs");
      if (!res.ok) throw new Error("Failed to load FAQs");
      return res.json();
    },
  });

  const reorder = useMutation({
    mutationFn: async ({ section, ids }: { section: FaqSectionId; ids: number[] }) => {
      const res = await fetch("/api/admin/faqs/reorder", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ section, ids }),
      });
      if (!res.ok) throw await readError(res, "Unable to save the order");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast({ title: "Order saved" });
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast({ title: error.message, variant: "destructive" });
    },
  });

  if (isLoading) return <div className="py-12 text-center text-gray-500">Loading FAQs...</div>;
  if (isError || !data) return <div className="py-12 text-center text-red-600">Couldn&apos;t load FAQs. Refresh to try again.</div>;

  const items = data.items;
  const current = typeof selected === "number" ? items.find((item) => item.id === selected) ?? null : null;
  const editorOpen = selected === NEW || current !== null;

  const open = (id: number | typeof NEW, section?: FaqSectionId) => {
    if (section) setNewSection(section);
    setSelected(id);
    setMobileEditing(true);
  };
  const close = () => {
    setSelected(null);
    setMobileEditing(false);
  };

  const move = (item: FaqItem, direction: -1 | 1) => {
    const ids = items.filter((candidate) => candidate.section === item.section).map((candidate) => candidate.id!);
    const index = ids.indexOf(item.id!);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    // Show the new order right away; the server confirms it.
    queryClient.setQueryData<FaqResponse>(["admin-faqs"], (old) =>
      old && {
        ...old,
        items: old.items
          .map((candidate) => (candidate.section === item.section ? { ...candidate, sortOrder: ids.indexOf(candidate.id!) } : candidate))
          .sort((a, b) => FAQ_SECTION_IDS.indexOf(a.section) - FAQ_SECTION_IDS.indexOf(b.section) || a.sortOrder - b.sortOrder),
      },
    );
    reorder.mutate({ section: item.section, ids });
  };

  return (
    <div className="space-y-6" data-testid="faq-manager">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className={`border border-gray-200 bg-white ${mobileEditing ? "hidden xl:block" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
            <span className="font-black uppercase tracking-tight">FAQ questions</span>
            <Button type="button" onClick={() => open(NEW)} data-testid="button-add-faq"><Plus className="mr-1 h-4 w-4" /> Add question</Button>
          </div>
          {FAQ_SECTIONS.map((section) => {
            const inSection = items.filter((item) => item.section === section.id);
            return (
              <div key={section.id}>
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{section.title} · {inSection.length}</span>
                  <button type="button" className="text-[11px] font-bold uppercase text-primary hover:underline" onClick={() => open(NEW, section.id)}>+ Add here</button>
                </div>
                {inSection.length === 0 && <p className="border-b border-gray-100 px-4 py-3 text-xs text-gray-500">No questions, so this section is hidden on the site.</p>}
                {inSection.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 ${selected === item.id ? "bg-orange-50 shadow-[inset_3px_0_0_#FF6C0E]" : "hover:bg-orange-50/50"}`}
                    data-testid={`faq-row-${item.slug}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <button type="button" aria-label="Move up" className="flex h-5 w-6 items-center justify-center border border-gray-200 bg-white disabled:opacity-30" disabled={index === 0 || reorder.isPending} onClick={() => move(item, -1)}><ArrowUp className="h-3 w-3" /></button>
                      <button type="button" aria-label="Move down" className="flex h-5 w-6 items-center justify-center border border-gray-200 bg-white disabled:opacity-30" disabled={index === inSection.length - 1 || reorder.isPending} onClick={() => move(item, 1)}><ArrowDown className="h-3 w-3" /></button>
                    </div>
                    <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => open(item.id!)}>
                      <span className={`min-w-0 flex-1 text-sm font-bold ${item.visible ? "" : "text-gray-400"}`}>{item.question}</span>
                      {!item.visible && <span className="shrink-0 rounded bg-red-100 px-1.5 text-[10px] font-bold uppercase text-red-600">Hidden</span>}
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </section>

        <section className={`border border-gray-200 bg-white ${mobileEditing ? "" : "hidden xl:block"}`}>
          {editorOpen ? (
            <FaqEditor
              key={selected === NEW ? `new-${newSection}` : `${current!.id}`}
              item={selected === NEW ? null : current}
              defaultSection={newSection}
              onSaved={(saved) => setSelected(saved.id)}
              onDeleted={close}
              onBack={close}
            />
          ) : (
            <div className="px-4 py-16 text-center text-sm text-gray-500">Select a question on the left to edit it, or add a new one.</div>
          )}
        </section>
      </div>
    </div>
  );
}
