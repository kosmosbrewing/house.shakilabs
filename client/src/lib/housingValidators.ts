import { z } from "zod";
import { LEGAL_DELAY_INTEREST_RATE } from "@/data/delayInterest";
import type { BrokerageDealType } from "@/data/brokerageRates";
import type { HomeCount } from "@/data/acquisitionTax";
import { LEGAL_CONVERSION_RATE_CAP } from "@/data/jeonseWolseRate";
import type {
  AcquisitionTaxInput,
  BrokerageFeeInput,
  CapitalGainsTaxInput,
  DelayInterestInput,
  FirstHomeBenefitInput,
  HousingSubscriptionInput,
  JeonseVsWolseInput,
  JeonseWolseRateInput,
  PropertyTaxInput,
  HousingType,
} from "@/utils/housingCalculator";

const dealTypeValues = ["sale", "jeonse", "monthly"] as const;

export const DEFAULT_DELAY_INTEREST_INPUT: DelayInterestInput = {
  depositAmount: 300_000_000,
  overdueDays: 90,
  annualRate: LEGAL_DELAY_INTEREST_RATE,
};

export const DEFAULT_JEONSE_WOLSE_INPUT: JeonseVsWolseInput = {
  jeonseDeposit: 400_000_000,
  wolseDeposit: 50_000_000,
  monthlyRent: 1_300_000,
  annualOpportunityRate: 0.035,
  analysisYears: 2,
};

export const DEFAULT_BROKERAGE_FEE_INPUT: BrokerageFeeInput = {
  dealType: "sale",
  amount: 650_000_000,
  monthlyRent: 0,
};

export const DEFAULT_FIRST_HOME_INPUT: FirstHomeBenefitInput = {
  homePrice: 550_000_000,
  annualIncome: 60_000_000,
  isFirstHomeBuyer: true,
  isRegulatedArea: false,
  isNewlywedOrMultiChild: false,
};

export const DEFAULT_HOUSING_SUBSCRIPTION_INPUT: HousingSubscriptionInput = {
  homelessYears: 6,
  dependents: 1,
  accountYears: 4,
};

export const DEFAULT_PROPERTY_TAX_INPUT: PropertyTaxInput = {
  marketPrice: 1_200_000_000,
  isUrbanArea: true,
  ownerAge: 45,
  holdingYears: 5,
  housingType: "apartment",
};

export const DEFAULT_ACQUISITION_TAX_INPUT: AcquisitionTaxInput = {
  purchasePrice: 600_000_000,
  homeCount: 1,
  isRegulatedArea: false,
  exclusiveArea: 84,
};

export const DEFAULT_CAPITAL_GAINS_TAX_INPUT: CapitalGainsTaxInput = {
  sellPrice: 1_200_000_000,
  buyPrice: 800_000_000,
  expenseRate: 0.03,
  holdingYears: 5,
  residenceYears: 3,
  isOneHousehold: true,
  isRegulatedArea: false,
};

const delayInterestSchema = z.object({
  depositAmount: z.number().int().min(1_000_000).max(5_000_000_000),
  overdueDays: z.number().int().min(1).max(730),
  annualRate: z.number().min(0.01).max(0.3),
});

const jeonseWolseSchema = z.object({
  jeonseDeposit: z.number().int().min(10_000_000).max(5_000_000_000),
  wolseDeposit: z.number().int().min(0).max(1_000_000_000),
  monthlyRent: z.number().int().min(0).max(20_000_000),
  annualOpportunityRate: z.number().min(0.005).max(0.2),
  analysisYears: z.number().int().min(1).max(10),
});

const brokerageFeeSchema = z.object({
  dealType: z.enum(dealTypeValues),
  amount: z.number().int().min(0).max(10_000_000_000),
  monthlyRent: z.number().int().min(0).max(20_000_000),
});

const firstHomeSchema = z.object({
  homePrice: z.number().int().min(100_000_000).max(2_000_000_000),
  annualIncome: z.number().int().min(0).max(300_000_000),
  isFirstHomeBuyer: z.boolean(),
  isRegulatedArea: z.boolean(),
  isNewlywedOrMultiChild: z.boolean(),
});

const housingSubscriptionSchema = z.object({
  homelessYears: z.number().min(0).max(30),
  dependents: z.number().int().min(0).max(6),
  accountYears: z.number().min(0).max(30),
});

const housingTypeValues = ["apartment", "detached"] as const;

