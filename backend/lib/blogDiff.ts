import { headingText } from "@/lib/blogToc";

/**
 * Word-level and paragraph-level comparison of two article versions, for the
 * revision browser. Everything is "from" the current article "to" the older
 * version being looked at: "add" is text only in the older version, "del" is
 * text only in the current one.
 */

export type DiffPart = { type: "same" | "add" | "del"; text: string };

const MAX_WORD_CELLS = 4_000_000;
const MAX_BLOCK_CELLS = 4_000_000;

/** Words, whitespace and single punctuation marks, so "Dubai:" and "Dubai" share the word. */
const tokenize = (text: string) => text.match(/\s+|[\p{L}\p{N}'’_-]+|[^\s\p{L}\p{N}]/gu) ?? [];

/** Word-by-word difference (longest common subsequence). */
export function diffWords(from: string, to: string): DiffPart[] {
  if (from === to) return from ? [{ type: "same", text: from }] : [];
  const a = tokenize(from);
  const b = tokenize(to);
  if (a.length * b.length > MAX_WORD_CELLS) {
    return [...(from ? [{ type: "del" as const, text: from }] : []), ...(to ? [{ type: "add" as const, text: to }] : [])];
  }
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = new Uint32Array(rows * cols);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * cols + j] = a[i] === b[j] ? table[(i + 1) * cols + j + 1] + 1 : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
    }
  }
  const raw: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { raw.push({ type: "same", text: a[i] }); i++; j++; }
    else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) { raw.push({ type: "del", text: a[i] }); i++; }
    else { raw.push({ type: "add", text: b[j] }); j++; }
  }
  for (; i < a.length; i++) raw.push({ type: "del", text: a[i] });
  for (; j < b.length; j++) raw.push({ type: "add", text: b[j] });
  return tidy(raw);
}

/**
 * Makes the comparison readable: neighbouring changes are grouped into one removed
 * chunk followed by one added chunk, and a short unchanged stretch (a space, "the",
 * "a") sitting between two changes is folded into them instead of splitting a phrase
 * into scattered fragments.
 */
function tidy(raw: DiffPart[]): DiffPart[] {
  const isTinySame = (part: DiffPart | undefined) => !!part && part.type === "same" && wordCount(part.text) <= 1 && part.text.trim().length <= 4;
  const out: DiffPart[] = [];
  let index = 0;
  while (index < raw.length) {
    const part = raw[index];
    if (part.type === "same") {
      const last = out[out.length - 1];
      if (last && last.type === "same") last.text += part.text; else out.push({ ...part });
      index++;
      continue;
    }
    let del = "";
    let add = "";
    while (index < raw.length) {
      const current = raw[index];
      if (current.type === "del") { del += current.text; index++; }
      else if (current.type === "add") { add += current.text; index++; }
      else if (isTinySame(current) && raw[index + 1] && raw[index + 1].type !== "same") { del += current.text; add += current.text; index++; }
      else break;
    }
    // keep the spacing that belongs between chunks outside them
    const lead = (/^\s+/.exec(del)?.[0] ?? "") === (/^\s+/.exec(add)?.[0] ?? "") ? (/^\s+/.exec(del)?.[0] ?? "") : "";
    if (lead) { del = del.slice(lead.length); add = add.slice(lead.length); }
    const trail = (/\s+$/.exec(del)?.[0] ?? "") === (/\s+$/.exec(add)?.[0] ?? "") ? (/\s+$/.exec(del)?.[0] ?? "") : "";
    if (trail) { del = del.slice(0, del.length - trail.length); add = add.slice(0, add.length - trail.length); }
    if (lead) out.push({ type: "same", text: lead });
    if (del) out.push({ type: "del", text: del });
    if (add) out.push({ type: "add", text: add });
    if (trail) out.push({ type: "same", text: trail });
  }
  // join same-kind neighbours created by the steps above
  return out.reduce<DiffPart[]>((merged, part) => {
    const last = merged[merged.length - 1];
    if (last && last.type === part.type) last.text += part.text; else merged.push({ ...part });
    return merged;
  }, []);
}

export interface ArticleBlock { tag: string; text: string }

const blockPattern = /<(h[1-6]|p|li|blockquote|figcaption)\b[^>]*>([\s\S]*?)<\/\1\s*>|<(img|iframe)\b[^>]*>/gi;

