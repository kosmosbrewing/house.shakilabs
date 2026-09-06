import { describe, expect, it } from "vitest";

import {
  DEFAULT_ACQUISITION_TAX_INPUT,
  DEFAULT_CAPITAL_GAINS_TAX_INPUT,
  DEFAULT_FIRST_HOME_INPUT,
  DEFAULT_HOUSING_SUBSCRIPTION_INPUT,
  DEFAULT_JEONSE_RISK_INPUT,
  DEFAULT_JEONSE_WOLSE_INPUT,
  DEFAULT_JEONSE_WOLSE_RATE_INPUT,
  DEFAULT_PROPERTY_TAX_INPUT,
  DEFAULT_RENTAL_YIELD_INPUT,
  sanitizeJeonseVsWolseInput,
} from "@/lib/housingValidators";
import {
  calculateAcquisitionTax,
  calculateBrokerageFee,
  calculateCapitalGainsTax,
  calculateFirstHomeBenefits,
  calculateHousingSubscriptionScore,
  calculateJeonseVsWolse,
  calculateJeonseWolseRate,
  calculatePropertyTax,
  calculateRentalYield,
} from "@/utils/housingCalculator";
import { calculateJeonseRisk } from "@/utils/jeonseRiskCalculator";
import {
  AUCTION_RATE_ASSUMPTION,
  AUCTION_RATE_SCENARIOS,
  HUG_COLLATERAL_RATIO,
  HUG_LIMIT_METRO,
  HUG_LIMIT_OTHER,
  JEONSE_RISK_DATA_UPDATED,
  RISK_CAUTION_RATIO,
  RISK_DANGER_RATIO,
  RISK_SEVERE_RATIO,
} from "../jeonseRisk";
import { JEONSE_WOLSE_DATA_UPDATED, OPPORTUNITY_RATE_PRESETS } from "../jeonseWolse";
import {
  BOK_BASE_RATE,
  DEPOSIT_ADJUST_STEPS,
  JEONSE_WOLSE_RATE_UPDATED,
  LEGAL_CONVERSION_RATE_CAP,
  LEGAL_RATE_SPREAD,
} from "../jeonseWolseRate";
import { HOUSING_SUBSCRIPTION_UPDATED } from "../housingSubscription";
import { RENT_BROKERAGE_TIERS, SALE_BROKERAGE_TIERS } from "../brokerageRates";
import { ACQUISITION_TAX_UPDATED } from "../acquisitionTax";
import {
  CAPITAL_GAINS_TAX_UPDATED,
  GENERAL_LONG_HOLD_MAX,
  GENERAL_LONG_HOLD_RATE_PER_YEAR,
  ONE_HOUSE_TABLE2_MIN_RESIDENCE_YEARS,
} from "../capitalGainsTax";
import { FIRST_HOME_UPDATED } from "../firstHome";
import { PROPERTY_TAX_UPDATED, SPECIAL_RATE_THRESHOLD } from "../propertyTax";
import { RENTAL_YIELD_UPDATED } from "../rentalYield";
import { BROKERAGE_DATA_UPDATED } from "../brokerageRates";
import {
  HOUSE_ACQUISITION_TAX_GUIDE,
  HOUSE_BROKERAGE_FEE_GUIDE,
  HOUSE_CAPITAL_GAINS_TAX_GUIDE,
  HOUSE_DELAY_INTEREST_GUIDE,
  HOUSE_FIRST_HOME_GUIDE,
  HOUSE_HOME_GUIDE,
  HOUSE_HOUSING_SUBSCRIPTION_GUIDE,
  HOUSE_JEONSE_RISK_GUIDE,
  HOUSE_JEONSE_VS_WOLSE_GUIDE,
  HOUSE_JEONSE_WOLSE_RATE_GUIDE,
  HOUSE_PROPERTY_TAX_GUIDE,
  HOUSE_RENTAL_YIELD_GUIDE,
  type GuideData,
} from "../seoGuides";
import { type Finding, manwon, num, pct, pp, won } from "./format";
import {
  ACQUISITION_TAX_BASIS,
  ACQUISITION_TAX_DIGEST,
  BROKERAGE_FEE_BASIS,
  BROKERAGE_FEE_DIGEST,
  CAPITAL_GAINS_BASIS,
  CAPITAL_GAINS_DIGEST,
  FIRST_HOME_BASIS,
  FIRST_HOME_DIGEST,
  HOUSING_SUBSCRIPTION_BASIS,
  HOUSING_SUBSCRIPTION_DIGEST,
  JEONSE_RISK_BASIS,
  JEONSE_RISK_DIGEST,
  JEONSE_VS_WOLSE_BASIS,
  JEONSE_VS_WOLSE_DIGEST,
  JEONSE_WOLSE_RATE_BASIS,
  JEONSE_WOLSE_RATE_DIGEST,
  PROPERTY_TAX_BASIS,
  PROPERTY_TAX_DIGEST,
  RENTAL_YIELD_BASIS,
  RENTAL_YIELD_DIGEST,
} from "./index";
import {
  BASE as JW_BASE,
  DEPOSIT_INPUT_CEILING,
  OFFER_A,
  OFFER_B,
  OFFER_TIE_RATE,
  SWAP_DEPOSIT,
  swapPayoffCut,
  tieRate,
} from "./jeonseVsWolseDigest";
import {
  BASE as JR_BASE,
  JUDGMENT_TOLERANCE,
  LARGE_GAP,
  SMALL_GAP,
  bandBottom,
  bandTop,
} from "./jeonseWolseRateDigest";
import {
  ACCOUNT_CAP_YEARS,
  BASE as HS_BASE,
  DEPENDENT_MAX_SCORE,
  HIGH_SCORE_LINE,
  HOMELESS_CAP_YEARS,
  HOMELESS_MAX_SCORE,
  ACCOUNT_MAX_SCORE,
  MAX_DEPENDENTS,
  reachableTotals,
  stepCensus,
} from "./housingSubscriptionDigest";
import {
  BASE as RK_BASE,
  DANGER_DEPOSIT,
  HIGH_RATE,
  HUG_BAND_SAMPLE,
  LOW_RATE,
  METRO_CAP_BIND_PRICE,
  MID_RATE,
  disagreementBand,
  impliesDangerScan,
  regionSplitPrice,
  shortfallAt,
} from "./jeonseRiskDigest";
import { CLIFF_ABOVE, CLIFF_BELOW, DEDUCTION_SAMPLE, PREVIOUS_TAX_SAMPLE, marketAt } from "./propertyTaxDigest";
import { HIGH_SALE, SCAN_STEP, firstTaxedSellPrice } from "./capitalGainsDigest";
import { HIGH_PRICE, LARGE_AREA, ONE_HOUSE_REFERENCE, PRICE_STEP, threeHouseMatchPrice } from "./acquisitionTaxDigest";
import { HIGH_RENT, RATE_STEP, breakEvenRent, leverageBreakEvenRate, zeroNetRate } from "./rentalYieldDigest";
import { AMOUNT_STEP, capStart, unfreezeAmount } from "./brokerageFeeDigest";
import { INCOME_CEILING, PRICE_CEILING, fullyOffsetPrice, ltvIrrelevantPrice, newlywedPayoffPrice } from "./firstHomeDigest";

// 규율: 페이지당 엔진 파생 발견 8개 이상. 법령 수치를 한 줄 인용한 문장은 발견이 아니므로,
// 발견마다 경계·차액·상쇄 같은 파생 수치가 여럿 들어 있어야 한다(숫자 토큰 4개 이상).
const MIN_FINDINGS = 8;
const MIN_NUMBER_TOKENS = 4;
const MIN_BODY_CHARS = 200;
// scaled content abuse 방지: 새 산문 전 쌍 유사도 0.5 미만, 기존 본문과는 0.85 미만
const MAX_PAIR_SIMILARITY = 0.5;
const MAX_LEGACY_SIMILARITY = 0.85;

const DIGESTS: Record<string, Finding[]> = {
  "property-tax": PROPERTY_TAX_DIGEST,
  "capital-gains-tax": CAPITAL_GAINS_DIGEST,
  "acquisition-tax": ACQUISITION_TAX_DIGEST,
  "rental-yield": RENTAL_YIELD_DIGEST,
  "brokerage-fee": BROKERAGE_FEE_DIGEST,
  "first-home": FIRST_HOME_DIGEST,
  "jeonse-vs-wolse": JEONSE_VS_WOLSE_DIGEST,
  "jeonse-wolse-rate": JEONSE_WOLSE_RATE_DIGEST,
  "housing-subscription": HOUSING_SUBSCRIPTION_DIGEST,
  "jeonse-risk": JEONSE_RISK_DIGEST,
};
const BASES: Record<string, Finding> = {
  "property-tax": PROPERTY_TAX_BASIS,
  "capital-gains-tax": CAPITAL_GAINS_BASIS,
  "acquisition-tax": ACQUISITION_TAX_BASIS,
  "rental-yield": RENTAL_YIELD_BASIS,
  "brokerage-fee": BROKERAGE_FEE_BASIS,
  "first-home": FIRST_HOME_BASIS,
  "jeonse-vs-wolse": JEONSE_VS_WOLSE_BASIS,
  "jeonse-wolse-rate": JEONSE_WOLSE_RATE_BASIS,
  "housing-subscription": HOUSING_SUBSCRIPTION_BASIS,
  "jeonse-risk": JEONSE_RISK_BASIS,
};
const ALL = Object.entries(DIGESTS).flatMap(([page, items]) => items.map((f, i) => ({ id: `${page}#${i + 1}`, ...f })));

function bigrams(text: string): Map<string, number> {
  const map = new Map<string, number>();
  const t = text.replace(/\s+/g, "");
  for (let i = 0; i < t.length - 1; i += 1) {
    const g = t.slice(i, i + 2);
    map.set(g, (map.get(g) ?? 0) + 1);
  }
  return map;
}

