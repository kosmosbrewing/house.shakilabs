import { describe, expect, it } from "vitest";
import {
  calculateAcquisitionTax,
  calculateBrokerageFee,
  calculateCapitalGainsTax,
  calculateDelayInterest,
  calculateFirstHomeBenefits,
  calculateHousingSubscriptionScore,
  calculateJeonseVsWolse,
  calculateJeonseWolseRate,
  calculateRentalYield,
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

describe("calculateFirstHomeBenefits", () => {
  it("비규제지역 생애최초는 LTV 80%와 취득세 감면을 계산한다", () => {
    const result = calculateFirstHomeBenefits({
      homePrice: 500_000_000,
      annualIncome: 60_000_000,
      isFirstHomeBuyer: true,
      isRegulatedArea: false,
      isNewlywedOrMultiChild: false,
    });

    expect(result.estimatedTaxRelief).toBe(2_000_000);
    expect(result.didimdolLoanAmount).toBe(300_000_000);
    expect(result.requiredCash).toBe(200_000_000);
  });
});

describe("calculateHousingSubscriptionScore", () => {
  it("청약가점 3개 항목을 합산한다", () => {
    const result = calculateHousingSubscriptionScore({
      homelessYears: 6,
      dependents: 2,
      accountYears: 4,
    });

    expect(result.homelessScore).toBe(14);
    expect(result.dependentScore).toBe(15);
    expect(result.accountScore).toBe(6);
    expect(result.totalScore).toBe(35);
  });
});

describe("calculateAcquisitionTax", () => {
  it("6억 이하 1주택은 1% 기본세율 적용", () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 500_000_000,
      homeCount: 1,
      isRegulatedArea: false,
      exclusiveArea: 84,
    });
    expect(result.baseRate).toBe(0.01);
    expect(result.acquisitionTax).toBe(5_000_000);
    expect(result.isSurcharged).toBe(false);
  });

  it("9억 초과 1주택은 3% 세율 적용", () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 1_200_000_000,
      homeCount: 1,
      isRegulatedArea: false,
      exclusiveArea: 84,
    });
    expect(result.baseRate).toBe(0.03);
    expect(result.acquisitionTax).toBe(36_000_000);
  });

  it("조정대상지역 2주택은 8% 중과", () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 600_000_000,
      homeCount: 2,
      isRegulatedArea: true,
      exclusiveArea: 84,
    });
    expect(result.effectiveRate).toBe(0.08);
    expect(result.isSurcharged).toBe(true);
    expect(result.acquisitionTax).toBe(48_000_000);
  });

  it("지방교육세는 기본세율분 × 10%", () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 600_000_000,
      homeCount: 1,
      isRegulatedArea: false,
      exclusiveArea: 84,
    });
    expect(result.localEducationTax).toBe(Math.round(result.purchasePrice * result.baseRate * 0.1));
  });

  it("85㎡ 이하는 농특세 면제", () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 1_000_000_000,
      homeCount: 1,
      isRegulatedArea: false,
      exclusiveArea: 84,
    });
    expect(result.ruralTax).toBe(0);
  });

  it("85㎡ 초과는 농특세 부과", () => {
    const result = calculateAcquisitionTax({
      purchasePrice: 1_000_000_000,
      homeCount: 1,
      isRegulatedArea: false,
      exclusiveArea: 100,
    });
    expect(result.ruralTax).toBeGreaterThan(0);
  });
});

describe("calculateCapitalGainsTax", () => {
  it("1세대1주택 12억 이하는 비과세", () => {
    const result = calculateCapitalGainsTax({
      sellPrice: 1_000_000_000,
      buyPrice: 600_000_000,
      expenseRate: 0.03,
      holdingYears: 5,
      residenceYears: 3,
      isOneHousehold: true,
      isRegulatedArea: false,
    });
    expect(result.isExempt).toBe(true);
    expect(result.totalTax).toBe(0);
  });

  it("1세대1주택 12억 초과분만 과세", () => {
    const result = calculateCapitalGainsTax({
      sellPrice: 1_500_000_000,
      buyPrice: 900_000_000,
      expenseRate: 0.03,
      holdingYears: 5,
      residenceYears: 3,
      isOneHousehold: true,
      isRegulatedArea: false,
    });
    expect(result.isExempt).toBe(true);
    // 양도차익의 (15억-12억)/15억 = 20%만 과세
    expect(result.taxableCapitalGain).toBeLessThan(result.capitalGain);
    expect(result.totalTax).toBeGreaterThan(0);
  });

  it("1년 미만 보유는 70% 세율 적용", () => {
    const result = calculateCapitalGainsTax({
      sellPrice: 600_000_000,
      buyPrice: 400_000_000,
      expenseRate: 0.03,
      holdingYears: 0,
      residenceYears: 0,
      isOneHousehold: false,
      isRegulatedArea: false,
    });
    expect(result.taxRate).toBe(0.7);
  });

  it("2년 이상 보유는 누진세율 적용", () => {
    const result = calculateCapitalGainsTax({
      sellPrice: 600_000_000,
      buyPrice: 400_000_000,
      expenseRate: 0.03,
      holdingYears: 3,
      residenceYears: 0,
      isOneHousehold: false,
      isRegulatedArea: false,
    });
    // 장기보유특별공제 6% (3년 × 2%)
    expect(result.longTermDeductionRate).toBe(0.06);
    expect(result.taxRate).toBeLessThan(0.45);
    expect(result.totalTax).toBeGreaterThan(0);
  });

  it("지방소득세는 양도소득세의 10%", () => {
    const result = calculateCapitalGainsTax({
      sellPrice: 800_000_000,
      buyPrice: 500_000_000,
      expenseRate: 0,
      holdingYears: 5,
      residenceYears: 0,
      isOneHousehold: false,
      isRegulatedArea: false,
    });
    expect(result.localTax).toBe(Math.round(result.incomeTax * 0.1));
  });
});