const propertyTaxSchema = z.object({
  marketPrice: z.number().int().min(100_000_000).max(50_000_000_000),
  isUrbanArea: z.boolean(),
  ownerAge: z.number().int().min(20).max(100),
  holdingYears: z.number().int().min(0).max(50),
  housingType: z.enum(housingTypeValues),
});

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = toNumber(value);
  if (parsed == null) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function clampFloat(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = toNumber(value);
  if (parsed == null) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseDealType(value: unknown): BrokerageDealType | null {
  return typeof value === "string" && dealTypeValues.includes(value as BrokerageDealType)
    ? (value as BrokerageDealType)
    : null;
}

export function sanitizeDelayInterestInput(input: Partial<Record<keyof DelayInterestInput, unknown>>): DelayInterestInput {
  const candidate: DelayInterestInput = {
    depositAmount: clampInt(input.depositAmount, DEFAULT_DELAY_INTEREST_INPUT.depositAmount, 1_000_000, 5_000_000_000),
    overdueDays: clampInt(input.overdueDays, DEFAULT_DELAY_INTEREST_INPUT.overdueDays, 1, 730),
    annualRate: clampFloat(input.annualRate, DEFAULT_DELAY_INTEREST_INPUT.annualRate, 0.01, 0.3),
  };

  const parsed = delayInterestSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_DELAY_INTEREST_INPUT;
}

export function sanitizeJeonseVsWolseInput(input: Partial<Record<keyof JeonseVsWolseInput, unknown>>): JeonseVsWolseInput {
  const candidate: JeonseVsWolseInput = {
    jeonseDeposit: clampInt(input.jeonseDeposit, DEFAULT_JEONSE_WOLSE_INPUT.jeonseDeposit, 10_000_000, 5_000_000_000),
    wolseDeposit: clampInt(input.wolseDeposit, DEFAULT_JEONSE_WOLSE_INPUT.wolseDeposit, 0, 1_000_000_000),
    monthlyRent: clampInt(input.monthlyRent, DEFAULT_JEONSE_WOLSE_INPUT.monthlyRent, 0, 20_000_000),
    annualOpportunityRate: clampFloat(
      input.annualOpportunityRate,
      DEFAULT_JEONSE_WOLSE_INPUT.annualOpportunityRate,
      0.005,
      0.2
    ),
    analysisYears: clampInt(input.analysisYears, DEFAULT_JEONSE_WOLSE_INPUT.analysisYears, 1, 10),
  };

  const parsed = jeonseWolseSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_JEONSE_WOLSE_INPUT;
}

export function sanitizeBrokerageFeeInput(input: Partial<Record<keyof BrokerageFeeInput, unknown>>): BrokerageFeeInput {
  const dealType = parseDealType(input.dealType) ?? DEFAULT_BROKERAGE_FEE_INPUT.dealType;
  const candidate: BrokerageFeeInput = {
    dealType,
    amount: clampInt(input.amount, DEFAULT_BROKERAGE_FEE_INPUT.amount, dealType === "monthly" ? 0 : 1_000_000, 10_000_000_000),
    monthlyRent: clampInt(input.monthlyRent, DEFAULT_BROKERAGE_FEE_INPUT.monthlyRent, 0, 20_000_000),
  };

  const parsed = brokerageFeeSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_BROKERAGE_FEE_INPUT;
}

export function sanitizeFirstHomeInput(input: Partial<Record<keyof FirstHomeBenefitInput, unknown>>): FirstHomeBenefitInput {
  const candidate: FirstHomeBenefitInput = {
    homePrice: clampInt(input.homePrice, DEFAULT_FIRST_HOME_INPUT.homePrice, 100_000_000, 2_000_000_000),
    annualIncome: clampInt(input.annualIncome, DEFAULT_FIRST_HOME_INPUT.annualIncome, 0, 300_000_000),
    isFirstHomeBuyer: Boolean(input.isFirstHomeBuyer ?? DEFAULT_FIRST_HOME_INPUT.isFirstHomeBuyer),
    isRegulatedArea: Boolean(input.isRegulatedArea ?? DEFAULT_FIRST_HOME_INPUT.isRegulatedArea),
    isNewlywedOrMultiChild: Boolean(
      input.isNewlywedOrMultiChild ?? DEFAULT_FIRST_HOME_INPUT.isNewlywedOrMultiChild
    ),
  };

  const parsed = firstHomeSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_FIRST_HOME_INPUT;
}

export function sanitizeHousingSubscriptionInput(
  input: Partial<Record<keyof HousingSubscriptionInput, unknown>>
): HousingSubscriptionInput {
  const candidate: HousingSubscriptionInput = {
    homelessYears: clampFloat(
      input.homelessYears,
      DEFAULT_HOUSING_SUBSCRIPTION_INPUT.homelessYears,
      0,
      30
    ),
    dependents: clampInt(input.dependents, DEFAULT_HOUSING_SUBSCRIPTION_INPUT.dependents, 0, 6),
    accountYears: clampFloat(
      input.accountYears,
      DEFAULT_HOUSING_SUBSCRIPTION_INPUT.accountYears,
      0,
      30
    ),
  };

  const parsed = housingSubscriptionSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_HOUSING_SUBSCRIPTION_INPUT;
}

function parseHousingType(value: unknown): HousingType | null {
  return typeof value === "string" && housingTypeValues.includes(value as HousingType)
    ? (value as HousingType)
    : null;
}

export function sanitizePropertyTaxInput(
  input: Partial<Record<keyof PropertyTaxInput, unknown>>
): PropertyTaxInput {
  const candidate: PropertyTaxInput = {
    marketPrice: clampInt(input.marketPrice, DEFAULT_PROPERTY_TAX_INPUT.marketPrice, 100_000_000, 50_000_000_000),
    isUrbanArea: typeof input.isUrbanArea === "boolean" ? input.isUrbanArea : DEFAULT_PROPERTY_TAX_INPUT.isUrbanArea,
    ownerAge: clampInt(input.ownerAge, DEFAULT_PROPERTY_TAX_INPUT.ownerAge, 20, 100),
    holdingYears: clampInt(input.holdingYears, DEFAULT_PROPERTY_TAX_INPUT.holdingYears, 0, 50),
    housingType: parseHousingType(input.housingType) ?? DEFAULT_PROPERTY_TAX_INPUT.housingType,
  };

  const parsed = propertyTaxSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_PROPERTY_TAX_INPUT;
}

const capitalGainsTaxSchema = z.object({
  sellPrice: z.number().int().min(10_000_000).max(50_000_000_000),
  buyPrice: z.number().int().min(10_000_000).max(50_000_000_000),
  expenseRate: z.number().min(0).max(0.15),
  holdingYears: z.number().int().min(0).max(50),
  residenceYears: z.number().int().min(0).max(50),
  isOneHousehold: z.boolean(),
  isRegulatedArea: z.boolean(),
});

export function sanitizeCapitalGainsTaxInput(
  input: Partial<Record<keyof CapitalGainsTaxInput, unknown>>
): CapitalGainsTaxInput {
  const candidate: CapitalGainsTaxInput = {
    sellPrice: clampInt(input.sellPrice, DEFAULT_CAPITAL_GAINS_TAX_INPUT.sellPrice, 10_000_000, 50_000_000_000),
    buyPrice: clampInt(input.buyPrice, DEFAULT_CAPITAL_GAINS_TAX_INPUT.buyPrice, 10_000_000, 50_000_000_000),
    expenseRate: clampFloat(input.expenseRate, DEFAULT_CAPITAL_GAINS_TAX_INPUT.expenseRate, 0, 0.15),
    holdingYears: clampInt(input.holdingYears, DEFAULT_CAPITAL_GAINS_TAX_INPUT.holdingYears, 0, 50),
    residenceYears: clampInt(input.residenceYears, DEFAULT_CAPITAL_GAINS_TAX_INPUT.residenceYears, 0, 50),
    isOneHousehold: typeof input.isOneHousehold === "boolean" ? input.isOneHousehold : DEFAULT_CAPITAL_GAINS_TAX_INPUT.isOneHousehold,
    isRegulatedArea: typeof input.isRegulatedArea === "boolean" ? input.isRegulatedArea : DEFAULT_CAPITAL_GAINS_TAX_INPUT.isRegulatedArea,
  };

  const parsed = capitalGainsTaxSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_CAPITAL_GAINS_TAX_INPUT;
}

const homeCountValues = [1, 2, 3] as const;

const acquisitionTaxSchema = z.object({
  purchasePrice: z.number().int().min(10_000_000).max(50_000_000_000),
  homeCount: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  isRegulatedArea: z.boolean(),
  exclusiveArea: z.number().min(10).max(500),
});

function parseHomeCount(value: unknown): HomeCount | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : null;
  return n != null && homeCountValues.includes(n as HomeCount) ? (n as HomeCount) : null;
}

