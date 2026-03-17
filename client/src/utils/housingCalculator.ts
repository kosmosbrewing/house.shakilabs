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

export interface FirstHomeBenefitInput {
  homePrice: number;
  annualIncome: number;
  isFirstHomeBuyer: boolean;
  isRegulatedArea: boolean;
  isNewlywedOrMultiChild: boolean;
}

export interface HousingSubscriptionInput {
  homelessYears: number;
  dependents: number;
  accountYears: number;
}

type HousingChoice = "jeonse" | "wolse" | "same";

function roundWon(value: number): number {
  return Math.round(value);
}

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

function getHousingAcquisitionTaxRate(homePrice: number): number {
  if (homePrice <= 600_000_000) return 0.01;
  if (homePrice >= 900_000_000) return 0.03;
  return ((homePrice / 100_000_000) * (2 / 3) - 3) / 100;
}

export function calculateFirstHomeBenefits(input: FirstHomeBenefitInput) {
  const taxRate = getHousingAcquisitionTaxRate(input.homePrice);
  const acquisitionTax = roundWon(input.homePrice * taxRate);
  const estimatedTaxRelief =
    input.isFirstHomeBuyer && input.homePrice <= 1_200_000_000
      ? Math.min(acquisitionTax, 2_000_000)
      : 0;
  const didimdolEligible = input.isFirstHomeBuyer && input.annualIncome <= 70_000_000;
  const ltvLimit = input.isRegulatedArea ? 0.7 : 0.8;
  const didimdolCap = input.isNewlywedOrMultiChild ? 400_000_000 : 300_000_000;
  const didimdolLoanAmount = didimdolEligible
    ? Math.min(roundWon(input.homePrice * ltvLimit), didimdolCap)
    : 0;
  const requiredCash = Math.max(0, input.homePrice - didimdolLoanAmount);

  return {
    taxRate,
    acquisitionTax,
    estimatedTaxRelief,
    acquisitionTaxAfterRelief: Math.max(0, acquisitionTax - estimatedTaxRelief),
    didimdolEligible,
    ltvLimit,
    didimdolCap,
    didimdolLoanAmount,
    requiredCash,
    rateDiscount: didimdolEligible ? 0.002 : 0,
  };
}

function calculateHomelessScore(homelessYears: number): number {
  if (homelessYears >= 15) return 32;
  return Math.max(2, (Math.floor(homelessYears) + 1) * 2);
}

function calculateDependentScore(dependents: number): number {
  return Math.min(35, (dependents + 1) * 5);
}

function calculateAccountScore(accountYears: number): number {
  if (accountYears < 0.5) return 1;
  if (accountYears < 1) return 2;
  return Math.min(17, Math.floor(accountYears) + 2);
}

export function calculateHousingSubscriptionScore(input: HousingSubscriptionInput) {
  const homelessScore = calculateHomelessScore(input.homelessYears);
  const dependentScore = calculateDependentScore(input.dependents);
  const accountScore = calculateAccountScore(input.accountYears);
  const totalScore = homelessScore + dependentScore + accountScore;

  return {
    homelessScore,
    dependentScore,
    accountScore,
    totalScore,
    maxPossibleScore: 84,
    remainingToMax: 84 - totalScore,
    competitivenessLabel:
      totalScore >= 60 ? "상대적으로 높은 가점" : totalScore >= 50 ? "중간 가점대" : "추첨 병행 검토",
  };
}