/** 문자 바이그램 Dice 계수 — 0(무관)~1(동일). 순서를 무시하므로 문장 재배열 복제도 잡는다. */
function similarity(a: string, b: string): number {
  const ga = bigrams(a);
  const gb = bigrams(b);
  let shared = 0;
  for (const [g, n] of ga) shared += Math.min(n, gb.get(g) ?? 0);
  const total = [...ga.values()].reduce((s, n) => s + n, 0) + [...gb.values()].reduce((s, n) => s + n, 0);
  return total === 0 ? 0 : (2 * shared) / total;
}

const bodyOf = (items: Finding[], index: number) => items[index].body;
const textOf = (items: Finding[]) => items.map((f) => `${f.h2} ${f.body}`).join("\n");

describe("파생 다이제스트 — 발견 밀도", () => {
  it("계산기 10페이지를 덮는다", () => {
    expect(Object.keys(DIGESTS).sort()).toEqual([
      "acquisition-tax", "brokerage-fee", "capital-gains-tax", "first-home", "housing-subscription",
      "jeonse-risk", "jeonse-vs-wolse", "jeonse-wolse-rate", "property-tax", "rental-yield",
    ]);
    // /jeonse-risk는 낙찰가율이 단일 가정값이라 한동안 제외했다. 엔진이 70·75·80% 세 시나리오를
    // 함께 내고 화면과 산문이 그것을 가정이라고 명시하게 되면서 다시 포함한다.
    expect(AUCTION_RATE_SCENARIOS.length).toBe(3);
  });

  it.each(Object.entries(DIGESTS))(`%s 페이지는 발견 ${MIN_FINDINGS}개 이상`, (_page, items) => {
    expect(items.length).toBeGreaterThanOrEqual(MIN_FINDINGS);
  });

  it("발견마다 파생 수치가 여럿 들어 있고 h2가 겹치지 않는다", () => {
    const seen = new Set<string>();
    for (const f of ALL) {
      const numbers = f.body.match(/\d[\d,.]*/g) ?? [];
      expect(numbers.length, f.id).toBeGreaterThanOrEqual(MIN_NUMBER_TOKENS);
      expect(f.body.length, f.id).toBeGreaterThan(MIN_BODY_CHARS);
      expect(seen.has(f.h2), f.h2).toBe(false);
      seen.add(f.h2);
    }
  });

  it("포매터가 깨진 값이나 조사 오류를 흘리지 않는다", () => {
    for (const f of [...ALL, ...Object.values(BASES)]) {
      const text = `${f.h2} ${f.body}`;
      expect(text).not.toMatch(/NaN|Infinity|undefined/);
      expect(text).not.toMatch(/원가 |원로 |원를 |원는 |%을 |%이 |%은 |%과 |%p이 |㎡은 |㎡과 /);
    }
  });

  it("갱신 주기를 약속하는 말이 없다", () => {
    const banned = /매월\s*\S*\s*(반영|갱신|업데이트)|주\s*1회|매주|정기적으로\s*(갱신|업데이트)|실시간/;
    for (const f of [...ALL, ...Object.values(BASES)]) expect(f.body, f.h2).not.toMatch(banned);
  });
});

describe("파생 다이제스트 — 복제 방지", () => {
  it(`새 산문 전 쌍 유사도 ${MAX_PAIR_SIMILARITY} 미만`, () => {
    let max = 0;
    for (let i = 0; i < ALL.length; i += 1) {
      for (let j = i + 1; j < ALL.length; j += 1) {
        const score = similarity(ALL[i].body, ALL[j].body);
        max = Math.max(max, score);
        expect(score, `${ALL[i].id} vs ${ALL[j].id}`).toBeLessThan(MAX_PAIR_SIMILARITY);
      }
    }
    expect(max).toBeGreaterThan(0);
  });

  it(`기존 가이드 본문·FAQ와 유사도 ${MAX_LEGACY_SIMILARITY} 미만`, () => {
    const digestBodies = new Set([...ALL.map((f) => f.body), ...Object.values(BASES).map((f) => f.body)]);
    const legacy = [
      HOUSE_HOME_GUIDE, HOUSE_PROPERTY_TAX_GUIDE, HOUSE_CAPITAL_GAINS_TAX_GUIDE, HOUSE_ACQUISITION_TAX_GUIDE,
      HOUSE_RENTAL_YIELD_GUIDE, HOUSE_BROKERAGE_FEE_GUIDE, HOUSE_FIRST_HOME_GUIDE, HOUSE_JEONSE_VS_WOLSE_GUIDE,
      HOUSE_JEONSE_WOLSE_RATE_GUIDE, HOUSE_HOUSING_SUBSCRIPTION_GUIDE, HOUSE_JEONSE_RISK_GUIDE,
      HOUSE_DELAY_INTEREST_GUIDE,
    ]
      .flatMap((g) => [g.intro, ...(g.sections ?? []).map((s) => s.body), ...(g.faqs ?? []).map((q) => q.a)])
      .filter((body) => !digestBodies.has(body));
    for (const f of ALL) {
      for (const body of legacy) expect(similarity(f.body, body), f.id).toBeLessThan(MAX_LEGACY_SIMILARITY);
    }
  });
});

describe("파생 다이제스트 — 가이드 배선", () => {
  it("열 개 도구 가이드가 다이제스트와 계산 기준을 일반 섹션보다 앞에 싣는다", () => {
    const pairs: [GuideData, Finding[], Finding][] = [
      [HOUSE_PROPERTY_TAX_GUIDE, PROPERTY_TAX_DIGEST, PROPERTY_TAX_BASIS],
      [HOUSE_CAPITAL_GAINS_TAX_GUIDE, CAPITAL_GAINS_DIGEST, CAPITAL_GAINS_BASIS],
      [HOUSE_ACQUISITION_TAX_GUIDE, ACQUISITION_TAX_DIGEST, ACQUISITION_TAX_BASIS],
      [HOUSE_RENTAL_YIELD_GUIDE, RENTAL_YIELD_DIGEST, RENTAL_YIELD_BASIS],
      [HOUSE_BROKERAGE_FEE_GUIDE, BROKERAGE_FEE_DIGEST, BROKERAGE_FEE_BASIS],
      [HOUSE_FIRST_HOME_GUIDE, FIRST_HOME_DIGEST, FIRST_HOME_BASIS],
      [HOUSE_JEONSE_VS_WOLSE_GUIDE, JEONSE_VS_WOLSE_DIGEST, JEONSE_VS_WOLSE_BASIS],
      [HOUSE_JEONSE_WOLSE_RATE_GUIDE, JEONSE_WOLSE_RATE_DIGEST, JEONSE_WOLSE_RATE_BASIS],
      [HOUSE_HOUSING_SUBSCRIPTION_GUIDE, HOUSING_SUBSCRIPTION_DIGEST, HOUSING_SUBSCRIPTION_BASIS],
      [HOUSE_JEONSE_RISK_GUIDE, JEONSE_RISK_DIGEST, JEONSE_RISK_BASIS],
    ];
    for (const [guide, digest, basis] of pairs) {
      expect(guide.sections!.slice(0, digest.length)).toEqual(digest);
      expect(guide.sections![digest.length]).toEqual(basis);
      expect(guide.sections!.length).toBeGreaterThan(digest.length + 1);
    }
  });

  it("홈과 아직 승격하지 않은 계산기 가이드에는 다이제스트가 섞이지 않는다", () => {
    for (const guide of [HOUSE_HOME_GUIDE, HOUSE_DELAY_INTEREST_GUIDE]) {
      expect(guide.sections!.some((s) => s.h2 === "위 발견의 계산 기준")).toBe(false);
    }
  });

  it("계산 기준 문단은 페이지마다 다르고 각자의 확인일을 적는다", () => {
    const dates: Record<string, string> = {
      "property-tax": PROPERTY_TAX_UPDATED,
      "capital-gains-tax": CAPITAL_GAINS_TAX_UPDATED,
      "acquisition-tax": ACQUISITION_TAX_UPDATED,
      "rental-yield": RENTAL_YIELD_UPDATED,
      "brokerage-fee": BROKERAGE_DATA_UPDATED,
      "first-home": FIRST_HOME_UPDATED,
      "jeonse-vs-wolse": JEONSE_WOLSE_DATA_UPDATED,
      "jeonse-wolse-rate": JEONSE_WOLSE_RATE_UPDATED,
      "housing-subscription": HOUSING_SUBSCRIPTION_UPDATED,
      "jeonse-risk": JEONSE_RISK_DATA_UPDATED,
    };
    const bodies = new Set<string>();
    for (const [page, basis] of Object.entries(BASES)) {
      expect(basis.h2).toBe("위 발견의 계산 기준");
      expect(basis.body, page).toContain(dates[page]);
      bodies.add(basis.body);
    }
    expect(bodies.size).toBe(10);
  });
});

