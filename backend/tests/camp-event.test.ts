import assert from "node:assert/strict";
import test from "node:test";
import { campDetailsSchema } from "@shared/campDetails";
import { insertEventSchema } from "@shared/schema";
import { WINTER_CAMP_DETAILS, WINTER_CAMP_EVENT } from "@/lib/content/winterCampDefaults";
import { classcardLink, isRegistrationOpen } from "@/lib/campRegistration";
import { getEventStructuredData } from "@/lib/seo/structuredDataResolve";

test("the Winter Camp template passes the same validation the admin save uses", () => {
  assert.doesNotThrow(() => campDetailsSchema.parse(WINTER_CAMP_DETAILS));
  assert.doesNotThrow(() => insertEventSchema.parse(WINTER_CAMP_EVENT));
  assert.equal(WINTER_CAMP_DETAILS.programmes.length, 3);
  assert.equal(WINTER_CAMP_DETAILS.faqs.length, 7);
});

test("a blank camp page is valid and an ordinary event needs no camp content", () => {
  assert.doesNotThrow(() => campDetailsSchema.parse({}));
  const ordinary = { ...WINTER_CAMP_EVENT, details: null, registrationMode: "internal" as const };
  assert.doesNotThrow(() => insertEventSchema.parse(ordinary));
});

test("Classcard links keep their own id and gain website tags", () => {
  const url = classcardLink("https://valenciabasketuae.classcard.app/en/packages/details/471124", "winter-camp-2026", "skill-lab");
  const parsed = new URL(url);
  assert.equal(parsed.pathname, "/en/packages/details/471124");
  assert.equal(parsed.searchParams.get("utm_source"), "website");
  assert.equal(parsed.searchParams.get("utm_medium"), "event_page");
  assert.equal(parsed.searchParams.get("utm_campaign"), "winter_camp_2026");
  assert.equal(parsed.searchParams.get("utm_content"), "skill_lab");
  assert.equal(classcardLink("not a url", "x", "y"), "not a url");
});

test("registration closes by switch, by closing date, or at the end date", () => {
  const base = { registrationOpen: true, registrationCloses: null as string | null, endDate: "2999-01-01" };
  assert.equal(isRegistrationOpen(base), true);
  assert.equal(isRegistrationOpen({ ...base, registrationOpen: false }), false);
  assert.equal(isRegistrationOpen({ ...base, registrationCloses: "2000-01-01" }), false);
  assert.equal(isRegistrationOpen({ ...base, registrationCloses: "2999-01-01" }), true);
  assert.equal(isRegistrationOpen({ ...base, endDate: "2000-01-01" }), false);
});

test("camp event structured data carries start date and AED offers", () => {
  const [event] = getEventStructuredData({
    id: "1",
    slug: WINTER_CAMP_EVENT.slug,
    title: WINTER_CAMP_EVENT.title,
    date: WINTER_CAMP_EVENT.date,
    description: WINTER_CAMP_EVENT.description,
    location: WINTER_CAMP_EVENT.location,
    endDate: WINTER_CAMP_EVENT.endDate,
    details: WINTER_CAMP_DETAILS,
  }) as Record<string, any>[];
  assert.equal(event.startDate, "2026-12-07");
  assert.equal(event.endDate, "2026-12-18");
  assert.deepEqual(event.offers.map((o: any) => [o.price, o.priceCurrency]), [["1000", "AED"], ["1000", "AED"], ["1600", "AED"]]);
});
