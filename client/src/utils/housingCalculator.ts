import {
  RENT_BROKERAGE_TIERS,
  SALE_BROKERAGE_TIERS,
  type BrokerageDealType,
  type BrokerageTier,
} from "@/data/brokerageRates";
import {
  BASE_RATE_THRESHOLDS,
  LOCAL_EDUCATION_RATE,
  MULTI_HOME_RATES,
  RURAL_TAX_AREA_THRESHOLD,
  RURAL_TAX_BASE_RATE,
  RURAL_TAX_SURCHARGE_RATE,
  type HomeCount,
} from "@/data/acquisitionTax";
import {
  BASIC_DEDUCTION,
  GENERAL_LONG_HOLD_MAX,
  GENERAL_LONG_HOLD_MIN_YEARS,
  GENERAL_LONG_HOLD_RATE_PER_YEAR,
  INCOME_TAX_TIERS,
  ONE_HOUSE_EXEMPT_THRESHOLD,
  ONE_HOUSE_HOLD_MAX,
  ONE_HOUSE_HOLD_RATE_PER_YEAR,
  ONE_HOUSE_LONG_HOLD_MIN_YEARS,
  ONE_HOUSE_RESIDE_MAX,
  ONE_HOUSE_RESIDE_RATE_PER_YEAR,
  SHORT_TERM_RATES,
} from "@/data/capitalGainsTax";
import { DEPOSIT_ADJUST_STEPS } from "@/data/jeonseWolseRate";
import {
  REALIZATION_RATES,
  PROPERTY_FAIR_MARKET_RATIOS,
  PROPERTY_TAX_STANDARD_TIERS,
  PROPERTY_TAX_SPECIAL_TIERS,
  SPECIAL_RATE_THRESHOLD,
  COMP_TAX_DEDUCTION,
  COMP_TAX_FAIR_MARKET_RATIO,
  COMP_TAX_TIERS,
  ELDERLY_DEDUCTION_TIERS,
  LONG_HOLD_DEDUCTION_TIERS,
  MAX_COMBINED_DEDUCTION,
  URBAN_AREA_TAX_RATE,
  LOCAL_EDUCATION_TAX_RATE,
  RURAL_SPECIAL_TAX_RATE,
} from "@/data/propertyTax";

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

export type HousingType = "apartment" | "detached";

