import { describe, expect, it } from "vitest";
import source from "./BaseComparisonBar.vue?raw";

describe("BaseComparisonBar rendering contract", () => {
  it("uses equal 12px layers and explicit half-height radii", () => {
    expect(source).toContain('h-3 rounded-[6px]');
    expect(source).toContain("absolute inset-y-0");
    expect(source).toContain("border-radius: 6px 0 0 6px;");
    expect(source).toContain("border-radius: 0 6px 6px 0;");
    expect(source).not.toMatch(/rounded-[lr]-/);
  });

  it("does not rely on SVG stretching or clipped overflow", () => {
    expect(source).not.toMatch(/<svg|\brx=|\bry=/);
    expect(source).not.toMatch(/scaleX\(/);
    expect(source).not.toContain("border-radius: 50%");
    expect(source).not.toContain("overflow-hidden");
  });

  it("exposes value, zero marker, scale, and meter semantics", () => {
    expect(source).toContain("data-comparison-value");
    expect(source).toContain("data-comparison-zero");
    expect(source).toContain('role="meter"');
    expect(source).toContain(':aria-valuemin="safeMinimum"');
    expect(source).toContain(':aria-valuemax="safeMaximum"');
    expect(source).toContain(':aria-valuenow="meterValue"');
  });
});
