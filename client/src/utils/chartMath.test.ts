import { describe, expect, it } from "vitest";
import { signedBarGeometry } from "./chartMath";

describe("chartMath", () => {
  it("keeps positive and negative values around zero", () => {
    expect(signedBarGeometry(-20, -20, 80)).toEqual({ start: 0, width: 20, zero: 20 });
    expect(signedBarGeometry(80, -20, 80)).toEqual({ start: 20, width: 80, zero: 20 });
  });

  it("keeps zero and very small values proportional", () => {
    expect(signedBarGeometry(0, 0, 100)).toEqual({ start: 0, width: 0, zero: 0 });
    expect(signedBarGeometry(0.001, 0, 100).width).toBeCloseTo(0.001);
  });

  it("uses the full track at 100 percent and clamps values above max", () => {
    expect(signedBarGeometry(100, 0, 100)).toEqual({ start: 0, width: 100, zero: 0 });
    expect(signedBarGeometry(130, 0, 100)).toEqual({ start: 0, width: 100, zero: 0 });
  });

  it("returns an empty geometry for invalid or degenerate input", () => {
    expect(signedBarGeometry(Number.NaN, 0, 100)).toEqual({ start: 0, width: 0, zero: 0 });
    expect(signedBarGeometry(10, 0, 0)).toEqual({ start: 0, width: 0, zero: 0 });
  });
});
