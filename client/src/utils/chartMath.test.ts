import { describe, expect, it } from "vitest";
import { signedBarGeometry } from "./chartMath";

describe("chartMath", () => {
  it("keeps positive and negative values around zero", () => {
    expect(signedBarGeometry(-20, -20, 80)).toEqual({ start: 0, width: 20, zero: 20 });
    expect(signedBarGeometry(80, -20, 80)).toEqual({ start: 20, width: 80, zero: 20 });
  });

});