// card #56 방식: 산문에 인용된 수치가 엔진을 독립적으로 다시 돌린 값과 일치해야 한다.
// 여기서 어긋나면 엔진이 바뀌었는데 문장이 낡은 것이다.
describe("파생 다이제스트 — 인용 수치 엔진 재계산 일치", () => {
  const pt = (patch: Partial<typeof DEFAULT_PROPERTY_TAX_INPUT>) =>
    calculatePropertyTax({ ...DEFAULT_PROPERTY_TAX_INPUT, ...patch });

  it("/property-tax: 특례 경계·주택 유형·공제 상쇄·세부담상한", () => {
    const below = pt({ marketPrice: CLIFF_BELOW });
    const above = pt({ marketPrice: CLIFF_ABOVE });
    expect(below.isSpecialRate).toBe(true);
    expect(above.isSpecialRate).toBe(false);
    expect(bodyOf(PROPERTY_TAX_DIGEST, 0)).toContain(won(below.propertyTaxTotal));
    expect(bodyOf(PROPERTY_TAX_DIGEST, 0)).toContain(won(above.propertyTaxTotal));
    // 산문이 "약"으로 적는 경계 시가는 만원 단위 안에서 특례 적용이 갈리는 지점이어야 한다
    const boundary = marketAt(SPECIAL_RATE_THRESHOLD);
    expect(pt({ marketPrice: boundary }).isSpecialRate).toBe(false);
    expect(pt({ marketPrice: boundary - 10_000 }).isSpecialRate).toBe(true);

    const apartment = pt({ marketPrice: 2_000_000_000 });
    const detached = pt({ marketPrice: 2_000_000_000, housingType: "detached" });
    expect(bodyOf(PROPERTY_TAX_DIGEST, 3)).toContain(won(apartment.propertyTaxTotal));
    expect(bodyOf(PROPERTY_TAX_DIGEST, 3)).toContain(won(detached.propertyTaxTotal));

    const young = pt({ marketPrice: DEDUCTION_SAMPLE, ownerAge: 50, holdingYears: 0 });
    const senior = pt({ marketPrice: DEDUCTION_SAMPLE, ownerAge: 70, holdingYears: 15 });
    expect(senior.totalDeductionRate).toBe(0.8);
    expect(bodyOf(PROPERTY_TAX_DIGEST, 4)).toContain(won(young.annualTotal));
    expect(bodyOf(PROPERTY_TAX_DIGEST, 4)).toContain(won(senior.annualTotal));

    const capped = pt({ marketPrice: DEDUCTION_SAMPLE, previousYearPropertyTax: PREVIOUS_TAX_SAMPLE });
    expect(capped.compTaxTotal).toBe(0);
    expect(bodyOf(PROPERTY_TAX_DIGEST, 6)).toContain(won(capped.annualTotal));
  });

  const cg = (patch: Partial<typeof DEFAULT_CAPITAL_GAINS_TAX_INPUT>) =>
    calculateCapitalGainsTax({ ...DEFAULT_CAPITAL_GAINS_TAX_INPUT, ...patch });

  it("/capital-gains-tax: 보유 절벽·과세 시작가·거주 공제·세대 요건", () => {
    expect(bodyOf(CAPITAL_GAINS_DIGEST, 0)).toContain(won(cg({ holdingYears: 0.9 }).totalTax));
    expect(bodyOf(CAPITAL_GAINS_DIGEST, 0)).toContain(won(cg({ holdingYears: 1.9 }).totalTax));
    expect(cg({ holdingYears: 2 }).totalTax).toBe(0);

    const first = firstTaxedSellPrice();
    expect(cg({ sellPrice: first }).totalTax).toBeGreaterThan(0);
    expect(cg({ sellPrice: first - SCAN_STEP }).totalTax).toBe(0);
    expect(CAPITAL_GAINS_DIGEST[1].h2).toContain(manwon(first - SCAN_STEP));

    // 표 2(보유+거주 최대 80%)는 거주 2년 이상인 1세대 1주택만 쓴다 — 소득세법 시행령 제159조의4.
    // 거주 요건을 빼고 표 2를 적용하면 전세를 준 장기보유 사례에서 세금이 과소 추정된다.
    const none = cg({ sellPrice: HIGH_SALE, holdingYears: 10, residenceYears: 0 });
    const justUnder = cg({ sellPrice: HIGH_SALE, holdingYears: 10, residenceYears: ONE_HOUSE_TABLE2_MIN_RESIDENCE_YEARS - 1 });
    const justMet = cg({ sellPrice: HIGH_SALE, holdingYears: 10, residenceYears: ONE_HOUSE_TABLE2_MIN_RESIDENCE_YEARS });
    expect(none.longTermDeductionTable).toBe("1");
    expect(justUnder.longTermDeductionTable).toBe("1");
    expect(justMet.longTermDeductionTable).toBe("2");
    expect(none.longTermDeductionRate).toBeCloseTo(10 * GENERAL_LONG_HOLD_RATE_PER_YEAR, 10);
    expect(justMet.totalTax).toBeLessThan(justUnder.totalTax);
    expect(bodyOf(CAPITAL_GAINS_DIGEST, 2)).toContain(won(none.totalTax));
    expect(bodyOf(CAPITAL_GAINS_DIGEST, 2)).toContain(won(justMet.totalTax));
    // 거주 없이 보유만 길게 가면 표 1 상한 30%에서 멈춘다 — 15년이든 20년이든 세액이 같다
    const holdOnly20 = cg({ sellPrice: HIGH_SALE, holdingYears: 20, residenceYears: 0 });
    const holdOnly15 = cg({ sellPrice: HIGH_SALE, holdingYears: 15, residenceYears: 0 });
    expect(holdOnly20.longTermDeductionRate).toBe(GENERAL_LONG_HOLD_MAX);
    expect(holdOnly20.totalTax).toBe(holdOnly15.totalTax);
    expect(bodyOf(CAPITAL_GAINS_DIGEST, 3)).toContain(won(holdOnly20.totalTax));
    // 표 2 안에서는 보유·거주가 대칭이라 맞바꿔도 세액이 같다
    expect(cg({ sellPrice: HIGH_SALE, holdingYears: 10, residenceYears: 3 }).totalTax)
      .toBe(cg({ sellPrice: HIGH_SALE, holdingYears: 3, residenceYears: 10 }).totalTax);
    expect(bodyOf(CAPITAL_GAINS_DIGEST, 4)).toContain(won(cg({ sellPrice: HIGH_SALE, isOneHousehold: false }).totalTax));
    expect(bodyOf(CAPITAL_GAINS_DIGEST, 7)).toContain(won(cg({ holdingYears: 2.9, isOneHousehold: false }).totalTax));
  });

  const aq = (patch: Partial<typeof DEFAULT_ACQUISITION_TAX_INPUT>) =>
    calculateAcquisitionTax({ ...DEFAULT_ACQUISITION_TAX_INPUT, ...patch });

  it("/acquisition-tax: 면적 경계·중과 동률 가격·부가세 불변", () => {
    const nine = 900_000_000;
    expect(aq({ purchasePrice: nine, exclusiveArea: 85 }).totalTax).toBe(aq({ purchasePrice: nine, exclusiveArea: 84 }).totalTax);
    const over = aq({ purchasePrice: nine, exclusiveArea: 86 });
    expect(over.ruralTax).toBeGreaterThan(0);
    expect(bodyOf(ACQUISITION_TAX_DIGEST, 0)).toContain(won(over.totalTax));

    const reference = aq({ purchasePrice: ONE_HOUSE_REFERENCE }).totalTax;
    const match = threeHouseMatchPrice();
    expect(aq({ purchasePrice: match, homeCount: 3 }).totalTax).toBeGreaterThanOrEqual(reference);
    expect(aq({ purchasePrice: match - PRICE_STEP, homeCount: 3 }).totalTax).toBeLessThan(reference);
    expect(bodyOf(ACQUISITION_TAX_DIGEST, 2)).toContain(won(reference));

    const plain = aq({ purchasePrice: HIGH_PRICE, homeCount: 2 });
    const regulated = aq({ purchasePrice: HIGH_PRICE, homeCount: 2, isRegulatedArea: true });
    expect(regulated.localEducationTax).toBe(plain.localEducationTax);
    expect(bodyOf(ACQUISITION_TAX_DIGEST, 3)).toContain(won(regulated.totalTax));
    // 농어촌특별세는 중과분에 두 배 세율이 붙어 면적 조건에서만 나타난다
    const large = aq({ purchasePrice: HIGH_PRICE, homeCount: 3, isRegulatedArea: true, exclusiveArea: LARGE_AREA });
    expect(bodyOf(ACQUISITION_TAX_DIGEST, 5)).toContain(won(large.ruralTax));
  });

  const ry = (patch: Partial<typeof DEFAULT_RENTAL_YIELD_INPUT>) =>
    calculateRentalYield({ ...DEFAULT_RENTAL_YIELD_INPUT, ...patch });

  it("/rental-yield: 손익분기 월세·레버리지 상한 금리·역전 조합", () => {
    const rent = breakEvenRent();
    expect(ry({ monthlyRent: rent }).annualNetIncome).toBeGreaterThanOrEqual(0);
    expect(ry({ monthlyRent: rent - 1 }).annualNetIncome).toBeLessThan(0);
    expect(bodyOf(RENTAL_YIELD_DIGEST, 0)).toContain(won(rent));

    const cash = ry({ loanAmount: 0 }).roe;
    const threshold = leverageBreakEvenRate();
    expect(ry({ loanRate: threshold }).roe).toBeGreaterThanOrEqual(cash);
    expect(ry({ loanRate: threshold + RATE_STEP }).roe).toBeLessThan(cash);
    expect(RENTAL_YIELD_DIGEST[1].h2).toContain(pct(threshold));

    // 더 많이 빌리고 이자도 더 내는데 ROE가 높은 조합이 실제로 존재한다
    const two = ry({ monthlyRent: HIGH_RENT, loanAmount: 200_000_000, loanRate: 0.06 });
    const three = ry({ monthlyRent: HIGH_RENT, loanAmount: 300_000_000, loanRate: 0.045 });
    expect(three.annualLoanInterest).toBeGreaterThan(two.annualLoanInterest);
    expect(three.annualNetIncome).toBeLessThan(two.annualNetIncome);
    expect(three.roe).toBeGreaterThan(two.roe);
    expect(bodyOf(RENTAL_YIELD_DIGEST, 2)).toContain(pp(three.roe - two.roe));

    const flip = zeroNetRate(300_000_000);
    expect(ry({ loanAmount: 300_000_000, loanRate: flip }).annualNetIncome).toBeGreaterThanOrEqual(0);
    expect(ry({ loanAmount: 300_000_000, loanRate: flip + RATE_STEP }).annualNetIncome).toBeLessThan(0);
    expect(bodyOf(RENTAL_YIELD_DIGEST, 6)).toContain(pct(flip));
  });

  it("/brokerage-fee: 구간 절벽·한도 고정 구간·월세 환산 점프", () => {
    const nine = SALE_BROKERAGE_TIERS[3];
    const below = calculateBrokerageFee({ dealType: "sale", amount: nine.min - AMOUNT_STEP, monthlyRent: 0 });
    const at = calculateBrokerageFee({ dealType: "sale", amount: nine.min, monthlyRent: 0 });
    expect(bodyOf(BROKERAGE_FEE_DIGEST, 0)).toContain(won(below.maxFee));
    expect(bodyOf(BROKERAGE_FEE_DIGEST, 0)).toContain(won(at.maxFee));

    const start = capStart(SALE_BROKERAGE_TIERS, 1);
    const end = unfreezeAmount(SALE_BROKERAGE_TIERS, 1);
    const cap = SALE_BROKERAGE_TIERS[1].cap!;
    expect(calculateBrokerageFee({ dealType: "sale", amount: start, monthlyRent: 0 }).rawFee).toBeGreaterThanOrEqual(cap);
    expect(calculateBrokerageFee({ dealType: "sale", amount: start - AMOUNT_STEP, monthlyRent: 0 }).rawFee).toBeLessThan(cap);
    expect(calculateBrokerageFee({ dealType: "sale", amount: end, monthlyRent: 0 }).maxFee).toBeGreaterThan(cap);
    expect(calculateBrokerageFee({ dealType: "sale", amount: end - AMOUNT_STEP, monthlyRent: 0 }).maxFee).toBe(cap);
    expect(bodyOf(BROKERAGE_FEE_DIGEST, 1)).toContain(manwon(start));

    const low = calculateBrokerageFee({ dealType: "monthly", amount: 10_000_000, monthlyRent: 390_000 });
    const high = calculateBrokerageFee({ dealType: "monthly", amount: 10_000_000, monthlyRent: 400_000 });
    expect(high.dealAmount - low.dealAmount).toBeGreaterThan(0);
    expect(bodyOf(BROKERAGE_FEE_DIGEST, 4)).toContain(won(high.dealAmount - low.dealAmount));

    // 매매와 전세 요율이 겹치는 구간에서는 같은 금액의 보수가 일치한다
    const overlap = RENT_BROKERAGE_TIERS[3].min + 100_000_000;
    expect(calculateBrokerageFee({ dealType: "sale", amount: overlap, monthlyRent: 0 }).maxFee)
      .toBe(calculateBrokerageFee({ dealType: "jeonse", amount: overlap, monthlyRent: 0 }).maxFee);
    expect(textOf(BROKERAGE_FEE_DIGEST)).toContain(manwon(RENT_BROKERAGE_TIERS[3].min));
  });

  const fh = (patch: Partial<typeof DEFAULT_FIRST_HOME_INPUT>) =>
    calculateFirstHomeBenefits({ ...DEFAULT_FIRST_HOME_INPUT, ...patch });

  it("/first-home: 감면 컷오프·소득 컷오프·LTV 소멸 가격·한도 발효 가격", () => {
    expect(fh({ homePrice: PRICE_CEILING }).estimatedTaxRelief).toBe(2_000_000);
    expect(fh({ homePrice: PRICE_CEILING + 1 }).estimatedTaxRelief).toBe(0);
    expect(bodyOf(FIRST_HOME_DIGEST, 0)).toContain(won(fh({ homePrice: PRICE_CEILING }).acquisitionTaxAfterRelief));

    const eligible = fh({ annualIncome: INCOME_CEILING });
    const over = fh({ annualIncome: INCOME_CEILING + 1 });
    expect(over.didimdolLoanAmount).toBe(0);
    expect(bodyOf(FIRST_HOME_DIGEST, 1)).toContain(won(eligible.didimdolLoanAmount));
    expect(bodyOf(FIRST_HOME_DIGEST, 1)).toContain(won(over.requiredCash));

    const ltvPrice = ltvIrrelevantPrice();
    expect(fh({ homePrice: ltvPrice, isRegulatedArea: true }).didimdolLoanAmount).toBe(fh({ homePrice: ltvPrice }).didimdolLoanAmount);
    expect(fh({ homePrice: ltvPrice - PRICE_STEP, isRegulatedArea: true }).didimdolLoanAmount)
      .toBeLessThan(fh({ homePrice: ltvPrice - PRICE_STEP }).didimdolLoanAmount);
    expect(FIRST_HOME_DIGEST[2].h2).toContain(manwon(ltvPrice));

    const payoff = newlywedPayoffPrice();
    expect(fh({ homePrice: payoff, isNewlywedOrMultiChild: true }).didimdolLoanAmount)
      .toBeGreaterThan(fh({ homePrice: payoff }).didimdolLoanAmount);
    expect(fh({ homePrice: payoff - PRICE_STEP, isNewlywedOrMultiChild: true }).didimdolLoanAmount)
      .toBe(fh({ homePrice: payoff - PRICE_STEP }).didimdolLoanAmount);
    expect(FIRST_HOME_DIGEST[3].h2).toContain(manwon(payoff));

    const offset = fullyOffsetPrice();
    expect(fh({ homePrice: offset }).acquisitionTaxAfterRelief).toBe(0);
    expect(fh({ homePrice: offset + PRICE_STEP }).acquisitionTaxAfterRelief).toBeGreaterThan(0);
    expect(FIRST_HOME_DIGEST[4].h2).toContain(manwon(offset));
  });
});