export function sanitizeAcquisitionTaxInput(
  input: Partial<Record<keyof AcquisitionTaxInput, unknown>>
): AcquisitionTaxInput {
  const candidate: AcquisitionTaxInput = {
    purchasePrice: clampInt(input.purchasePrice, DEFAULT_ACQUISITION_TAX_INPUT.purchasePrice, 10_000_000, 50_000_000_000),
    homeCount: parseHomeCount(input.homeCount) ?? DEFAULT_ACQUISITION_TAX_INPUT.homeCount,
    isRegulatedArea: typeof input.isRegulatedArea === "boolean" ? input.isRegulatedArea : DEFAULT_ACQUISITION_TAX_INPUT.isRegulatedArea,
    exclusiveArea: clampFloat(input.exclusiveArea, DEFAULT_ACQUISITION_TAX_INPUT.exclusiveArea, 10, 500),
  };

  const parsed = acquisitionTaxSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_ACQUISITION_TAX_INPUT;
}

// ── 임대수익률 ──

export const DEFAULT_RENTAL_YIELD_INPUT: import("@/utils/housingCalculator").RentalYieldInput = {
  purchasePrice: 500_000_000,
  deposit: 100_000_000,
  monthlyRent: 800_000,
  loanAmount: 200_000_000,
  loanRate: 0.04,
  monthlyExpense: 100_000,
  vacancyRate: 0.05,
};

