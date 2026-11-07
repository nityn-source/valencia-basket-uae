import assert from "node:assert/strict";
import test from "node:test";
import { mapsSearchUrl } from "@/lib/maps";

test("a venue becomes a Google Maps search link", () => {
  assert.equal(mapsSearchUrl("AllSports Arena, Al Quoz"), "https://www.google.com/maps/search/?api=1&query=AllSports+Arena+Al+Quoz+Dubai");
});