// ── 새로 승격한 네 페이지 ──────────────────────────────
//
// 여기서 못 박는 것은 숫자가 아니라 **관계**다. 어제 다른 앱에서 나온 결함은 전부
// "엔진이 낸 숫자는 맞는데 사람이 쓴 서술이 틀린" 형태였다: 부등호가 반대이고,
// 무조건 단언이 경계 밖에서 깨지고, h3가 자기 본문과 어긋났다. 그래서
// ① 부등식·인과·비교 주장을 그대로 assert하고
// ② "언제나/반드시" 류 단언은 입력 전 범위 스캔으로 반증을 찾아 보고
// ③ h2도 본문과 같은 기준으로 검사한다(검색 스니펫에 h2만 단독 노출된다).

describe("기준 입력은 화면 기본값과 같은 값의 독립 리터럴이다", () => {
  // 같은 객체를 참조해 비교하면 이 테스트는 절대 red가 되지 않는다. 다이제스트가
  // 값을 따로 적어 두었기 때문에, 화면 기본값을 바꾸면 여기가 먼저 깨진다.
  it("네 페이지의 BASE가 화면 기본값과 일치하되 같은 객체는 아니다", () => {
    expect(JW_BASE).toEqual(DEFAULT_JEONSE_WOLSE_INPUT);
    expect(JW_BASE).not.toBe(DEFAULT_JEONSE_WOLSE_INPUT);
    expect(JR_BASE).toEqual(DEFAULT_JEONSE_WOLSE_RATE_INPUT);
    expect(JR_BASE).not.toBe(DEFAULT_JEONSE_WOLSE_RATE_INPUT);
    expect(HS_BASE).toEqual(DEFAULT_HOUSING_SUBSCRIPTION_INPUT);
    expect(HS_BASE).not.toBe(DEFAULT_HOUSING_SUBSCRIPTION_INPUT);
    expect(RK_BASE).toEqual(DEFAULT_JEONSE_RISK_INPUT);
    expect(RK_BASE).not.toBe(DEFAULT_JEONSE_RISK_INPUT);
  });

  // 리터럴 앵커: 산문이 상수를 읽어 쓰므로 상수만 바꾸면 산문과 기대값이 함께 움직여
  // 조용히 통과한다. 하드코딩한 숫자와 대조해 상수 변경이 여기서 먼저 red가 되게 한다.
  it("산문이 기대는 법령·가정 상수가 하드코딩 값과 일치한다", () => {
    expect(BOK_BASE_RATE).toBe(0.025);
    expect(LEGAL_RATE_SPREAD).toBe(0.02);
    expect(LEGAL_CONVERSION_RATE_CAP).toBe(0.045);
    expect(JR_BASE.legalRateCap).toBe(LEGAL_CONVERSION_RATE_CAP);
    expect([...DEPOSIT_ADJUST_STEPS]).toEqual([10_000_000, 30_000_000, 50_000_000, 100_000_000]);
    expect([...OPPORTUNITY_RATE_PRESETS]).toEqual([0.02, 0.03, 0.035, 0.04, 0.05]);
    expect([...AUCTION_RATE_SCENARIOS]).toEqual([0.7, 0.75, 0.8]);
    expect(AUCTION_RATE_ASSUMPTION).toBe(0.75);
    expect([RISK_CAUTION_RATIO, RISK_DANGER_RATIO, RISK_SEVERE_RATIO]).toEqual([0.7, 0.8, 0.9]);
    expect(HUG_COLLATERAL_RATIO).toBe(0.9);
    expect([HUG_LIMIT_METRO, HUG_LIMIT_OTHER]).toEqual([700_000_000, 500_000_000]);
    expect([HOMELESS_MAX_SCORE, DEPENDENT_MAX_SCORE, ACCOUNT_MAX_SCORE]).toEqual([32, 35, 17]);
    expect(DEPOSIT_INPUT_CEILING).toBe(5_000_000_000);
  });

  it("입력 상한 주장은 실제 검증기가 자르는 값과 같다", () => {
    // 산문이 "입력 상한이 50억"이라고 쓰므로 검증기에 그 이상을 넣어 실제로 잘리는지 본다
    const clamped = sanitizeJeonseVsWolseInput({ ...JW_BASE, jeonseDeposit: DEPOSIT_INPUT_CEILING + 1 });
    expect(clamped.jeonseDeposit).toBe(DEPOSIT_INPUT_CEILING);
    expect(sanitizeJeonseVsWolseInput({ ...JW_BASE, jeonseDeposit: DEPOSIT_INPUT_CEILING }).jeonseDeposit)
      .toBe(DEPOSIT_INPUT_CEILING);
  });
});

