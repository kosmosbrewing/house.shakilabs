import { z } from "zod";
import {
  COMP_TAX_BURDEN_CAP_RATE,
  COMP_TAX_DEDUCTION,
  COMP_TAX_FAIR_MARKET_RATIO,
  COMP_TAX_TIERS,
  ELDERLY_DEDUCTION_TIERS,
  LOCAL_EDUCATION_TAX_RATE,
  LONG_HOLD_DEDUCTION_TIERS,
  MAX_COMBINED_DEDUCTION,
  PROPERTY_FAIR_MARKET_RATIOS,
  PROPERTY_TAX_BASE_CAP_RATE,
  PROPERTY_TAX_SPECIAL_TIERS,
  PROPERTY_TAX_STANDARD_TIERS,
  REALIZATION_RATES,
  RURAL_SPECIAL_TAX_RATE,
  SPECIAL_RATE_THRESHOLD,
  URBAN_AREA_TAX_RATE,
  type PropertyTaxTier,
} from "@/data/propertyTax";

export type HousingType = "apartment" | "detached";

export interface PropertyTaxInput {
  marketPrice: number;
  officialPrice?: number;
  previousYearOfficialPrice?: number;
  previousYearComprehensiveTax?: number;
  isUrbanArea: boolean;
  isSingleOwnerOneHome: boolean;
  previousYearPropertyTax: number;
  ownerAge: number;
  holdingYears: number;
  housingType: HousingType;
}

const supplementalAmountSchema = z.number().finite().int().min(0).max(50_000_000_000);

export function sanitizePropertyTaxAmount(value: unknown): number {
  const parsed = supplementalAmountSchema.safeParse(value);
  return parsed.success ? parsed.data : 0;
}

function roundWon(value: number): number {
  return Math.round(value);
}

function applyProgressiveTax<T extends PropertyTaxTier>(base: number, tiers: T[]) {
  const tier = tiers.find((item) => base >= item.min && (item.max == null || base < item.max))
    ?? tiers[tiers.length - 1]!;
  return { tax: Math.max(0, roundWon(base * tier.rate - tier.deduction)), tier };
}

function getPropertyFairMarketRatio(officialPrice: number): number {
  return PROPERTY_FAIR_MARKET_RATIOS.find((item) => item.max == null || officialPrice <= item.max)!.rate;
}

function getDeductionRate(value: number, tiers: readonly { rate: number; minAge?: number; minYears?: number }[]) {
  return tiers.find((item) => value >= (item.minAge ?? item.minYears ?? Number.POSITIVE_INFINITY))?.rate ?? 0;
}

