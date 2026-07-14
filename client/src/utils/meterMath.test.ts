import { describe, expect, it } from "vitest";
import {
  meterPercent,
  thresholdMeterGeometry,
  thresholdScaleMaximum,
  thresholdState,
} from "./meterMath";

describe("meterMath", () => {
  it("keeps zero at the beginning of a shared scale", () => {
    expect(thresholdMeterGeometry(0, 45, 0, 100)).toEqual({
      valuePercent: 0,
      thresholdPercent: 45,
      basePercent: 0,
      excessStartPercent: 45,
      excessPercent: 0,
      state: "below",
      valueClamped: false,
    });
  });

  it("does not inflate a very small value", () => {
    expect(meterPercent(0.000_001, 0, 0.1)).toBeCloseTo(0.001);
  });

  it("uses one position when value and threshold are equal", () => {
    const geometry = thresholdMeterGeometry(0.045, 0.045, 0, 0.06);
    expect(geometry.state).toBe("equal");
    expect(geometry.valuePercent).toBeCloseTo(75);
    expect(geometry.thresholdPercent).toBeCloseTo(75);
    expect(geometry.excessPercent).toBe(0);
  });

  it("renders a full-width value at 100 percent", () => {
    const geometry = thresholdMeterGeometry(1, 0.4, 0, 1);
    expect(geometry.valuePercent).toBe(100);
    expect(geometry.basePercent).toBe(40);
    expect(geometry.excessPercent).toBe(60);
  });

  it("clamps values above max without changing their threshold state", () => {
    const geometry = thresholdMeterGeometry(1.3, 0.4, 0, 1);
    expect(geometry.valuePercent).toBe(100);
    expect(geometry.excessPercent).toBe(60);
    expect(geometry.state).toBe("above");
    expect(geometry.valueClamped).toBe(true);
  });

  it("supports an explicit equality tolerance", () => {
    expect(thresholdState(0.0455, 0.045, 0.001)).toBe("equal");
  });

  it("adds deterministic headroom on a percentage-point scale", () => {
    expect(thresholdScaleMaximum(0, 0.045, 0, 0.01)).toBe(0.06);
    expect(thresholdScaleMaximum(0.058, 0.045, 0, 0.01)).toBe(0.07);
  });
});
