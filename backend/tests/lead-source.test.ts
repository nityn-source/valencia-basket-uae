import assert from "node:assert/strict";
import test from "node:test";
import { EVENT_PAGE_SOURCE, leadCamp, leadGender, leadLevel, leadPage, leadSource } from "@/lib/leadSource";

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
