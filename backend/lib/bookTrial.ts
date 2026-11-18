/**
 * Where "Book a free trial" buttons go, and how the homepage form learns which page the visitor came from.
 *
 * Program pages and Admissions carry their own booking form (id "book-trial"), so a button there scrolls to it.
 * Every other page sends the visitor to the homepage form with "?from=<page>", and that form saves it as the source.
 */

/** Pages that have their own form with the id "book-trial". */
const OWN_FORM = /^\/(programs\/[^/]+|admissions)\/?$/;

/** The page name a lead is tagged with: the first part of the address ("/methodology" -> "methodology", "/blog/x" -> "blog"). Empty for the homepage. */
export function fromTag(pathname: string): string {
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  return cleanFrom(first);
}

/** Only short lowercase words and dashes are accepted, since the value comes from the address bar. Empty when it isn't one. */
export function cleanFrom(value: string | null | undefined): string {
  const v = (value ?? "").trim().toLowerCase();
  return /^[a-z0-9-]{1,40}$/.test(v) ? v : "";
}

/** The address a "Book a free trial" button on `pathname` should use. */
export function bookTrialHref(pathname: string): string {
  if (pathname === "/" || OWN_FORM.test(pathname)) return "#book-trial";
  const from = fromTag(pathname);
  return from ? `/?from=${from}#book-trial` : "/#book-trial";
}
