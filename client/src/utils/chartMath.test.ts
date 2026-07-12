import { describe, expect, it } from "vitest";
import { normalizeSegments, signedBarGeometry } from "./chartMath";

describe("chartMath", () => {
  it("keeps positive and negative values around zero", () => {
    expect(signedBarGeometry(-20, -20, 80)).toEqual({ start: 0, width: 20, zero: 20 });
    expect(signedBarGeometry(80, -20, 80)).toEqual({ start: 20, width: 80, zero: 20 });
  });

  it("normalizes exact housing cost components", () => {
    expect(normalizeSegments([50, 30, 20])).toEqual([0.5, 0.3, 0.2]);
    expect(normalizeSegments([0, Number.NaN])).toEqual([0, 0]);
  });
});
