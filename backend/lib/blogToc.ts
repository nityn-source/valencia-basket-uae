/**
 * Table of contents for blog articles, built from the article's own H2 and H3
 * headings (pure helpers, safe to import anywhere). The article text is not
 * rewritten: each heading only gains a unique id so the contents can link to it.
 */

/** An article needs at least this many H2 headings to get a contents box. */
export const TOC_MIN_H2 = 3;

export interface TocItem {
  id: string;
  text: string;
  /** "1" for an H2, "1.2" for an H3 under it. */
  number: string;
  children: TocItem[];
}

export interface ArticleToc {
  /** The article HTML with an id on every H2 and H3 that has text. */
  html: string;
  items: TocItem[];
  /** Where the contents box goes: just before the first H2. */
  insertAt: number;
  /** False for short articles (fewer than TOC_MIN_H2 H2 headings). */
  enabled: boolean;
}

const headingPattern = /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1\s*>/gi;
const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

const namedEntities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…" };

function decodeEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const point = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(point) && point > 0 && point < 0x110000 ? String.fromCodePoint(point) : match;
    }
    return namedEntities[code.toLowerCase()] ?? match;
  });
}

/** A heading's visible text: tags dropped, entities decoded, spaces collapsed. */
export function headingText(innerHtml: string) {
  return decodeEntities(innerHtml.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

/** A readable anchor name from a heading, e.g. "Why Do Custom Insoles Cost More?" → "why-do-custom-insoles-cost-more". */
export function slugifyHeading(text: string) {
  const full = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  // Very long headings are cut at a word boundary, never mid-word.
  const short = full.length > 80 ? full.slice(0, 80).replace(/-[^-]*$/, "") : full;
  return short || "section";
}

/** True when every tag opened in the HTML is closed in it, so it can be cut there safely. */
function isBalanced(html: string) {
  const stack: string[] = [];
  for (const match of html.matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>/gi)) {
    const name = match[2].toLowerCase();
    if (VOID_TAGS.has(name) || match[3] === "/") continue;
    if (match[1] === "/") {
      const at = stack.lastIndexOf(name);
      if (at === -1) return false;
      stack.length = at;
    } else {
      stack.push(name);
    }
  }
  return stack.length === 0;
}

export function buildArticleToc(html: string): ArticleToc {
  const used = new Set<string>();
  const items: TocItem[] = [];
  let h2Count = 0;
  let h3Count = 0;
  let firstH2Id = "";

  const withIds = html.replace(headingPattern, (whole: string, level: string, attrs: string | undefined, inner: string) => {
    const text = headingText(inner);
    if (!text) return whole;
    const base = slugifyHeading(text);
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);

    const cleanAttrs = (attrs ?? "").replace(/\sid\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    if (level === "2") {
      h2Count += 1;
      h3Count = 0;
      items.push({ id, text, number: String(h2Count), children: [] });
      if (!firstH2Id) firstH2Id = id;
    } else if (items.length) {
      h3Count += 1;
      items[items.length - 1].children.push({ id, text, number: `${h2Count}.${h3Count}`, children: [] });
    } else {
      // An H3 before any H2 stands on its own so it is still reachable.
      items.push({ id, text, number: String(items.length + 1), children: [] });
    }
    return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
  });

  // Find the first H2 in the HTML that now has ids, so the box goes just before it.
  let insertAt = 0;
  if (firstH2Id) {
    const at = withIds.indexOf(` id="${firstH2Id}"`);
    const tagStart = at === -1 ? -1 : withIds.lastIndexOf("<h2", at);
    if (tagStart !== -1 && isBalanced(withIds.slice(0, tagStart))) insertAt = tagStart;
  }

  return { html: withIds, items, insertAt, enabled: h2Count >= TOC_MIN_H2 };
}