export interface PropertyTaxInput {
  marketPrice: number;
  isUrbanArea: boolean;
  ownerAge: number;
  holdingYears: number;
  housingType: HousingType;
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

// ── 재산세·종부세 계산 ──

function getPropertyFairMarketRatio(officialPrice: number): number {
  for (const tier of PROPERTY_FAIR_MARKET_RATIOS) {
    if (tier.max == null || officialPrice <= tier.max) return tier.rate;
  }
  return PROPERTY_FAIR_MARKET_RATIOS[PROPERTY_FAIR_MARKET_RATIOS.length - 1]!.rate;
}

interface ProgressiveTier {
  min: number;
  max: number | null;
  rate: number;
  deduction: number;
  label: string;
}

function applyProgressiveTax<T extends ProgressiveTier>(base: number, tiers: T[]): { tax: number; tier: T } {
  const tier = tiers.find((t) => base >= t.min && (t.max == null || base < t.max)) ?? tiers[tiers.length - 1]!;
  const tax = Math.max(0, roundWon(base * tier.rate - tier.deduction));
  return { tax, tier };
}

function getElderlyDeductionRate(age: number): number {
  for (const tier of ELDERLY_DEDUCTION_TIERS) {
    if (age >= tier.minAge) return tier.rate;
  }
  return 0;
}

function getLongHoldDeductionRate(years: number): number {
  for (const tier of LONG_HOLD_DEDUCTION_TIERS) {
    if (years >= tier.minYears) return tier.rate;
  }
  return 0;
}

export function calculatePropertyTax(input: PropertyTaxInput) {
  const realizationRate = REALIZATION_RATES[input.housingType];
  const officialPrice = roundWon(input.marketPrice * realizationRate);

  // ── 재산세 ──
  const fairMarketRatio = getPropertyFairMarketRatio(officialPrice);
  const propertyTaxBase = roundWon(officialPrice * fairMarketRatio);

  // 공시가 9억 이하: 특례세율, 초과: 일반세율
  const isSpecialRate = officialPrice <= SPECIAL_RATE_THRESHOLD;
  const tiers = isSpecialRate ? PROPERTY_TAX_SPECIAL_TIERS : PROPERTY_TAX_STANDARD_TIERS;
  const { tax: propertyTax, tier: appliedTier } = applyProgressiveTax(propertyTaxBase, tiers);

  const urbanAreaTax = input.isUrbanArea ? roundWon(propertyTaxBase * URBAN_AREA_TAX_RATE) : 0;
  const localEducationTax = roundWon(propertyTax * LOCAL_EDUCATION_TAX_RATE);
  const propertyTaxTotal = propertyTax + urbanAreaTax + localEducationTax;

  // ── 종부세 ──
  const compTaxablePrice = Math.max(0, officialPrice - COMP_TAX_DEDUCTION);
  const isCompTaxSubject = compTaxablePrice > 0;
  const compTaxBase = roundWon(compTaxablePrice * COMP_TAX_FAIR_MARKET_RATIO);

  let compTaxAmount = 0;
  let compTaxTierLabel = "";
  if (isCompTaxSubject) {
    const compResult = applyProgressiveTax(compTaxBase, COMP_TAX_TIERS);
    compTaxAmount = compResult.tax;
    compTaxTierLabel = compResult.tier.label;
  }

  // 세액공제 (1세대 1주택자만)
  const elderlyDeduction = getElderlyDeductionRate(input.ownerAge);
  const longHoldDeduction = getLongHoldDeductionRate(input.holdingYears);
  const totalDeductionRate = Math.min(elderlyDeduction + longHoldDeduction, MAX_COMBINED_DEDUCTION);

  const compTaxAfterDeduction = roundWon(compTaxAmount * (1 - totalDeductionRate));
  const ruralSpecialTax = roundWon(compTaxAfterDeduction * RURAL_SPECIAL_TAX_RATE);
  const compTaxTotal = compTaxAfterDeduction + ruralSpecialTax;

  // ── 합계 ──
  const annualTotal = propertyTaxTotal + compTaxTotal;
  const monthlyEquivalent = roundWon(annualTotal / 12);

  return {
    officialPrice,
    realizationRate,
    fairMarketRatio,
    // 재산세
    propertyTaxBase,
    propertyTaxRate: appliedTier.rate,
    propertyTaxRateLabel: appliedTier.label,
    propertyTax,
    urbanAreaTax,
    localEducationTax,
    propertyTaxTotal,
    isSpecialRate,
    // 종부세
    compTaxBase,
    compTaxAmount,
    compTaxTierLabel,
    elderlyDeduction,
    longHoldDeduction,
    totalDeductionRate,
    compTaxAfterDeduction,
    ruralSpecialTax,
    compTaxTotal,
    isCompTaxSubject,
    // 합계
    annualTotal,
    monthlyEquivalent,
  };
}

// ── 양도소득세 계산 ──

export interface CapitalGainsTaxInput {
  sellPrice: number;
  buyPrice: number;
  expenseRate: number;
  holdingYears: number;
  residenceYears: number;
  isOneHousehold: boolean;
  isRegulatedArea: boolean;
}

function calcLongTermDeductionRate(input: CapitalGainsTaxInput): number {
  if (input.isOneHousehold) {
    if (input.holdingYears < ONE_HOUSE_LONG_HOLD_MIN_YEARS) return 0;
    const holdRate = Math.min(input.holdingYears * ONE_HOUSE_HOLD_RATE_PER_YEAR, ONE_HOUSE_HOLD_MAX);
    const resideRate = Math.min(input.residenceYears * ONE_HOUSE_RESIDE_RATE_PER_YEAR, ONE_HOUSE_RESIDE_MAX);
    return holdRate + resideRate;
  }
  if (input.holdingYears < GENERAL_LONG_HOLD_MIN_YEARS) return 0;
  return Math.min(input.holdingYears * GENERAL_LONG_HOLD_RATE_PER_YEAR, GENERAL_LONG_HOLD_MAX);
}

function calcShortTermRate(holdingYears: number): number | null {
  if (holdingYears < 1) return SHORT_TERM_RATES.lessThan1Year;
  if (holdingYears < 2) return SHORT_TERM_RATES.lessThan2Years;
  return null;
}

export function calculateCapitalGainsTax(input: CapitalGainsTaxInput) {
  const expenses = roundWon(input.buyPrice * input.expenseRate);
  const capitalGain = Math.max(0, input.sellPrice - input.buyPrice - expenses);

  // 1세대1주택 비과세 처리: 양도가 12억 이하 비과세
  const isExempt = input.isOneHousehold
    && input.holdingYears >= 2
    && (!input.isRegulatedArea || input.residenceYears >= 2);

  let taxableCapitalGain = capitalGain;
  if (isExempt && input.sellPrice <= ONE_HOUSE_EXEMPT_THRESHOLD) {
    taxableCapitalGain = 0;
  } else if (isExempt && input.sellPrice > ONE_HOUSE_EXEMPT_THRESHOLD) {
    // 12억 초과분 비율만 과세
    const taxableRatio = (input.sellPrice - ONE_HOUSE_EXEMPT_THRESHOLD) / input.sellPrice;
    taxableCapitalGain = roundWon(capitalGain * taxableRatio);
  }

  // 장기보유특별공제
  const longTermDeductionRate = taxableCapitalGain > 0 ? calcLongTermDeductionRate(input) : 0;
  const longTermDeduction = roundWon(taxableCapitalGain * longTermDeductionRate);

  // 양도소득금액
  const taxableGain = Math.max(0, taxableCapitalGain - longTermDeduction);

  // 기본공제
  const basicDeduction = Math.min(taxableGain, BASIC_DEDUCTION);
  const taxBase = Math.max(0, taxableGain - basicDeduction);

  // 세율 결정: 단기(1/2년 미만) vs 누진세율
  const shortTermRate = calcShortTermRate(input.holdingYears);
  let incomeTax: number;
  let taxRate: number;
  let taxRateLabel: string;

  if (shortTermRate != null && taxBase > 0) {
    incomeTax = roundWon(taxBase * shortTermRate);
    taxRate = shortTermRate;
    taxRateLabel = input.holdingYears < 1 ? "1년 미만 70%" : "2년 미만 60%";
  } else if (taxBase > 0) {
    const tier = INCOME_TAX_TIERS.find((t) => taxBase >= t.min && (t.max == null || taxBase < t.max))
      ?? INCOME_TAX_TIERS[INCOME_TAX_TIERS.length - 1]!;
    incomeTax = Math.max(0, roundWon(taxBase * tier.rate - tier.deduction));
    taxRate = tier.rate;
    taxRateLabel = tier.label;
  } else {
    incomeTax = 0;
    taxRate = 0;
    taxRateLabel = "-";
  }

  const localTax = roundWon(incomeTax * 0.1);
  const totalTax = incomeTax + localTax;
  const afterTaxProfit = capitalGain - totalTax;
  const effectiveRate = capitalGain > 0 ? totalTax / capitalGain : 0;

  return {
    sellPrice: input.sellPrice,
    buyPrice: input.buyPrice,
    expenses,
    capitalGain,
    isExempt,
    exemptThreshold: ONE_HOUSE_EXEMPT_THRESHOLD,
    taxableCapitalGain,
    longTermDeductionRate,
    longTermDeduction,
    taxableGain,
    basicDeduction,
    taxBase,
    taxRate,
    taxRateLabel,
    incomeTax,
    localTax,
    totalTax,
    effectiveRate,
    afterTaxProfit,
  };
}

// ── 취득세 계산 ──

export interface AcquisitionTaxInput {
  purchasePrice: number;
  homeCount: HomeCount;
  isRegulatedArea: boolean;
  exclusiveArea: number;
}

function getBaseAcquisitionRate(price: number): number {
  if (price <= BASE_RATE_THRESHOLDS.low) return BASE_RATE_THRESHOLDS.lowRate;
  if (price >= BASE_RATE_THRESHOLDS.high) return BASE_RATE_THRESHOLDS.highRate;
  return ((price / 100_000_000) * (2 / 3) - 3) / 100;
}

function getEffectiveAcquisitionRate(baseRate: number, homeCount: HomeCount, isRegulated: boolean): number {
  if (homeCount === 1) return baseRate;
  if (homeCount === 2) {
    return isRegulated ? MULTI_HOME_RATES.regulated2 : baseRate;
  }
  // 3주택 이상
  return isRegulated ? MULTI_HOME_RATES.regulated3 : MULTI_HOME_RATES.nonRegulated3;
}

export function calculateAcquisitionTax(input: AcquisitionTaxInput) {
  const baseRate = getBaseAcquisitionRate(input.purchasePrice);
  const effectiveRate = getEffectiveAcquisitionRate(baseRate, input.homeCount, input.isRegulatedArea);
  const isSurcharged = effectiveRate > baseRate;
  const acquisitionTax = roundWon(input.purchasePrice * effectiveRate);

  // 지방교육세: 기본세율분 × 10%
  const localEducationTax = roundWon(input.purchasePrice * baseRate * LOCAL_EDUCATION_RATE);

  // 농어촌특별세: 85㎡ 초과 시만 부과
  let ruralTax = 0;
  if (input.exclusiveArea > RURAL_TAX_AREA_THRESHOLD) {
    const basePortion = roundWon(input.purchasePrice * baseRate * RURAL_TAX_BASE_RATE);
    const surchargePortion = isSurcharged
      ? roundWon(input.purchasePrice * (effectiveRate - baseRate) * RURAL_TAX_SURCHARGE_RATE)
      : 0;
    ruralTax = basePortion + surchargePortion;
  }

  const totalTax = acquisitionTax + localEducationTax + ruralTax;
  const effectiveTotalRate = input.purchasePrice > 0 ? totalTax / input.purchasePrice : 0;

  return {
    purchasePrice: input.purchasePrice,
    baseRate,
    effectiveRate,
    isSurcharged,
    acquisitionTax,
    localEducationTax,
    ruralTax,
    totalTax,
    effectiveTotalRate,
    homeCountLabel: input.homeCount === 1 ? "1주택" : input.homeCount === 2 ? "2주택" : "3주택 이상",
    rateLabel: isSurcharged
      ? `중과 ${(effectiveRate * 100).toFixed(0)}%`
      : `${(effectiveRate * 100).toFixed(1)}%`,
  };
}

// ── 전월세 전환율 계산기 ──────────────────────────────

export interface JeonseWolseRateInput {
  /** 전세 보증금 (원) */
  jeonseDeposit: number;
  /** 월세 보증금 (원) */
  wolseDeposit: number;
  /** 월세 (원) */
  monthlyRent: number;
  /** 법정 전환율 상한 (소수, 예: 0.05 = 5%) */
  legalRateCap: number;
}

export type ConversionJudgment = "appropriate" | "excessive" | "below";

export interface DepositAdjustSimulation {
  /** 보증금 증가/감소 금액 (원) */
  adjustAmount: number;
  /** 조정 후 월세 보증금 (원) */
  newWolseDeposit: number;
  /** 조정 후 적정 월세 (원) */
  newFairMonthlyRent: number;
}

export interface JeonseWolseRateResult {
  /** 보증금 차액 = 전세보증금 - 월세보증금 */
  depositDifference: number;
  /** 실제 전환율 (소수) */
  actualConversionRate: number;
  /** 법정 전환율 상한 (소수) */
  legalRateCap: number;
  /** 판정: 적정 / 초과 / 미만 */
  judgment: ConversionJudgment;
  /** 법정 상한 기준 적정 월세 (원) */
  fairMonthlyRent: number;
  /** 현재 월세와 적정 월세의 차이 (원, 양수면 초과) */
  monthlyRentGap: number;
  /** 연간 초과 부담 (원, 양수면 초과) */
  annualExcessBurden: number;
  /** 보증금 조정 시뮬레이션 */
  simulations: DepositAdjustSimulation[];
}

export function calculateJeonseWolseRate(input: JeonseWolseRateInput): JeonseWolseRateResult {
  const { jeonseDeposit, wolseDeposit, monthlyRent, legalRateCap } = input;

  const depositDifference = jeonseDeposit - wolseDeposit;

  // 전환율 = (월세 x 12) / (전세보증금 - 월세보증금) x 100
  const actualConversionRate =
    depositDifference > 0 ? (monthlyRent * 12) / depositDifference : 0;

  // 법정 상한 기준 적정 월세
  const fairMonthlyRent =
    depositDifference > 0 ? roundWon(depositDifference * legalRateCap / 12) : 0;

  const monthlyRentGap = monthlyRent - fairMonthlyRent;
  const annualExcessBurden = monthlyRentGap * 12;

  // 판정
  let judgment: ConversionJudgment;
  // 0.1%p 이내는 적정으로 간주
  if (actualConversionRate > legalRateCap + 0.001) {
    judgment = "excessive";
  } else if (actualConversionRate < legalRateCap - 0.001) {
    judgment = "below";
  } else {
    judgment = "appropriate";
  }

  // 보증금 조정 시뮬레이션: 월세보증금을 늘렸을 때 적정 월세 변화
  const simulations: DepositAdjustSimulation[] = DEPOSIT_ADJUST_STEPS
    .filter((step) => wolseDeposit + step < jeonseDeposit)
    .map((step) => {
      const newWolseDeposit = wolseDeposit + step;
      const newDiff = jeonseDeposit - newWolseDeposit;
      const newFairMonthlyRent = roundWon(newDiff * legalRateCap / 12);
      return {
        adjustAmount: step,
        newWolseDeposit,
        newFairMonthlyRent,
      };
    });

  return {
    depositDifference,
    actualConversionRate,
    legalRateCap,
    judgment,
    fairMonthlyRent,
    monthlyRentGap,
    annualExcessBurden,
    simulations,
  };
}

// ── 임대수익률 계산기 ──────────────────────────────

export interface RentalYieldInput {
  /** 매매가 (원) */
  purchasePrice: number;
  /** 보증금 (원) */
  deposit: number;
  /** 월세 (원) */
  monthlyRent: number;
  /** 대출금액 (원) */
  loanAmount: number;
  /** 대출금리 (연, 소수) */
  loanRate: number;
  /** 월 관리비·수선비 (원) */
  monthlyExpense: number;
  /** 공실률 (0~1) */
  vacancyRate: number;
}

export interface RentalYieldResult {
  purchasePrice: number;
  deposit: number;
  monthlyRent: number;
  /** 연간 임대수입 (공실 반영 전) */
  annualRentGross: number;
  /** 공실 손실 */
  vacancyLoss: number;
  /** 연간 실 임대수입 (공실 반영 후) */
  annualRentNet: number;
  /** 연간 대출이자 */
  annualLoanInterest: number;
  /** 연간 관리비·수선비 */
  annualExpense: number;
  /** 연간 순수익 */
  annualNetIncome: number;
  /** 총투자금 = 매매가 - 대출 */
  totalInvestment: number;
  /** 자기자본 = 매매가 - 대출 - 보증금 */
  equity: number;
  /** 총수익률 (gross) = 연간임대수입 / 매매가 */
  grossYield: number;
  /** 순수익률 (net) = 순수익 / 매매가 */
  netYield: number;
  /** 자기자본수익률 (ROE) = 순수익 / 자기자본 */
  roe: number;
  /** 월 순수익 */
  monthlyNetIncome: number;
}

export function calculateRentalYield(input: RentalYieldInput): RentalYieldResult {
  const { purchasePrice, deposit, monthlyRent, loanAmount, loanRate, monthlyExpense, vacancyRate } = input;

  const annualRentGross = monthlyRent * 12;
  const vacancyLoss = Math.round(annualRentGross * vacancyRate);
  const annualRentNet = annualRentGross - vacancyLoss;

  const annualLoanInterest = Math.round(loanAmount * loanRate);
  const annualExpense = monthlyExpense * 12;

  const annualNetIncome = annualRentNet - annualLoanInterest - annualExpense;

  const totalInvestment = purchasePrice - loanAmount;
  const equity = Math.max(totalInvestment - deposit, 0);

  const grossYield = purchasePrice > 0 ? annualRentGross / purchasePrice : 0;
  const netYield = purchasePrice > 0 ? annualNetIncome / purchasePrice : 0;
  const roe = equity > 0 ? annualNetIncome / equity : 0;
  const monthlyNetIncome = Math.round(annualNetIncome / 12);

  return {
    purchasePrice,
    deposit,
    monthlyRent,
    annualRentGross,
    vacancyLoss,
    annualRentNet,
    annualLoanInterest,
    annualExpense,
    annualNetIncome,
    totalInvestment,
    equity,
    grossYield,
    netYield,
    roe,
    monthlyNetIncome,
  };
}