describe("/jeonse-vs-wolse — 부등식과 경계", () => {
  const jwOf = (patch: Partial<typeof DEFAULT_JEONSE_WOLSE_INPUT>) =>
    calculateJeonseVsWolse({ ...DEFAULT_JEONSE_WOLSE_INPUT, ...patch });

  it("기본 조건은 전세가 싸고 월세가 손익분기 위에 있다 (부호 방향)", () => {
    const b = jwOf({});
    expect(b.cheaperOption).toBe("jeonse");
    expect(b.difference).toBeGreaterThan(0);
    // 월세가 손익분기보다 높다 = 월세 쪽이 비싸다. 두 부호가 같은 방향이어야 서술이 성립한다.
    expect(b.monthlyCostGap).toBeGreaterThan(0);
    expect(JW_BASE.monthlyRent).toBeGreaterThan(b.breakEvenMonthlyRent);
    // 보증금 축에서도 같은 결론: 지금 전세보증금이 손익분기 보증금보다 작다
    expect(JW_BASE.jeonseDeposit).toBeLessThan(b.breakEvenJeonseDeposit);
    expect(bodyOf(JEONSE_VS_WOLSE_DIGEST, 0)).toContain(won(b.breakEvenMonthlyRent));
    expect(bodyOf(JEONSE_VS_WOLSE_DIGEST, 0)).toContain(won(b.breakEvenJeonseDeposit));
    expect(JEONSE_VS_WOLSE_DIGEST[0].h2).toContain(won(b.monthlyCostGap));
  });

  it("월세 1원 차이로 판정이 뒤집힌다", () => {
    const low = jwOf({ monthlyRent: 1_020_833 });
    const high = jwOf({ monthlyRent: 1_020_834 });
    expect(low.cheaperOption).toBe("wolse");
    expect(high.cheaperOption).toBe("jeonse");
    expect(Math.abs(low.difference)).toBeLessThan(Math.abs(jwOf({}).difference));
    expect(bodyOf(JEONSE_VS_WOLSE_DIGEST, 1)).toContain(won(low.difference));
    expect(bodyOf(JEONSE_VS_WOLSE_DIGEST, 1)).toContain(won(high.difference));
    expect(JEONSE_VS_WOLSE_DIGEST[1].h2).toContain(won(Math.abs(low.difference)));
  });

  // "분석 기간 1~10년 어디를 골라도 바뀌지 않는다"는 무조건 단언이므로 반증을 찾아 본다.
  it("분석 기간은 판정을 바꾸지 않고 누적 차액만 비례로 키운다", () => {
    let cases = 0;
    for (const jeonseDeposit of [50_000_000, 200_000_000, 400_000_000, 900_000_000]) {
      for (const wolseDeposit of [0, 50_000_000, 300_000_000]) {
        for (const monthlyRent of [0, 300_000, 1_300_000, 3_000_000]) {
          for (const annualOpportunityRate of [0.005, 0.02, 0.035, 0.08, 0.2]) {
            const at = (analysisYears: number) =>
              jwOf({ jeonseDeposit, wolseDeposit, monthlyRent, annualOpportunityRate, analysisYears });
            const first = at(1);
            cases += 1;
            for (let year = 2; year <= 10; year += 1) {
              expect(at(year).cheaperOption, `${jeonseDeposit}/${wolseDeposit}/${monthlyRent}/${annualOpportunityRate}`)
                .toBe(first.cheaperOption);
              expect(at(year).difference).toBeCloseTo(first.difference * year, 4);
            }
          }
        }
      }
    }
    expect(cases).toBe(240);
    expect(bodyOf(JEONSE_VS_WOLSE_DIGEST, 2)).toContain(num(cases));
  });

  it("월 격차와 누적 차액의 곱셈은 성립하다가 월세보증금이 더 크면 깨진다", () => {
    const b = jwOf({});
    expect(b.monthlyCostGap * 12 * JW_BASE.analysisYears).toBeCloseTo(b.difference, 4);
    const flipped = jwOf({ jeonseDeposit: 100_000_000, wolseDeposit: 200_000_000, monthlyRent: 300_000 });
    expect(flipped.breakEvenMonthlyRent).toBe(0);
    // 여기서 곱셈이 실제로 어긋나야 서술이 성립한다 — 같으면 발견 자체가 거짓이다
    expect(Math.abs(flipped.monthlyCostGap * 12 * JW_BASE.analysisYears - flipped.difference))
      .toBeGreaterThan(1);
    expect(bodyOf(JEONSE_VS_WOLSE_DIGEST, 3)).toContain(won(flipped.difference));
  });

  it("손익분기 금리는 매물의 전환율과 같고 프리셋 중 하나만 월세로 넘어간다", () => {
    const rate = tieRate();
    expect(rate).toBeCloseTo((JW_BASE.monthlyRent * 12) / (JW_BASE.jeonseDeposit - JW_BASE.wolseDeposit), 12);
    expect(jwOf({ annualOpportunityRate: rate }).cheaperOption).toBe("same");
    expect(jwOf({ annualOpportunityRate: rate - 0.0001 }).cheaperOption).toBe("jeonse");
    expect(jwOf({ annualOpportunityRate: rate + 0.0001 }).cheaperOption).toBe("wolse");
    const verdicts = OPPORTUNITY_RATE_PRESETS.map((r) => jwOf({ annualOpportunityRate: r }).cheaperOption);
    expect(verdicts).toEqual(["jeonse", "jeonse", "jeonse", "jeonse", "wolse"]);
    expect(JEONSE_VS_WOLSE_DIGEST[4].h2).toContain(pct(rate, 4));
  });

  it("보증금 맞바꿈은 등가 금액보다 1원 더 깎아야 이득으로 넘어간다", () => {
    const cut = swapPayoffCut(SWAP_DEPOSIT);
    const equivalent = (SWAP_DEPOSIT * JW_BASE.annualOpportunityRate) / 12;
    expect(cut).toBe(Math.floor(equivalent) + 1);
    const baseline = jwOf({}).difference;
    // difference가 커질수록 전세가 유리해진다 = 월세 쪽이 나빠진다
    expect(jwOf({ wolseDeposit: JW_BASE.wolseDeposit + SWAP_DEPOSIT }).difference).toBeGreaterThan(baseline);
    expect(jwOf({ wolseDeposit: JW_BASE.wolseDeposit + SWAP_DEPOSIT, monthlyRent: JW_BASE.monthlyRent - (cut - 1) }).difference)
      .toBeGreaterThan(baseline);
    expect(jwOf({ wolseDeposit: JW_BASE.wolseDeposit + SWAP_DEPOSIT, monthlyRent: JW_BASE.monthlyRent - cut }).difference)
      .toBeLessThan(baseline);
    expect(JEONSE_VS_WOLSE_DIGEST[5].h2).toContain(won(cut));
  });

  it("두 월세 매물의 순위가 실제로 뒤집히고 교차점에서 동률이 된다", () => {
    const cost = (rate: number, offer: { wolseDeposit: number; monthlyRent: number }) =>
      jwOf({ ...offer, annualOpportunityRate: rate }).wolseAnnualCost;
    expect(cost(0.02, OFFER_B)).toBeLessThan(cost(0.02, OFFER_A));
    expect(cost(0.035, OFFER_B)).toBeGreaterThan(cost(0.035, OFFER_A));
    expect(cost(OFFER_TIE_RATE, OFFER_A)).toBeCloseTo(cost(OFFER_TIE_RATE, OFFER_B), 6);
    expect(bodyOf(JEONSE_VS_WOLSE_DIGEST, 6)).toContain(won(cost(0.02, OFFER_A)));
    expect(bodyOf(JEONSE_VS_WOLSE_DIGEST, 6)).toContain(won(cost(0.035, OFFER_B)));
  });

  it("저금리에서는 손익분기 보증금이 입력 상한을 넘어 뒤집을 방법이 없다", () => {
    const reachable = jwOf({ annualOpportunityRate: 0.005 }).breakEvenJeonseDeposit;
    expect(reachable).toBeLessThanOrEqual(DEPOSIT_INPUT_CEILING);
    const unreachable = jwOf({ annualOpportunityRate: 0.005, monthlyRent: 2_100_000 }).breakEvenJeonseDeposit;
    expect(unreachable).toBeGreaterThan(DEPOSIT_INPUT_CEILING);
    // 상한까지 밀어 넣어도 여전히 전세가 이겨야 "뒤집을 방법이 없다"가 참이다
    expect(jwOf({ annualOpportunityRate: 0.005, monthlyRent: 2_100_000, jeonseDeposit: DEPOSIT_INPUT_CEILING }).cheaperOption)
      .toBe("jeonse");
    expect(bodyOf(JEONSE_VS_WOLSE_DIGEST, 7)).toContain(won(unreachable));
  });

  it("협상 환산은 두 방향에서 같은 값을 낸다", () => {
    const unit = 10_000_000;
    const monthly = (unit * JW_BASE.annualOpportunityRate) / 12;
    const depositEquivalent = (100_000 * 12) / JW_BASE.annualOpportunityRate;
    // 보증금 1,000만원 인하와 월세 monthly 인하가 같은 크기로 움직여야 한다
    const byDeposit = jwOf({ jeonseDeposit: JW_BASE.jeonseDeposit - unit }).difference - jwOf({}).difference;
    const byRent = jwOf({}).difference - jwOf({ monthlyRent: JW_BASE.monthlyRent - monthly }).difference;
    expect(byDeposit).toBeCloseTo(byRent, 4);
    expect(depositEquivalent).toBeCloseTo(100_000 / monthly * unit, 4);
    expect(bodyOf(JEONSE_VS_WOLSE_DIGEST, 8)).toContain(won(depositEquivalent));
  });
});