export function calculatePropertyTax(input: PropertyTaxInput) {
  const realizationRate = REALIZATION_RATES[input.housingType];
  const directOfficialPrice = sanitizePropertyTaxAmount(input.officialPrice);
  const officialPrice = directOfficialPrice > 0
    ? directOfficialPrice
    : roundWon(input.marketPrice * realizationRate);
  const previousYearOfficialPrice = sanitizePropertyTaxAmount(input.previousYearOfficialPrice);
  const previousYearComprehensiveTax = sanitizePropertyTaxAmount(input.previousYearComprehensiveTax);
  const fairMarketRatio = getPropertyFairMarketRatio(officialPrice);
  const propertyTaxBaseBeforeCap = roundWon(officialPrice * fairMarketRatio);
  const propertyTaxBaseCapAmount = previousYearOfficialPrice > 0
    ? roundWon((previousYearOfficialPrice * fairMarketRatio)
      + (propertyTaxBaseBeforeCap * PROPERTY_TAX_BASE_CAP_RATE))
    : null;
  const propertyTaxBase = propertyTaxBaseCapAmount == null
    ? propertyTaxBaseBeforeCap
    : Math.min(propertyTaxBaseBeforeCap, propertyTaxBaseCapAmount);

  const isSupportedScenario = input.isSingleOwnerOneHome && input.housingType === "apartment";
  const isSpecialRate = isSupportedScenario && officialPrice <= SPECIAL_RATE_THRESHOLD;
  const propertyTiers = isSpecialRate ? PROPERTY_TAX_SPECIAL_TIERS : PROPERTY_TAX_STANDARD_TIERS;
  const propertyResult = applyProgressiveTax(propertyTaxBase, propertyTiers);
  const propertyTax = propertyResult.tax;
  const urbanAreaTax = input.isUrbanArea ? roundWon(propertyTaxBase * URBAN_AREA_TAX_RATE) : 0;
  const localEducationTax = roundWon(propertyTax * LOCAL_EDUCATION_TAX_RATE);
  const propertyTaxTotal = propertyTax + urbanAreaTax + localEducationTax;

  const compTaxablePrice = isSupportedScenario ? Math.max(0, officialPrice - COMP_TAX_DEDUCTION) : 0;
  const isCompTaxSubject = compTaxablePrice > 0;
  const compTaxBase = roundWon(compTaxablePrice * COMP_TAX_FAIR_MARKET_RATIO);
  const compResult = applyProgressiveTax(compTaxBase, COMP_TAX_TIERS);
  const compTaxAmount = isCompTaxSubject ? compResult.tax : 0;

  const totalStandardPropertyTax = applyProgressiveTax(
    propertyTaxBaseBeforeCap,
    PROPERTY_TAX_STANDARD_TIERS,
  ).tax;
  const compBaseStandardPropertyTax = roundWon(compTaxBase * fairMarketRatio * 0.004);
  const deductiblePropertyTax = totalStandardPropertyTax > 0
    ? Math.min(compTaxAmount, roundWon(propertyTax * compBaseStandardPropertyTax / totalStandardPropertyTax))
    : 0;
  const compTaxAfterPropertyTaxCredit = Math.max(0, compTaxAmount - deductiblePropertyTax);

  const elderlyDeduction = getDeductionRate(input.ownerAge, ELDERLY_DEDUCTION_TIERS);
  const longHoldDeduction = getDeductionRate(input.holdingYears, LONG_HOLD_DEDUCTION_TIERS);
  const totalDeductionRate = Math.min(elderlyDeduction + longHoldDeduction, MAX_COMBINED_DEDUCTION);
  const compTaxAfterDeduction = roundWon(compTaxAfterPropertyTaxCredit * (1 - totalDeductionRate));

  const previousTotalTax = input.previousYearPropertyTax + previousYearComprehensiveTax;
  const compTaxBurdenCapAmount = previousTotalTax > 0
    ? roundWon(previousTotalTax * COMP_TAX_BURDEN_CAP_RATE)
    : null;
  const currentTotalBeforeCap = propertyTax + compTaxAfterDeduction;
  const compTaxBurdenCapReduction = compTaxBurdenCapAmount == null
    ? 0
    : Math.min(compTaxAfterDeduction, Math.max(0, currentTotalBeforeCap - compTaxBurdenCapAmount));
  const compTaxAfterBurdenCap = compTaxAfterDeduction - compTaxBurdenCapReduction;
  const ruralSpecialTax = roundWon(compTaxAfterBurdenCap * RURAL_SPECIAL_TAX_RATE);
  const compTaxTotal = compTaxAfterBurdenCap + ruralSpecialTax;
  const annualTotal = propertyTaxTotal + compTaxTotal;

  return {
    officialPrice,
    isOfficialPriceEstimated: directOfficialPrice === 0,
    realizationRate,
    fairMarketRatio,
    propertyTaxBaseBeforeCap,
    propertyTaxBaseCapAmount,
    propertyTaxBaseCapReduction: propertyTaxBaseBeforeCap - propertyTaxBase,
    propertyTaxBase,
    propertyTaxRate: propertyResult.tier.rate,
    propertyTaxRateLabel: propertyResult.tier.label,
    propertyTax,
    urbanAreaTax,
    localEducationTax,
    propertyTaxTotal,
    isSpecialRate,
    isSupportedScenario,
    compTaxBase,
    compTaxAmount,
    compTaxTierLabel: compResult.tier.label,
    deductiblePropertyTax,
    compTaxAfterPropertyTaxCredit,
    elderlyDeduction,
    longHoldDeduction,
    totalDeductionRate,
    compTaxAfterDeduction,
    compTaxBurdenCapAmount,
    compTaxBurdenCapReduction,
    compTaxAfterBurdenCap,
    ruralSpecialTax,
    compTaxTotal,
    isCompTaxSubject,
    annualTotal,
    monthlyEquivalent: roundWon(annualTotal / 12),
  };
}
