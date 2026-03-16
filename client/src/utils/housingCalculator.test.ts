import { describe, expect, it } from "vitest";
import {
  calculateBrokerageFee,
  calculateDelayInterest,
  calculateJeonseVsWolse,
} from "@/utils/housingCalculator";

describe("calculateDelayInterest", () => {
  it("90일 지연이자를 계산한다", () => {
    const result = calculateDelayInterest({ depositAmount: 300_000_000, overdueDays: 90, annualRate: 0.12 });
    expect(Math.round(result.totalInterest)).toBe(8_876_712);
  });

  it("일 이자를 계산한다", () => {
    const result = calculateDelayInterest({ depositAmount: 100_000_000, overdueDays: 30, annualRate: 0.12 });
    expect(Math.round(result.dailyInterest)).toBe(32_877);
  });

  it("원금 포함 합계를 계산한다", () => {
    const result = calculateDelayInterest({ depositAmount: 500_000_000, overdueDays: 180, annualRate: 0.12 });
    expect(Math.round(result.totalWithPrincipal)).toBe(529_589_041);
  });
});

describe("calculateJeonseVsWolse", () => {
  it("기회비용이 높으면 월세가 더 저렴할 수 있다", () => {
    const result = calculateJeonseVsWolse({
      jeonseDeposit: 600_000_000,
      wolseDeposit: 50_000_000,
      monthlyRent: 1_100_000,
      annualOpportunityRate: 0.04,
      analysisYears: 2,
    });
    expect(result.cheaperOption).toBe("wolse");
  });

  it("월세가 높으면 전세가 더 저렴하다", () => {
    const result = calculateJeonseVsWolse({
      jeonseDeposit: 400_000_000,
      wolseDeposit: 50_000_000,
      monthlyRent: 1_800_000,
      annualOpportunityRate: 0.03,
      analysisYears: 2,
    });
    expect(result.cheaperOption).toBe("jeonse");
  });

  it("손익분기 월세를 계산한다", () => {
    const result = calculateJeonseVsWolse({
      jeonseDeposit: 400_000_000,
      wolseDeposit: 50_000_000,
      monthlyRent: 1_300_000,
      annualOpportunityRate: 0.035,
      analysisYears: 2,
    });
    expect(Math.round(result.breakEvenMonthlyRent)).toBe(1_020_833);
  });
});

describe("calculateBrokerageFee", () => {
  it("매매 4억원은 0.4%를 적용한다", () => {
    const result = calculateBrokerageFee({ dealType: "sale", amount: 400_000_000, monthlyRent: 0 });
    expect(Math.round(result.maxFee)).toBe(1_600_000);
    expect(result.tier.rate).toBe(0.004);
  });

  it("매매 1억원은 0.5%를 적용한다", () => {
    const result = calculateBrokerageFee({ dealType: "sale", amount: 100_000_000, monthlyRent: 0 });
    expect(Math.round(result.maxFee)).toBe(500_000);
  });

  it("전세 8천만원은 0.4%와 한도 30만원을 적용한다", () => {
    const result = calculateBrokerageFee({ dealType: "jeonse", amount: 80_000_000, monthlyRent: 0 });
    expect(Math.round(result.maxFee)).toBe(300_000);
  });

  it("월세는 100배 또는 70배 환산 규칙을 사용한다", () => {
    const result = calculateBrokerageFee({ dealType: "monthly", amount: 10_000_000, monthlyRent: 300_000 });
    expect(result.dealAmount).toBe(31_000_000);
    expect(Math.round(result.maxFee)).toBe(155_000);
  });
});
