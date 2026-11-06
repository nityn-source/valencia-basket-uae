/** Fired by a camp card's Register button so the enquiry form below selects the matching camp. */
export const CAMP_PICK_EVENT = "camp:pick";

export function pickCamp(id: string) {
  window.dispatchEvent(new CustomEvent<string>(CAMP_PICK_EVENT, { detail: id }));
}

/** A camp card was chosen: select it in the form, then scroll down to the form. */
export function chooseCamp(id: string) {
  pickCamp(id);
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("register")?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", "#register");
}

/** Smooth-scroll to a section of the camp page by id (the Info buttons on the camp cards). */
export function scrollToSection(id: string) {
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}
