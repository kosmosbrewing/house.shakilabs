import { describe, expect, it } from "vitest";
import { ageBucket, memoryDraftSchema, parseMemoryDraft } from "./memoryDraft";

describe("memory draft", () => {
  const now = new Date("2026-07-11T06:00:00Z").getTime();

  it("accepts a same-route draft with the inputs in the query", () => {
    const draft = { path: "/property-tax?price=800000000", savedAt: now - 60_000 };
    expect(parseMemoryDraft(draft, "/property-tax")?.path).toBe("/property-tax?price=800000000");
  });

  it("rejects cross-route and preset-variant drafts", () => {
    expect(parseMemoryDraft({ path: "/acquisition-tax?price=1", savedAt: now }, "/property-tax")).toBeNull();
    expect(parseMemoryDraft({ path: "/property-tax-foo?price=1", savedAt: now }, "/property-tax")).toBeNull();
    expect(parseMemoryDraft({ path: "/property-tax/80000", savedAt: now }, "/property-tax")).toBeNull();
  });

  it("rejects payloads outside the schema", () => {
    expect(parseMemoryDraft(null, "/property-tax")).toBeNull();
    expect(parseMemoryDraft("/property-tax", "/property-tax")).toBeNull();
    expect(parseMemoryDraft({ path: "/property-tax" }, "/property-tax")).toBeNull();
    expect(parseMemoryDraft({ path: "//evil.example.com/property-tax", savedAt: now }, "/property-tax")).toBeNull();
    // 경로 대조와 별개로 스키마 자체가 프로토콜 상대 주소를 끊는다
    expect(memoryDraftSchema.safeParse({ path: "//evil.example.com", savedAt: now }).success).toBe(false);
    expect(parseMemoryDraft({ path: `/property-tax?x=${"a".repeat(2_000)}`, savedAt: now }, "/property-tax")).toBeNull();
    expect(parseMemoryDraft({ path: "/property-tax", savedAt: -1 }, "/property-tax")).toBeNull();
  });

  it("buckets the draft age without exposing the inputs", () => {
    expect(ageBucket(now - 60_000, now)).toBe("under_15m");
    expect(ageBucket(now - 30 * 60_000, now)).toBe("under_1h");
    expect(ageBucket(now - 3 * 60 * 60_000, now)).toBe("under_8h");
  });
});
