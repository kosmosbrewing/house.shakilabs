import {
  RENT_BROKERAGE_TIERS,
  SALE_BROKERAGE_TIERS,
  type BrokerageDealType,
  type BrokerageTier,
} from "@/data/brokerageRates";

export interface DelayInterestInput {
  depositAmount: number;
  overdueDays: number;
  annualRate: number;
}

export interface JeonseVsWolseInput {
  jeonseDeposit: number;
  wolseDeposit: number;
  monthlyRent: number;
  annualOpportunityRate: number;
  analysisYears: number;
}

export interface BrokerageFeeInput {
  dealType: BrokerageDealType;
  amount: number;
  monthlyRent: number;
}

type HousingChoice = "jeonse" | "wolse" | "same";

export function calculateDelayInterest(input: DelayInterestInput) {
  const dailyInterest = (input.depositAmount * input.annualRate) / 365;
  const totalInterest = dailyInterest * input.overdueDays;

  return {
    dailyInterest,
    totalInterest,
    monthlyEquivalentInterest: (input.depositAmount * input.annualRate) / 12,
    totalWithPrincipal: input.depositAmount + totalInterest,
  };
}

export function calculateJeonseVsWolse(input: JeonseVsWolseInput) {
  const jeonseAnnualCost = input.jeonseDeposit * input.annualOpportunityRate;
  const wolseAnnualCost = (input.wolseDeposit * input.annualOpportunityRate) + (input.monthlyRent * 12);
  const jeonseTotalCost = jeonseAnnualCost * input.analysisYears;
  const wolseTotalCost = wolseAnnualCost * input.analysisYears;
  const difference = wolseTotalCost - jeonseTotalCost;
  const breakEvenMonthlyRent = Math.max(
    0,
    ((input.jeonseDeposit - input.wolseDeposit) * input.annualOpportunityRate) / 12
  );
  const breakEvenJeonseDeposit =
    input.annualOpportunityRate > 0
      ? input.wolseDeposit + ((input.monthlyRent * 12) / input.annualOpportunityRate)
      : Number.POSITIVE_INFINITY;

  const cheaperOption: HousingChoice = difference > 0 ? "jeonse" : difference < 0 ? "wolse" : "same";

  return {
    jeonseAnnualCost,
    wolseAnnualCost,
    jeonseTotalCost,
    wolseTotalCost,
    difference,
    cheaperOption,
    breakEvenMonthlyRent,
    breakEvenJeonseDeposit,
    monthlyCostGap: input.monthlyRent - breakEvenMonthlyRent,
  };
}

function resolveMonthlyDealAmount(amount: number, monthlyRent: number): number {
  const hundredTimes = amount + (monthlyRent * 100);
  return hundredTimes < 50_000_000 ? amount + (monthlyRent * 70) : hundredTimes;
}

function findTier(amount: number, tiers: BrokerageTier[]): BrokerageTier {
  return tiers.find((tier) => amount >= tier.min && (tier.max == null || amount < tier.max)) ?? tiers[tiers.length - 1]!;
}

export function calculateBrokerageFee(input: BrokerageFeeInput) {
  const dealAmount = input.dealType === "monthly"
    ? resolveMonthlyDealAmount(input.amount, input.monthlyRent)
    : input.amount;
  const tiers = input.dealType === "sale" ? SALE_BROKERAGE_TIERS : RENT_BROKERAGE_TIERS;
  const tier = findTier(dealAmount, tiers);
  const rawFee = dealAmount * tier.rate;
  const maxFee = tier.cap == null ? rawFee : Math.min(rawFee, tier.cap);

  return {
    dealAmount,
    tier,
    maxFee,
    rawFee,
    effectiveRate: dealAmount > 0 ? maxFee / dealAmount : 0,
    vatExcludedNotice: "부가가치세는 별도입니다.",
  };
}
