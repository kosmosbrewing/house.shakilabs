import { describe, expect, it } from "vitest";
import source from "./BaseMeterBar.vue?raw";

describe("BaseMeterBar rendering contract", () => {
  it("uses equal 12px layers and a half-height radius", () => {
    expect(source).toContain('h-3 rounded-[6px]');
    expect(source).toContain("absolute inset-y-0");
    expect(source).toContain("border-radius: 6px 0 0 6px;");
    expect(source).toContain("border-radius: 0 6px 6px 0;");
    expect(source).not.toMatch(/rounded-[lr]-/);
  });

  it("does not rely on distorted SVG or clipped overflow", () => {
    expect(source).not.toMatch(/<svg|\brx=|\bry=/);
    expect(source).not.toMatch(/scaleX\(/);
    expect(source).not.toContain("border-radius: 50%");
    expect(source).not.toContain("overflow-hidden");
  });

  it("exposes a native meter accessibility contract", () => {
    expect(source).toContain('role="meter"');
    expect(source).toContain(':aria-valuemin="minimum"');
    expect(source).toContain(':aria-valuemax="maximum"');
    expect(source).toContain(':aria-valuenow="meterValue"');
    expect(source).toContain(':aria-valuetext="ariaValueText"');
  });
});
