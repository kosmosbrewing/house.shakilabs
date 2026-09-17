import { describe, expect, it } from "vitest";
import {
  formatNumber,
  formatWon,
  formatWonShort,
  formatPercent,
  formatCurrency,
} from "./utils";

describe("utils formatters", () => {
  it("formatNumber/formatWon은 nullish를 '-'로 처리한다", () => {
    expect(formatNumber(null)).toBe("-");
    expect(formatNumber(12345)).toBe("12,345");

    expect(formatWon(undefined)).toBe("-");
    expect(formatWon(12345.6)).toBe("12,346원");
  });

  it("formatWonShort는 만/억 단위를 축약한다", () => {
    expect(formatWonShort(2_490_000)).toBe("249만원");
    expect(formatWonShort(100_000_000)).toBe("1억원");
    expect(formatWonShort(123_400_000)).toBe("1억 2,340만원");
    expect(formatWonShort(-54_000)).toBe("-5만원");
  });

  it("formatPercent는 반올림 결과가 0이면 음수 부호를 떼고, 진짜 음수는 남긴다", () => {
    // /rental-yield가 라이브에서 "-0.0%"를 26px 빨강으로 노출했다 — 손실처럼 읽힌다
    expect(formatPercent(-0.0001)).toBe("0.0%");
    expect(formatPercent(-0.0004)).toBe("0.0%");
    expect(formatPercent(-0)).toBe("0.0%");
    expect(formatPercent(0)).toBe("0.0%");
    // 반올림해도 0이 아니면 부호를 유지한다(경계)
    expect(formatPercent(-0.0005)).toBe("-0.1%");
    expect(formatPercent(-0.012)).toBe("-1.2%");
    // 자릿수를 바꿔도 같은 규칙
    expect(formatPercent(-0.00004, 2)).toBe("0.00%");
    expect(formatPercent(-0.00006, 2)).toBe("-0.01%");
  });

  it("formatPercent는 소수점 자릿수를 반영한다", () => {
    expect(formatPercent(0.1234)).toBe("12.3%");
    expect(formatPercent(0.1234, 2)).toBe("12.34%");
    expect(formatPercent(0.0099, 2)).toBe("0.99%");
    expect(formatPercent(null)).toBe("-");
  });

  it("formatCurrency는 통화 규칙에 맞게 표기한다", () => {
    expect(formatCurrency(14900, "KRW")).toContain("14,900");
    expect(formatCurrency(12.34, "USD")).toContain("12.34");
    expect(formatCurrency(undefined, "KRW")).toBe("-");
  });
});