describe("/jeonse-wolse-rate — 밴드와 시뮬레이션", () => {
  const jrOf = (patch: Partial<typeof DEFAULT_JEONSE_WOLSE_RATE_INPUT>) =>
    calculateJeonseWolseRate({ ...DEFAULT_JEONSE_WOLSE_RATE_INPUT, ...patch });

  it("기본 조건은 상한을 넘고 초과 부담이 양수다 (부호 방향)", () => {
    const b = jrOf({});
    expect(b.judgment).toBe("excessive");
    expect(b.actualConversionRate).toBeGreaterThan(b.legalRateCap);
    expect(b.monthlyRentGap).toBeGreaterThan(0);
    expect(b.annualExcessBurden).toBe(b.monthlyRentGap * 12);
    expect(JEONSE_WOLSE_RATE_DIGEST[0].h2).toContain(pct(b.actualConversionRate));
    expect(bodyOf(JEONSE_WOLSE_RATE_DIGEST, 0)).toContain(won(b.annualExcessBurden));
  });

  it("관용 밴드의 양쪽 끝이 실제 판정 경계이고 라벨과 초과액이 어긋난다", () => {
    const top = bandTop();
    const bottom = bandBottom();
    expect(jrOf({ monthlyRent: top }).judgment).not.toBe("excessive");
    expect(jrOf({ monthlyRent: top + 1 }).judgment).toBe("excessive");
    expect(jrOf({ monthlyRent: bottom }).judgment).not.toBe("below");
    expect(jrOf({ monthlyRent: bottom - 1 }).judgment).toBe("below");
    // 발견의 핵심: 적정 판정인데 초과액이 양수인 구간이 실제로 존재한다
    const atTop = jrOf({ monthlyRent: top });
    expect(atTop.judgment).toBe("appropriate");
    expect(atTop.monthlyRentGap).toBeGreaterThan(0);
    expect(top).toBeGreaterThan(atTop.fairMonthlyRent);
    expect(JEONSE_WOLSE_RATE_DIGEST[1].h2).toContain(won(bottom));
    expect(JEONSE_WOLSE_RATE_DIGEST[1].h2).toContain(won(top));
  });

  it("밴드 폭은 보증금 차액에 비례한다", () => {
    const widthOf = (gap: number) => {
      const input = { ...JR_BASE, jeonseDeposit: JR_BASE.wolseDeposit + gap, monthlyRent: Math.round(gap / 200) };
      return bandTop(input) - bandBottom(input);
    };
    const small = widthOf(SMALL_GAP);
    const mid = widthOf(JR_BASE.jeonseDeposit - JR_BASE.wolseDeposit);
    const large = widthOf(LARGE_GAP);
    expect(small).toBeLessThan(mid);
    expect(mid).toBeLessThan(large);
    expect(large / small).toBeCloseTo(LARGE_GAP / SMALL_GAP, 1);
    expect(JEONSE_WOLSE_RATE_DIGEST[2].h2).toContain(won((JUDGMENT_TOLERANCE * SMALL_GAP) / 12));
  });

  it("시뮬레이션 네 줄이 하나의 기울기를 따른다", () => {
    const b = jrOf({});
    const slopes = b.simulations.map((s) => (b.fairMonthlyRent - s.newFairMonthlyRent) / s.adjustAmount);
    for (const slope of slopes) expect(slope).toBeCloseTo(JR_BASE.legalRateCap / 12, 12);
    expect(bodyOf(JEONSE_WOLSE_RATE_DIGEST, 3)).toContain(won((10_000_000 * JR_BASE.legalRateCap) / 12));
    // 실제 전환율로 환산하면 기울기가 더 가파르다 — 부등호 방향을 못 박는다
    expect(b.actualConversionRate).toBeGreaterThan(JR_BASE.legalRateCap);
    expect(bodyOf(JEONSE_WOLSE_RATE_DIGEST, 3)).toContain(won((10_000_000 * b.actualConversionRate) / 12));
  });

  it("보증금만 올리면 전환율과 초과 부담이 함께 나빠진다 (인과 방향)", () => {
    const b = jrOf({});
    const raised = jrOf({ wolseDeposit: JR_BASE.wolseDeposit + 50_000_000 });
    expect(raised.depositDifference).toBeLessThan(b.depositDifference);
    expect(raised.actualConversionRate).toBeGreaterThan(b.actualConversionRate);
    expect(raised.fairMonthlyRent).toBeLessThan(b.fairMonthlyRent);
    expect(raised.annualExcessBurden).toBeGreaterThan(b.annualExcessBurden);
    expect(JEONSE_WOLSE_RATE_DIGEST[4].h2).toContain(pct(raised.actualConversionRate));
  });

  it("조정표 줄 수가 보증금 차액 경계에서 계단처럼 변한다", () => {
    const exact = jrOf({ jeonseDeposit: 300_000_000, wolseDeposit: 200_000_000 });
    const oneMore = jrOf({ jeonseDeposit: 300_000_001, wolseDeposit: 200_000_000 });
    expect(exact.simulations).toHaveLength(DEPOSIT_ADJUST_STEPS.length - 1);
    expect(oneMore.simulations).toHaveLength(DEPOSIT_ADJUST_STEPS.length);
    expect(oneMore.simulations[oneMore.simulations.length - 1]!.newFairMonthlyRent).toBe(0);
    expect(bodyOf(JEONSE_WOLSE_RATE_DIGEST, 5)).toContain(num(exact.simulations.length));
  });

  it("판정은 비율만 보고 계약 크기는 보지 않는다", () => {
    const small = jrOf({ jeonseDeposit: JR_BASE.wolseDeposit + SMALL_GAP, monthlyRent: 240_000 });
    const large = jrOf({ jeonseDeposit: JR_BASE.wolseDeposit + LARGE_GAP, monthlyRent: 2_400_000 });
    expect(small.actualConversionRate).toBeCloseTo(large.actualConversionRate, 12);
    expect(small.judgment).toBe(large.judgment);
    expect(large.annualExcessBurden / small.annualExcessBurden).toBeCloseTo(LARGE_GAP / SMALL_GAP, 6);
    expect(bodyOf(JEONSE_WOLSE_RATE_DIGEST, 6)).toContain(won(small.annualExcessBurden));
    expect(bodyOf(JEONSE_WOLSE_RATE_DIGEST, 6)).toContain(won(large.annualExcessBurden));
  });

  it("상한을 낮추면 적정 월세가 내려가고 필요한 상한에서 판정이 바뀐다", () => {
    const b = jrOf({});
    const cut = jrOf({ legalRateCap: JR_BASE.legalRateCap - 0.0025 });
    expect(cut.fairMonthlyRent).toBeLessThan(b.fairMonthlyRent);
    expect(cut.annualExcessBurden).toBeGreaterThan(b.annualExcessBurden);
    const needed = Math.ceil((b.actualConversionRate - JUDGMENT_TOLERANCE) * 10_000) / 10_000;
    expect(jrOf({ legalRateCap: needed }).judgment).toBe("appropriate");
    expect(jrOf({ legalRateCap: needed - 0.0001 }).judgment).toBe("excessive");
    expect(needed - LEGAL_RATE_SPREAD).toBeGreaterThan(BOK_BASE_RATE);
    expect(JEONSE_WOLSE_RATE_DIGEST[7].h2).toContain(won(b.fairMonthlyRent - cut.fairMonthlyRent));
  });

  it("법정 상한을 기회비용 금리로 놓으면 두 계산기가 같은 월세를 낸다", () => {
    for (const jeonseDeposit of [300_000_000, 400_000_000, 620_000_000]) {
      const fair = jrOf({ jeonseDeposit }).fairMonthlyRent;
      const breakEven = calculateJeonseVsWolse({
        jeonseDeposit,
        wolseDeposit: JR_BASE.wolseDeposit,
        monthlyRent: JR_BASE.monthlyRent,
        annualOpportunityRate: JR_BASE.legalRateCap,
        analysisYears: 2,
      }).breakEvenMonthlyRent;
      expect(fair).toBe(Math.round(breakEven));
    }
    expect(bodyOf(JEONSE_WOLSE_RATE_DIGEST, 8)).toContain(won(jrOf({}).fairMonthlyRent));
  });

  it("보증금 차액이 0 이하이면 판정과 초과액이 서로 어긋난다", () => {
    for (const wolseDeposit of [100_000_000, 150_000_000]) {
      const degenerate = jrOf({ jeonseDeposit: 100_000_000, wolseDeposit });
      expect(degenerate.actualConversionRate).toBe(0);
      expect(degenerate.fairMonthlyRent).toBe(0);
      expect(degenerate.judgment).toBe("below");
      // 판정은 "상한 미만"인데 초과액은 월세 전액 — 둘이 어긋나는 것이 이 발견의 내용이다
      expect(degenerate.monthlyRentGap).toBe(JR_BASE.monthlyRent);
      expect(degenerate.annualExcessBurden).toBe(JR_BASE.monthlyRent * 12);
    }
    expect(bodyOf(JEONSE_WOLSE_RATE_DIGEST, 9)).toContain(won(JR_BASE.monthlyRent * 12));
  });
});

