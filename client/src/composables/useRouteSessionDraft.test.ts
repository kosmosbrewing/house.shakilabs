import { describe, expect, it } from "vitest";
import { parseRouteSessionDraft } from "./useRouteSessionDraft";

describe("route session draft", () => {
  const now = new Date("2026-07-11T06:00:00Z").getTime();

  it("accepts a same-route draft within eight hours", () => {
    const raw = JSON.stringify({ path: "/property-tax?price=800000000", savedAt: now - 60_000 });
    expect(parseRouteSessionDraft(raw, "/property-tax", now)?.path).toBe("/property-tax?price=800000000");
  });

  it("rejects expired and cross-route drafts", () => {
    expect(parseRouteSessionDraft(JSON.stringify({ path: "/acquisition-tax?price=1", savedAt: now }), "/property-tax", now)).toBeNull();
    expect(parseRouteSessionDraft(JSON.stringify({ path: "/property-tax?price=1", savedAt: now - 9 * 60 * 60 * 1000 }), "/property-tax", now)).toBeNull();
  });
});