const rentalYieldSchema = z.object({
  purchasePrice: z.number().int().min(10_000_000).max(50_000_000_000),
  deposit: z.number().int().min(0).max(10_000_000_000),
  monthlyRent: z.number().int().min(0).max(50_000_000),
  loanAmount: z.number().int().min(0).max(30_000_000_000),
  loanRate: z.number().min(0).max(0.2),
  monthlyExpense: z.number().int().min(0).max(10_000_000),
  vacancyRate: z.number().min(0).max(1),
});

export function sanitizeRentalYieldInput(
  input: Partial<Record<keyof import("@/utils/housingCalculator").RentalYieldInput, unknown>>
): import("@/utils/housingCalculator").RentalYieldInput {
  const d = DEFAULT_RENTAL_YIELD_INPUT;
  const candidate = {
    purchasePrice: clampInt(input.purchasePrice, d.purchasePrice, 10_000_000, 50_000_000_000),
    deposit: clampInt(input.deposit, d.deposit, 0, 10_000_000_000),
    monthlyRent: clampInt(input.monthlyRent, d.monthlyRent, 0, 50_000_000),
    loanAmount: clampInt(input.loanAmount, d.loanAmount, 0, 30_000_000_000),
    loanRate: clampFloat(input.loanRate, d.loanRate, 0, 0.2),
    monthlyExpense: clampInt(input.monthlyExpense, d.monthlyExpense, 0, 10_000_000),
    vacancyRate: clampFloat(input.vacancyRate, d.vacancyRate, 0, 1),
  };

  const parsed = rentalYieldSchema.safeParse(candidate);
  return parsed.success ? parsed.data : d;
}

// ── 전월세 전환율 ──

export const DEFAULT_JEONSE_WOLSE_RATE_INPUT: JeonseWolseRateInput = {
  jeonseDeposit: 300_000_000,
  wolseDeposit: 50_000_000,
  monthlyRent: 1_200_000,
  legalRateCap: LEGAL_CONVERSION_RATE_CAP,
};

const jeonseWolseRateSchema = z.object({
  jeonseDeposit: z.number().int().min(10_000_000).max(5_000_000_000),
  wolseDeposit: z.number().int().min(0).max(5_000_000_000),
  monthlyRent: z.number().int().min(0).max(20_000_000),
  legalRateCap: z.number().min(0.01).max(0.2),
});

export function sanitizeJeonseWolseRateInput(
  input: Partial<Record<keyof JeonseWolseRateInput, unknown>>
): JeonseWolseRateInput {
  const d = DEFAULT_JEONSE_WOLSE_RATE_INPUT;
  const candidate: JeonseWolseRateInput = {
    jeonseDeposit: clampInt(input.jeonseDeposit, d.jeonseDeposit, 10_000_000, 5_000_000_000),
    wolseDeposit: clampInt(input.wolseDeposit, d.wolseDeposit, 0, 5_000_000_000),
    monthlyRent: clampInt(input.monthlyRent, d.monthlyRent, 0, 20_000_000),
    legalRateCap: clampFloat(input.legalRateCap, d.legalRateCap, 0.01, 0.2),
  };

  const parsed = jeonseWolseRateSchema.safeParse(candidate);
  return parsed.success ? parsed.data : d;
}