describe("calculateJeonseWolseRate", () => {
  const baseInput = {
    jeonseDeposit: 300_000_000,
    wolseDeposit: 50_000_000,
    monthlyRent: 1_200_000,
    legalRateCap: 0.045,
  };

  it("전환율 = (월세 x 12) / (전세보증금 - 월세보증금)", () => {
    const r = calculateJeonseWolseRate(baseInput);
    // (1,200,000 × 12) / (300M - 50M) = 14,400,000 / 250,000,000 = 0.0576 (5.76%)
    expect(r.actualConversionRate).toBeCloseTo(0.0576, 4);
  });

  it("법정 상한 초과 시 excessive 판정", () => {
    const r = calculateJeonseWolseRate(baseInput);
    expect(r.judgment).toBe("excessive");
  });

  it("적정 월세를 법정 상한 기준으로 계산한다", () => {
    const r = calculateJeonseWolseRate(baseInput);
    // (300M - 50M) × 4.5% / 12 = 250,000,000 × 0.045 / 12 = 937,500
    expect(r.fairMonthlyRent).toBe(Math.round(250_000_000 * 0.045 / 12));
  });

  it("월세가 적정 수준 이하이면 below 판정", () => {
    const r = calculateJeonseWolseRate({
      ...baseInput,
      monthlyRent: 800_000,
    });
    expect(r.judgment).toBe("below");
  });

  it("보증금 차이가 0이면 전환율 0", () => {
    const r = calculateJeonseWolseRate({
      ...baseInput,
      wolseDeposit: 300_000_000,
    });
    expect(r.actualConversionRate).toBe(0);
    expect(r.fairMonthlyRent).toBe(0);
  });

  it("보증금 조정 시뮬레이션을 생성한다", () => {
    const r = calculateJeonseWolseRate(baseInput);
    // 50M + 10M, 50M + 30M, 50M + 50M, 50M + 100M 중 전세보증금 미만만
    expect(r.simulations.length).toBeGreaterThan(0);
    // 첫 시뮬레이션: 보증금 +1000만
    expect(r.simulations[0]!.newWolseDeposit).toBe(60_000_000);
    expect(r.simulations[0]!.newFairMonthlyRent).toBe(
      Math.round((300_000_000 - 60_000_000) * 0.045 / 12)
    );
  });

  it("초과 부담 금액을 연간으로 계산한다", () => {
    const r = calculateJeonseWolseRate(baseInput);
    // 1,200,000 - 937,500 = 262,500 × 12 = 3,150,000
    const gap = baseInput.monthlyRent - r.fairMonthlyRent;
    expect(r.annualExcessBurden).toBe(gap * 12);
  });
});

describe("calculateRentalYield", () => {
  const baseInput = {
    purchasePrice: 500_000_000,
    deposit: 100_000_000,
    monthlyRent: 800_000,
    loanAmount: 200_000_000,
    loanRate: 0.04,
    monthlyExpense: 100_000,
    vacancyRate: 0.05,
  };

  it("총수익률(gross) = 연 임대수입 / 매매가", () => {
    const r = calculateRentalYield(baseInput);
    // 800,000 × 12 = 9,600,000 / 500,000,000 = 1.92%
    expect(r.grossYield).toBeCloseTo(0.0192, 4);
  });

  it("공실률이 반영된 순수익을 계산한다", () => {
    const r = calculateRentalYield(baseInput);
    // 공실 손실: 9,600,000 × 5% = 480,000
    expect(r.vacancyLoss).toBe(480_000);
    expect(r.annualRentNet).toBe(9_120_000);
  });

  it("연간 순수익 = 실 임대수입 - 대출이자 - 관리비", () => {
    const r = calculateRentalYield(baseInput);
    // 대출이자: 200M × 4% = 8,000,000
    // 관리비: 100,000 × 12 = 1,200,000
    // 순수익: 9,120,000 - 8,000,000 - 1,200,000 = -80,000
    expect(r.annualLoanInterest).toBe(8_000_000);
    expect(r.annualExpense).toBe(1_200_000);
    expect(r.annualNetIncome).toBe(-80_000);
  });

  it("자기자본 = 매매가 - 대출 - 보증금", () => {
    const r = calculateRentalYield(baseInput);
    // 500M - 200M - 100M = 200M
    expect(r.equity).toBe(200_000_000);
  });

  it("대출·공실 없으면 순수익률이 높다", () => {
    const r = calculateRentalYield({
      ...baseInput,
      loanAmount: 0,
      vacancyRate: 0,
      monthlyExpense: 0,
    });
    // 순수익 = 9,600,000, 매매가 500M → 1.92%
    expect(r.netYield).toBeCloseTo(0.0192, 4);
    expect(r.annualNetIncome).toBe(9_600_000);
  });
});