describe("/housing-subscription — 계단과 등가 교환", () => {
  const hsOf = (patch: Partial<typeof DEFAULT_HOUSING_SUBSCRIPTION_INPUT>) =>
    calculateHousingSubscriptionScore({ ...DEFAULT_HOUSING_SUBSCRIPTION_INPUT, ...patch });

  it("기본 30점의 잔여 점수 구성", () => {
    const b = hsOf({});
    expect(b.totalScore).toBe(30);
    expect(b.remainingToMax).toBe(84 - b.totalScore);
    expect(DEPENDENT_MAX_SCORE - b.dependentScore).toBeGreaterThan(
      (HOMELESS_MAX_SCORE - b.homelessScore) + (ACCOUNT_MAX_SCORE - b.accountScore) - 5);
    expect(bodyOf(HOUSING_SUBSCRIPTION_DIGEST, 0)).toContain(num(b.remainingToMax));
  });

  it("부양가족 1명은 통장 5년과 같고 무주택 2년보다 크며 3년보다 작다", () => {
    const b = hsOf({}).totalScore;
    const dependent = hsOf({ dependents: HS_BASE.dependents + 1 }).totalScore;
    const account = hsOf({ accountYears: HS_BASE.accountYears + 5 }).totalScore;
    expect(dependent).toBe(account);
    expect(hsOf({ homelessYears: HS_BASE.homelessYears + 2 }).totalScore).toBeLessThan(dependent);
    expect(hsOf({ homelessYears: HS_BASE.homelessYears + 3 }).totalScore).toBeGreaterThan(dependent);
    expect(dependent - b).toBe(5);
    // 등가는 상한 앞에서 깨진다 — 산문이 그 조건을 달고 있으므로 실제로 깨지는지 확인한다
    const late = hsOf({ accountYears: 13 }).totalScore;
    const lateFive = hsOf({ accountYears: 18 }).totalScore;
    expect(lateFive - late).toBeLessThan(5);
    expect(bodyOf(HOUSING_SUBSCRIPTION_DIGEST, 1)).toContain(num(lateFive));
  });

  // "부양가족 1명 이하면 60점을 못 넘는다"는 무조건 단언이므로 전 조합을 훑어 반증을 찾는다.
  it("부양가족 1명 이하로는 어떤 기간을 넣어도 60점에 닿지 못한다", () => {
    let best = 0;
    for (let homelessYears = 0; homelessYears <= 30; homelessYears += 1) {
      for (let accountYears = 0; accountYears <= 30; accountYears += 1) {
        for (const dependents of [0, 1]) {
          best = Math.max(best, hsOf({ homelessYears, accountYears, dependents }).totalScore);
        }
      }
    }
    expect(best).toBeLessThan(HIGH_SCORE_LINE);
    expect(best).toBe(59);
    const two = hsOf({ homelessYears: HOMELESS_CAP_YEARS, accountYears: ACCOUNT_CAP_YEARS, dependents: 2 });
    expect(two.totalScore).toBeGreaterThanOrEqual(HIGH_SCORE_LINE);
    expect(bodyOf(HOUSING_SUBSCRIPTION_DIGEST, 2)).toContain(num(two.totalScore));
    expect(HOUSING_SUBSCRIPTION_DIGEST[2].h2).toContain(num(HIGH_SCORE_LINE));
  });

  it("무주택과 통장은 같은 15년째에 멈춘다", () => {
    const atCap = hsOf({ homelessYears: HOMELESS_CAP_YEARS, accountYears: ACCOUNT_CAP_YEARS });
    expect(atCap.homelessScore).toBe(HOMELESS_MAX_SCORE);
    expect(atCap.accountScore).toBe(ACCOUNT_MAX_SCORE);
    const doubled = hsOf({ homelessYears: 30, accountYears: 30 });
    expect(doubled.homelessScore).toBe(atCap.homelessScore);
    expect(doubled.accountScore).toBe(atCap.accountScore);
    const justUnder = hsOf({ homelessYears: HOMELESS_CAP_YEARS - 0.01, accountYears: ACCOUNT_CAP_YEARS - 0.01 });
    expect(justUnder.totalScore).toBeLessThan(atCap.totalScore);
    expect(bodyOf(HOUSING_SUBSCRIPTION_DIGEST, 3)).toContain(num(atCap.totalScore - justUnder.totalScore));
  });

  it("연차 계단은 정수 경계에서만 오른다", () => {
    expect(hsOf({ homelessYears: 6.99 }).homelessScore).toBe(hsOf({ homelessYears: 6 }).homelessScore);
    expect(hsOf({ homelessYears: 7 }).homelessScore - hsOf({ homelessYears: 6.99 }).homelessScore).toBe(2);
    expect(hsOf({ accountYears: 0.49 }).accountScore).toBe(1);
    expect(hsOf({ accountYears: 0.5 }).accountScore).toBe(2);
    expect(hsOf({ accountYears: 1 }).accountScore).toBe(3);
    expect(HOUSING_SUBSCRIPTION_DIGEST[4].h2).toContain("6.99");
  });

  it("59점에서 정확히 60점으로 가는 조합은 소수다", () => {
    const census = stepCensus(HIGH_SCORE_LINE - 1);
    expect(census.combinations).toBeGreaterThan(0);
    expect(census.exact).toBeLessThan(census.combinations);
    expect(HOUSING_SUBSCRIPTION_DIGEST[5].h2).toContain(num(census.combinations));
    expect(HOUSING_SUBSCRIPTION_DIGEST[5].h2).toContain(num(census.combinations - census.exact));
    // 통장이 상한이면 1점짜리 걸음이 없다
    const capped = { homelessYears: HOMELESS_CAP_YEARS, accountYears: ACCOUNT_CAP_YEARS, dependents: 1 };
    expect(hsOf(capped).totalScore).toBe(HIGH_SCORE_LINE - 1);
    expect(hsOf({ ...capped, homelessYears: HOMELESS_CAP_YEARS + 1 }).totalScore).toBe(HIGH_SCORE_LINE - 1);
    expect(hsOf({ ...capped, dependents: 2 }).totalScore).toBeGreaterThan(HIGH_SCORE_LINE);
  });

  it("전혀 다른 두 이력이 같은 총점에서 만난다", () => {
    const patient = hsOf({ homelessYears: 14, dependents: 0, accountYears: 14 });
    const crowded = hsOf({ homelessYears: 4, dependents: MAX_DEPENDENTS, accountYears: 4 });
    expect(patient.totalScore).toBe(crowded.totalScore);
    expect(patient.competitivenessLabel).toBe(crowded.competitivenessLabel);
    expect(patient.homelessScore).toBeGreaterThan(crowded.homelessScore);
    expect(patient.dependentScore).toBeLessThan(crowded.dependentScore);
    expect(HOUSING_SUBSCRIPTION_DIGEST[6].h2).toContain(num(patient.totalScore));
  });

  it("정수 연차로 만들 수 없는 총점은 9점 하나뿐이다", () => {
    const reachable = reachableTotals();
    const floor = hsOf({ homelessYears: 0, dependents: 0, accountYears: 0 }).totalScore;
    const missing: number[] = [];
    for (let total = floor; total <= 84; total += 1) if (!reachable.has(total)) missing.push(total);
    expect(missing).toEqual([9]);
    expect(hsOf({ homelessYears: 0, dependents: 0, accountYears: 0.5 }).totalScore).toBe(9);
    expect(HOUSING_SUBSCRIPTION_DIGEST[7].h2).toContain(num(9));
  });

  it("만점의 시간 몫은 두 항목의 상한 합과 같다", () => {
    const timeOnly = hsOf({ homelessYears: HOMELESS_CAP_YEARS, dependents: 0, accountYears: ACCOUNT_CAP_YEARS });
    expect(timeOnly.homelessScore + timeOnly.accountScore).toBe(HOMELESS_MAX_SCORE + ACCOUNT_MAX_SCORE);
    const full = hsOf({ homelessYears: HOMELESS_CAP_YEARS, dependents: MAX_DEPENDENTS, accountYears: ACCOUNT_CAP_YEARS });
    expect(full.totalScore).toBe(84);
    expect(full.totalScore - (HOMELESS_MAX_SCORE + ACCOUNT_MAX_SCORE)).toBe(DEPENDENT_MAX_SCORE);
    expect(bodyOf(HOUSING_SUBSCRIPTION_DIGEST, 8)).toContain(num(HOMELESS_MAX_SCORE + ACCOUNT_MAX_SCORE));
  });
});

