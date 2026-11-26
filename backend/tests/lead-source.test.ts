import assert from "node:assert/strict";
import test from "node:test";
import { EVENT_PAGE_SOURCE, eventTitleForLead, leadNotedEvent, leadCamp, leadGender, leadLevel, leadPage, leadSource } from "@/lib/leadSource";

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

const campLead = { sourcePage: "camp-winter-camp", programInterest: "Both Camps", additionalInfo: "Camp: Both Camps · Girl, age 12", howHeard: "Event page" };

test("a camp-page lead shows its page, camp and girl/boy, and keeps the camp out of the Level column", () => {
  assert.equal(leadPage(campLead), "Event: Winter Camp");
  assert.equal(leadCamp(campLead), "Both Camps");
  assert.equal(leadGender(campLead), "Girl");
  assert.equal(leadLevel(campLead), "");
  assert.equal(leadGender({ ...campLead, additionalInfo: "Camp: Week 1 Skill Lab · Boy, age 9" }), "Boy");
});

test("other leads keep their level and show no camp columns", () => {
  const trial = { sourcePage: "home", programInterest: "Beginner", additionalInfo: "wants Thursday sessions · Girl, age 7" };
  assert.equal(leadPage(trial), "Home");
  assert.equal(leadLevel(trial), "Beginner");
  assert.equal(leadCamp(trial), "");
  assert.equal(leadGender(trial), "", "only camp-page leads are read for girl/boy");
  assert.equal(leadPage({ sourcePage: "contact" }), "Contact");
  assert.equal(leadPage({ sourcePage: "" }), "");
});

test("a camp lead finds its event by exact address, following a renamed address, then the name saved with it", () => {
  const events = [{ slug: "winter-camp", title: "Basketball Winter Camp 2026" }];
  assert.equal(eventTitleForLead({ sourcePage: "camp-winter-camp" }, events), "Basketball Winter Camp 2026");
  assert.equal(eventTitleForLead({ sourcePage: "camp-winter-camp-2026" }, events), "Basketball Winter Camp 2026", "old address is followed");
  // A similar-looking address is not guessed at; the lead's own saved event name is used instead.
  const lead = { sourcePage: "camp-winter-camp-kids", additionalInfo: "Camp: Week 1 · Girl, age 9 · Event: Kids Winter Camp" };
  assert.equal(eventTitleForLead(lead, events), "Kids Winter Camp");
  assert.equal(leadNotedEvent(lead), "Kids Winter Camp");
  assert.equal(eventTitleForLead({ sourcePage: "camp-gone-event" }, events), "Gone Event");
  assert.equal(leadGender(lead), "Girl", "the saved event name does not disturb the Girl/Boy read");
});

test("the camp form saves into event registrations (the Event & Camp Sign-ups tab), not into trial bookings", async () => {
  const { readFileSync } = await import("node:fs");
  const route = readFileSync("app/api/camp-enquiries/route.ts", "utf8");
  assert.match(route, /storage\.createEventRegistration\(/);
  assert.doesNotMatch(route, /createTrialBooking/);
  const schema = readFileSync("shared/schema.ts", "utf8");
  for (const column of ["camp", "gender", "whatsapp", "source_page", "utm_source", "landing_page"]) assert.match(schema, new RegExp(`event_registrations[\\s\\S]*"${column}"`));
  assert.match(readFileSync("migrations/0018_event_registration_camp_fields.sql", "utf8"), /ADD COLUMN "source_page"/);
});
