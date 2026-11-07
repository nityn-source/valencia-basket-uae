import assert from "node:assert/strict";
import test from "node:test";
import { quickEnquiryFormSchema } from "@shared/schema";
import { leadPage } from "@/lib/leadSource";

const valid = { parentName: "Jane Doe", phone: "+971501234567", ageGroup: "7–10 years" };

test("the quick enquiry needs only a name, a number and the child's age group", () => {
  const parsed = quickEnquiryFormSchema.parse(valid);
  assert.equal(parsed.utmSource, "direct");
});

test("each quick enquiry field is checked", () => {
  for (const [key, bad] of [["parentName", "J"], ["phone", "12345"], ["ageGroup", "9"], ["ageGroup", "19–25 years"]] as const) {
    assert.equal(quickEnquiryFormSchema.safeParse({ ...valid, [key]: bad }).success, false, `${key} should be rejected`);
  }
  assert.equal(quickEnquiryFormSchema.safeParse({ ...valid, website: "spam" }).success, false);
});

test("quick-form leads are labelled in the leads table", () => {
  assert.equal(leadPage({ sourcePage: "home-quick" }), "Home (quick form)");
});