/** The readable blocks of an article: headings, paragraphs, list items, quotes, plus image and embed markers. */
export function articleBlocks(html: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  for (const match of html.matchAll(blockPattern)) {
    if (match[3]) {
      const kind = match[3].toLowerCase();
      const alt = kind === "img" ? /\balt\s*=\s*"([^"]*)"/i.exec(match[0])?.[1] : "";
      blocks.push({ tag: kind, text: kind === "img" ? `[Image${alt ? `: ${alt}` : ""}]` : "[Embedded video or post]" });
      continue;
    }
    const text = headingText(match[2]);
    if (text) blocks.push({ tag: match[1].toLowerCase(), text });
  }
  return blocks;
}

export type BlockDiff =
  | { kind: "same"; tag: string; text: string }
  | { kind: "added" | "removed"; tag: string; text: string }
  | { kind: "changed"; tag: string; parts: DiffPart[] };

export interface ArticleDiff {
  blocks: BlockDiff[];
  stats: { addedWords: number; removedWords: number; changedBlocks: number };
  /** False when the articles are too large to compare paragraph by paragraph. */
  comparable: boolean;
}

const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/** Two paragraphs count as an edit of each other (not a delete plus an add) when most of the words are shared. */
function similar(parts: DiffPart[]) {
  const words = (type: DiffPart["type"]) => parts.filter((part) => part.type === type).reduce((sum, part) => sum + wordCount(part.text), 0);
  const same = words("same");
  return same > 0 && same / (same + words("add") + words("del")) >= 0.4;
}

export function diffArticles(currentHtml: string, versionHtml: string): ArticleDiff {
  const from = articleBlocks(currentHtml);
  const to = articleBlocks(versionHtml);
  if (from.length * to.length > MAX_BLOCK_CELLS) {
    return { blocks: [], stats: { addedWords: 0, removedWords: 0, changedBlocks: 0 }, comparable: false };
  }
  const key = (block: ArticleBlock) => `${block.tag}\u0000${block.text}`;
  const rows = from.length + 1;
  const cols = to.length + 1;
  const table = new Uint32Array(rows * cols);
  for (let i = from.length - 1; i >= 0; i--) {
    for (let j = to.length - 1; j >= 0; j--) {
      table[i * cols + j] = key(from[i]) === key(to[j]) ? table[(i + 1) * cols + j + 1] + 1 : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
    }
  }

  const blocks: BlockDiff[] = [];
  let removed: ArticleBlock[] = [];
  let added: ArticleBlock[] = [];
  const stats = { addedWords: 0, removedWords: 0, changedBlocks: 0 };
  const flush = () => {
    const pairs = Math.min(removed.length, added.length);
    const out: BlockDiff[] = [];
    for (let n = 0; n < removed.length || n < added.length; n++) {
      const r = removed[n];
      const a = added[n];
      if (r && a && n < pairs) {
        const parts = diffWords(r.text, a.text);
        if (similar(parts)) {
          out.push({ kind: "changed", tag: a.tag, parts });
          stats.changedBlocks++;
          stats.addedWords += parts.filter((p) => p.type === "add").reduce((s, p) => s + wordCount(p.text), 0);
          stats.removedWords += parts.filter((p) => p.type === "del").reduce((s, p) => s + wordCount(p.text), 0);
          continue;
        }
      }
      if (r) { out.push({ kind: "removed", tag: r.tag, text: r.text }); stats.removedWords += wordCount(r.text); stats.changedBlocks++; }
      if (a) { out.push({ kind: "added", tag: a.tag, text: a.text }); stats.addedWords += wordCount(a.text); stats.changedBlocks++; }
    }
    blocks.push(...out);
    removed = [];
    added = [];
  };

  let i = 0;
  let j = 0;
  while (i < from.length && j < to.length) {
    if (key(from[i]) === key(to[j])) {
      flush();
      blocks.push({ kind: "same", tag: to[j].tag, text: to[j].text });
      i++; j++;
    } else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) { removed.push(from[i]); i++; }
    else { added.push(to[j]); j++; }
  }
  while (i < from.length) removed.push(from[i++]);
  while (j < to.length) added.push(to[j++]);
  flush();
  return { blocks, stats, comparable: true };
}
