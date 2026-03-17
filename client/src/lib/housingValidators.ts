import { z } from "zod";
import { LEGAL_DELAY_INTEREST_RATE } from "@/data/delayInterest";
import type { BrokerageDealType } from "@/data/brokerageRates";
import type {
  BrokerageFeeInput,
  DelayInterestInput,
  FirstHomeBenefitInput,
  HousingSubscriptionInput,
  JeonseVsWolseInput,
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