describe("/jeonse-risk — 낙찰가율 밴드", () => {
  const rkOf = (patch: Partial<typeof DEFAULT_JEONSE_RISK_INPUT>) =>
    calculateJeonseRisk({ ...DEFAULT_JEONSE_RISK_INPUT, ...patch });

  it("시나리오 행이 가정 낙찰가율을 그대로 따르고 대표값과 일치한다", () => {
    const b = rkOf({ jeonseDeposit: 430_000_000, seniorDebt: 40_000_000 });
    expect(b.auctionScenarios.map((s) => s.rate)).toEqual([...AUCTION_RATE_SCENARIOS]);
    for (const scenario of b.auctionScenarios) {
      expect(scenario.proceeds).toBe(Math.round(430_000_000 / 430_000_000 * RK_BASE.marketPrice * scenario.rate));
      expect(scenario.recovery).toBe(Math.min(430_000_000, Math.max(0, scenario.proceeds - 40_000_000)));
      expect(scenario.shortfall).toBe(430_000_000 - scenario.recovery);
    }
    const mid = b.auctionScenarios.find((s) => s.rate === AUCTION_RATE_ASSUMPTION)!;
    expect([b.auctionProceeds, b.auctionRecovery, b.auctionShortfall])
      .toEqual([mid.proceeds, mid.recovery, mid.shortfall]);
    // 부족분은 낙찰가율이 낮을수록 크다 — 부등호 방향을 못 박는다
    expect(b.auctionScenarios[0]!.shortfall).toBeGreaterThan(b.auctionScenarios[2]!.shortfall);
  });

  it("기본 조건은 세 가정 모두 부족분 0이고 가장 낮은 가정만 경계에 있다", () => {
    const b = rkOf({});
    expect(b.auctionScenarios.every((s) => s.shortfall === 0)).toBe(true);
    const oneMore = rkOf({ jeonseDeposit: RK_BASE.jeonseDeposit + 1 });
    expect(oneMore.auctionScenarios[0]!.shortfall).toBe(1);
    expect(oneMore.auctionScenarios[1]!.shortfall).toBe(0);
    expect(oneMore.auctionScenarios[2]!.shortfall).toBe(0);
    expect(shortfallAt(LOW_RATE, { jeonseDeposit: RK_BASE.jeonseDeposit + 1 })).toBe(1);
    expect(JEONSE_RISK_DIGEST[0].h2).toContain(pct(LOW_RATE, 0));
  });

  // "폭은 언제나 시세의 10%"는 무조건 단언이므로 여러 시세·선순위로 반증을 찾는다.
  it("가정이 갈리는 보증금 구간의 폭은 시세의 10%이고 선순위는 폭을 바꾸지 않는다", () => {
    for (const marketPrice of [200_000_000, 300_000_000, 500_000_000, 800_000_000, 1_300_000_000]) {
      for (const seniorDebt of [0, 50_000_000, 100_000_000, 240_000_000]) {
        const band = disagreementBand({ marketPrice, seniorDebt });
        expect(band.high - band.low).toBe(Math.round(marketPrice * HIGH_RATE) - Math.round(marketPrice * LOW_RATE));
        expect(band.high - band.low).toBeCloseTo(marketPrice * (HIGH_RATE - LOW_RATE), 6);
        // 구간 안쪽은 가정에 따라 답이 갈리고 바깥은 갈리지 않는다
        const inside = band.low + Math.floor((band.high - band.low) / 2);
        if (inside > 0) {
          const r = rkOf({ marketPrice, seniorDebt, jeonseDeposit: inside });
          expect(r.auctionScenarios[0]!.shortfall).toBeGreaterThan(0);
          expect(r.auctionScenarios[2]!.shortfall).toBe(0);
        }
      }
    }
    expect(bodyOf(JEONSE_RISK_DIGEST, 1)).toContain(won(disagreementBand().high - disagreementBand().low));
  });

  it("위험 등급 문턱과 낙찰가율 가정이 같은 부등식이다", () => {
    for (const marketPrice of [317_000_000, 500_000_000, 913_000_000]) {
      for (const seniorDebt of [0, 77_000_000, 210_000_000]) {
        const edge = Math.round(marketPrice * LOW_RATE) - seniorDebt;
        for (const jeonseDeposit of [1, edge - 1, edge, edge + 1, marketPrice]) {
          if (jeonseDeposit <= 0) continue;
          const r = rkOf({ marketPrice, seniorDebt, jeonseDeposit });
          expect(r.auctionScenarios[0]!.shortfall > 0, `${marketPrice}/${seniorDebt}/${jeonseDeposit}`)
            .toBe(r.debtRatio > RISK_CAUTION_RATIO);
        }
        expect(rkOf({ marketPrice, seniorDebt, jeonseDeposit: 1 }).safeDepositCap)
          .toBe(Math.max(0, Math.round(marketPrice * RISK_CAUTION_RATIO) - seniorDebt));
      }
    }
    const atDanger = rkOf({ jeonseDeposit: DANGER_DEPOSIT });
    expect(atDanger.riskLevel).toBe("danger");
    expect(shortfallAt(MID_RATE, { jeonseDeposit: DANGER_DEPOSIT })).toBeGreaterThan(0);
    expect(bodyOf(JEONSE_RISK_DIGEST, 2)).toContain(won(rkOf({}).safeDepositCap));
  });

  it("보증 가입 상한에 걸친 보증금은 매우 위험 등급이면서 가입 가능이다", () => {
    for (const [marketPrice, seniorDebt] of [[500_000_000, 0], [600_000_000, 50_000_000], [400_000_000, 120_000_000]] as [number, number][]) {
      const cap = rkOf({ marketPrice, seniorDebt, jeonseDeposit: 1 }).hugMaxDeposit;
      // 지역 한도가 아니라 담보인정비율이 상한을 정하는 시세여야 이 발견이 성립한다
      expect(cap).toBeLessThan(HUG_LIMIT_OTHER);
      const atCap = rkOf({ marketPrice, seniorDebt, jeonseDeposit: cap });
      expect(atCap.isHugEligible).toBe(true);
      expect(atCap.riskLevel).toBe("severe");
      expect(atCap.debtRatio).toBeCloseTo(RISK_SEVERE_RATIO, 6);
    }
    expect(bodyOf(JEONSE_RISK_DIGEST, 3)).toContain(won(rkOf({}).hugMaxDeposit));
  });

  it("지역 선택이 결과를 바꾸기 시작하는 시세를 엔진으로 확인한다", () => {
    const split = regionSplitPrice();
    expect(split).toBeGreaterThan(0);
    const below = rkOf({ marketPrice: split - 1 });
    const belowOther = rkOf({ marketPrice: split - 1, isMetropolitan: false });
    expect(below.hugMaxDeposit).toBe(belowOther.hugMaxDeposit);
    expect(below.debtRatio).toBe(belowOther.debtRatio);
    expect(below.riskLevel).toBe(belowOther.riskLevel);
    expect(rkOf({ marketPrice: split }).hugMaxDeposit)
      .not.toBe(rkOf({ marketPrice: split, isMetropolitan: false }).hugMaxDeposit);
    // 수도권 한도가 실제로 상한을 정하기 시작하는 시세도 닫힌 식이 아니라 엔진으로 확인한다
    expect(rkOf({ marketPrice: METRO_CAP_BIND_PRICE, jeonseDeposit: 1 }).hugMaxDeposit).toBe(HUG_LIMIT_METRO);
    expect(rkOf({ marketPrice: METRO_CAP_BIND_PRICE - 1, jeonseDeposit: 1 }).hugMaxDeposit).toBeLessThan(HUG_LIMIT_METRO);
    expect(JEONSE_RISK_DIGEST[4].h2).toContain(won(split - 1));
  });

  it("선순위는 전세가율만 빼고 모든 지표에 보증금과 같은 크기로 들어간다", () => {
    const debt = 100_000_000;
    const b = rkOf({});
    const withDebt = rkOf({ seniorDebt: debt });
    expect(withDebt.jeonseRatio).toBeCloseTo(b.jeonseRatio, 12);
    expect(withDebt.debtRatio - b.debtRatio).toBeCloseTo(debt / RK_BASE.marketPrice, 12);
    expect(b.hugMaxDeposit - withDebt.hugMaxDeposit).toBe(debt);
    // 부족분은 1:1이 아니다. 기본 조건은 낙찰 대금이 보증금보다 컸던 줄이 있어서 그 여유가
    // 먼저 상쇄된다 — 산문이 "회수액도 1:1"이라고 쓰면 여기서 red가 난다.
    const slack = b.auctionScenarios.map((s) => Math.max(0, s.proceeds - RK_BASE.jeonseDeposit));
    for (let i = 0; i < AUCTION_RATE_SCENARIOS.length; i += 1) {
      const delta = withDebt.auctionScenarios[i]!.shortfall - b.auctionScenarios[i]!.shortfall;
      expect(delta).toBe(debt - Math.min(debt, slack[i]!));
    }
    expect(withDebt.auctionScenarios[0]!.shortfall).toBe(debt);
    expect(withDebt.auctionScenarios[2]!.shortfall).toBeLessThan(debt);
    expect(withDebt.riskLevel).toBe("severe");
    expect(JEONSE_RISK_DIGEST[5].h2).toContain(pct(withDebt.debtRatio, 1));
  });

  it("낙찰가율 가정 폭이 시세 오차 10%보다 크게 움직인다", () => {
    const b = rkOf({});
    const lower = rkOf({ marketPrice: Math.round(RK_BASE.marketPrice * 0.9) });
    const priceEffect = b.auctionProceeds - lower.auctionProceeds;
    const rateEffect = b.auctionScenarios[2]!.proceeds - b.auctionScenarios[0]!.proceeds;
    expect(rateEffect).toBeGreaterThan(priceEffect);
    expect(lower.debtRatio).toBeGreaterThan(b.debtRatio);
    expect(bodyOf(JEONSE_RISK_DIGEST, 6)).toContain(won(priceEffect));
    expect(bodyOf(JEONSE_RISK_DIGEST, 6)).toContain(won(rateEffect));
  });

  it("가입 가능하면서 세 가정 모두 부족한 구간이 존재한다", () => {
    const b = rkOf({});
    const band = disagreementBand();
    expect(b.hugMaxDeposit).toBeGreaterThan(band.high);
    const sample = rkOf({ jeonseDeposit: HUG_BAND_SAMPLE });
    expect(HUG_BAND_SAMPLE).toBeGreaterThan(band.high);
    expect(HUG_BAND_SAMPLE).toBeLessThanOrEqual(b.hugMaxDeposit);
    expect(sample.isHugEligible).toBe(true);
    expect(sample.auctionScenarios.every((s) => s.shortfall > 0)).toBe(true);
    expect(bodyOf(JEONSE_RISK_DIGEST, 7)).toContain(won(b.hugMaxDeposit - band.high));
  });

  // "반드시 위험 이상"이라는 단언은 스캔으로 반증을 찾아야 한다. 역방향에는 예외가 있어야
  // 서술("역은 성립하지 않는다")이 참이 된다 — 둘 다 없으면 문장이 틀린 것이다.
  it("80% 가정의 부족분은 위험 등급을 함의하고 역은 성립하지 않는다", () => {
    const scan = impliesDangerScan();
    expect(scan.checked).toBeGreaterThan(400);
    expect(scan.counterexamples).toBe(0);
    expect(scan.converse).toBeGreaterThan(0);
    expect(bodyOf(JEONSE_RISK_DIGEST, 8)).toContain(num(scan.checked));
    expect(bodyOf(JEONSE_RISK_DIGEST, 8)).toContain(num(scan.converse));
  });
});

// h2는 검색 결과에 본문 없이 단독으로 노출된다(부동산은 YMYL). 본문과 같은 기준으로 검사한다.
// 파생 수치 요건은 이번에 승격한 네 페이지에만 건다 — 기존 여섯 페이지는 그 규칙 없이 쓰였고,
// 소급해 문구를 고치면 이미 라이브인 본문의 유사도 지형이 함께 흔들린다.
const PROMOTED_PAGES = new Set(["jeonse-vs-wolse", "jeonse-wolse-rate", "housing-subscription", "jeonse-risk"]);
const isPromoted = (id: string) => PROMOTED_PAGES.has(id.split("#")[0]!);

describe("h2 단독 노출 검사", () => {
  it("h2가 갱신 주기를 약속하거나 깨진 값을 흘리지 않는다", () => {
    const banned = /매월\s*\S*\s*(반영|갱신|업데이트)|주\s*1회|매주|정기적으로\s*(갱신|업데이트)|실시간/;
    for (const f of ALL) {
      expect(f.h2, f.id).not.toMatch(banned);
      expect(f.h2, f.id).not.toMatch(/NaN|Infinity|undefined/);
      expect(f.h2.length, f.id).toBeLessThan(95);
    }
  });

  it("승격한 네 페이지의 h2는 파생 수치를 하나 이상 담는다", () => {
    const promoted = ALL.filter((f) => isPromoted(f.id));
    expect(promoted.length).toBe(37);
    for (const f of promoted) expect(f.h2, f.id).toMatch(/\d/);
  });

  it("h2끼리도 서로 복제가 아니다", () => {
    for (let i = 0; i < ALL.length; i += 1) {
      for (let j = i + 1; j < ALL.length; j += 1) {
        // 승격 페이지가 낀 쌍은 본문과 같은 0.5, 기존 페이지끼리는 완화된 기준을 쓴다
        const limit = isPromoted(ALL[i].id) || isPromoted(ALL[j].id) ? MAX_PAIR_SIMILARITY : 0.6;
        expect(similarity(ALL[i].h2, ALL[j].h2), `${ALL[i].id} vs ${ALL[j].id}`).toBeLessThan(limit);
      }
    }
  });
});
