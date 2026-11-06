import assert from "node:assert/strict";
import test from "node:test";
import { EVENT_PAGE_SOURCE, leadSource, registrationSource } from "@/lib/leadSource";

test("a lead keeps the source it gave", () => {
  assert.equal(leadSource({ howHeard: "Instagram", sourcePage: "home" }), "Instagram");
  assert.equal(leadSource({ howHeard: "Google Search", sourcePage: "camp-winter-camp-2026" }), "Google Search");
});

test("a camp-page lead with no answer counts as coming from the event page", () => {
  assert.equal(leadSource({ howHeard: "", sourcePage: "camp-winter-camp-2026" }), EVENT_PAGE_SOURCE);
  assert.equal(leadSource({ howHeard: null, sourcePage: "camp-spring-break" }), "Event page");
});

test("no source and no event page stays empty so the table shows a dash", () => {
  assert.equal(leadSource({ howHeard: "", sourcePage: "home" }), "");
  assert.equal(leadSource({}), "");
});

test("an event sign-up shows its ad source, or the event page when it came straight to the page", () => {
  assert.equal(registrationSource({ utmSource: "meta" }), "meta");
  assert.equal(registrationSource({ utmSource: "direct" }), EVENT_PAGE_SOURCE);
  assert.equal(registrationSource({}), "Event page");
});
