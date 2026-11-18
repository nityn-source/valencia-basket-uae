import assert from "node:assert/strict";
import test from "node:test";
import { bookTrialHref, cleanFrom, fromTag } from "@/lib/bookTrial";
import { leadInterest, leadPage, withInterest } from "@/lib/leadSource";

test("pages with their own form scroll to it; other pages carry their name to the homepage form", () => {
  assert.equal(bookTrialHref("/"), "#book-trial");
  assert.equal(bookTrialHref("/programs/mini-basket"), "#book-trial");
  assert.equal(bookTrialHref("/admissions"), "#book-trial");
  assert.equal(bookTrialHref("/methodology"), "/?from=methodology#book-trial");
  assert.equal(bookTrialHref("/blog/some-post"), "/?from=blog#book-trial");
  assert.equal(bookTrialHref("/programs"), "/?from=programs#book-trial");
});

test("the page name from the address bar is only accepted as a short plain word", () => {
  assert.equal(cleanFrom("Methodology"), "methodology");
  assert.equal(cleanFrom("<script>alert(1)</script>"), "");
  assert.equal(cleanFrom("a".repeat(41)), "");
  assert.equal(fromTag("/"), "");
});

test("program-page leads are labelled by their program", () => {
  assert.equal(leadPage({ sourcePage: "programs-mini-basket" }), "Mini Basket program");
  assert.equal(leadPage({ sourcePage: "programs-girls" }), "Girls programs");
  assert.equal(leadPage({ sourcePage: "methodology" }), "Methodology");
  assert.equal(leadPage({ sourcePage: "admissions" }), "Admissions");
});

test("the chosen program is saved at the start of the notes and read back for the admin", () => {
  const notes = withInterest("Mini Basket (ages 7–10)", "Prefers Mondays");
  assert.equal(notes, "Interested in: Mini Basket (ages 7–10) · Prefers Mondays");
  assert.equal(leadInterest({ additionalInfo: notes }), "Mini Basket (ages 7–10)");
  assert.equal(leadInterest({ additionalInfo: withInterest("Girls Programs", "") }), "Girls Programs");
  assert.equal(leadInterest({ additionalInfo: "Camp: Both Camps · Girl, age 12" }), "");
  assert.equal(leadInterest({ additionalInfo: null }), "");
});
