import { describe, expect, it } from "vitest";
import source from "./PairComparisonMeters.vue?raw";

describe("PairComparisonMeters rendering contract", () => {
  it("renders both values on one shared BaseMeterBar", () => {
    expect(source).toContain('import BaseMeterBar from "./BaseMeterBar.vue"');
    expect(source).toContain(':value="row.higher.value"');
    expect(source).toContain(':threshold="row.lower.value"');
    expect(source).toContain(':maximum="row.maximum"');
  });

  it("colors only the additional burden as a warning", () => {
    expect(source).toContain(":base-tone=\"row.equal ? 'primary' : 'profit'\"");
    expect(source).toContain('excess-tone="fee"');
    expect(source).toContain("data-pair-status");
  });

  it("does not introduce another SVG chart", () => {
    expect(source).not.toMatch(/<svg|\brx=|\bry=/);
  });
});
