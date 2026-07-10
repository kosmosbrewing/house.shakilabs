import { describe, expect, it } from "vitest";
import {
  calculateInclusiveOverdueDays,
  parseAnnualRatePercent,
} from "@/utils/delayInterestInput";

describe("delay interest input helpers", () => {
  it("converts the displayed percent to the internal decimal rate", () => {
    expect(parseAnnualRatePercent("12")).toBe(0.12);
    expect(parseAnnualRatePercent("5.5")).toBe(0.055);
  });

  it("rejects rates outside the supported range", () => {
    expect(parseAnnualRatePercent("0.5")).toBeNull();
    expect(parseAnnualRatePercent("31")).toBeNull();
  });

  it("counts the selected start and end dates inclusively", () => {
    expect(calculateInclusiveOverdueDays("2026-07-01", "2026-07-01")).toBe(1);
    expect(calculateInclusiveOverdueDays("2026-07-01", "2026-07-10")).toBe(10);
  });

  it("rejects reversed, invalid, and overlong date ranges", () => {
    expect(calculateInclusiveOverdueDays("2026-07-10", "2026-07-01")).toBeNull();
    expect(calculateInclusiveOverdueDays("2026-02-30", "2026-03-01")).toBeNull();
    expect(calculateInclusiveOverdueDays("2024-01-01", "2026-07-10")).toBeNull();
  });
});
