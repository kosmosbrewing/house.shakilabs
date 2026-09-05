import { describe, expect, it } from "vitest";

import {
  DEFAULT_ACQUISITION_TAX_INPUT,
  DEFAULT_CAPITAL_GAINS_TAX_INPUT,
  DEFAULT_FIRST_HOME_INPUT,
  DEFAULT_PROPERTY_TAX_INPUT,
  DEFAULT_RENTAL_YIELD_INPUT,
} from "@/lib/housingValidators";
import {
  calculateAcquisitionTax,
  calculateBrokerageFee,
  calculateCapitalGainsTax,
  calculateFirstHomeBenefits,
  calculatePropertyTax,
  calculateRentalYield,
} from "@/utils/housingCalculator";
import { RENT_BROKERAGE_TIERS, SALE_BROKERAGE_TIERS } from "../brokerageRates";
import { ACQUISITION_TAX_UPDATED } from "../acquisitionTax";
import { CAPITAL_GAINS_TAX_UPDATED } from "../capitalGainsTax";
import { FIRST_HOME_UPDATED } from "../firstHome";
import { PROPERTY_TAX_UPDATED, SPECIAL_RATE_THRESHOLD } from "../propertyTax";
import { RENTAL_YIELD_UPDATED } from "../rentalYield";
import { BROKERAGE_DATA_UPDATED } from "../brokerageRates";
import {
  HOUSE_ACQUISITION_TAX_GUIDE,
  HOUSE_BROKERAGE_FEE_GUIDE,
  HOUSE_CAPITAL_GAINS_TAX_GUIDE,
  HOUSE_FIRST_HOME_GUIDE,
  HOUSE_HOME_GUIDE,
  HOUSE_JEONSE_VS_WOLSE_GUIDE,
  HOUSE_PROPERTY_TAX_GUIDE,
  HOUSE_RENTAL_YIELD_GUIDE,
  type GuideData,
} from "../seoGuides";
import { type Finding, manwon, pct, pp, won } from "./format";
import {
  ACQUISITION_TAX_BASIS,
  ACQUISITION_TAX_DIGEST,
  BROKERAGE_FEE_BASIS,
  BROKERAGE_FEE_DIGEST,
  CAPITAL_GAINS_BASIS,
  CAPITAL_GAINS_DIGEST,
  FIRST_HOME_BASIS,
  FIRST_HOME_DIGEST,
  PROPERTY_TAX_BASIS,
  PROPERTY_TAX_DIGEST,
  RENTAL_YIELD_BASIS,
  RENTAL_YIELD_DIGEST,
} from "./index";
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
};
const BASES: Record<string, Finding> = {
  "property-tax": PROPERTY_TAX_BASIS,
  "capital-gains-tax": CAPITAL_GAINS_BASIS,
  "acquisition-tax": ACQUISITION_TAX_BASIS,
  "rental-yield": RENTAL_YIELD_BASIS,
  "brokerage-fee": BROKERAGE_FEE_BASIS,
  "first-home": FIRST_HOME_BASIS,
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
  it("도구 6페이지를 덮고 /jeonse-risk는 건드리지 않는다", () => {
    expect(Object.keys(DIGESTS).sort()).toEqual([
      "acquisition-tax", "brokerage-fee", "capital-gains-tax", "first-home", "property-tax", "rental-yield",
    ]);
    // 전세보증금 위험도는 엔진에 자체 가정(담보 인정 비율)이 들어 있어 파생 발견의 근거로 쓰지 않는다.
    expect(Object.keys(DIGESTS)).not.toContain("jeonse-risk");
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
    ]
      .flatMap((g) => [g.intro, ...(g.sections ?? []).map((s) => s.body), ...(g.faqs ?? []).map((q) => q.a)])
      .filter((body) => !digestBodies.has(body));
    for (const f of ALL) {
      for (const body of legacy) expect(similarity(f.body, body), f.id).toBeLessThan(MAX_LEGACY_SIMILARITY);
    }
  });
});

describe("파생 다이제스트 — 가이드 배선", () => {
  it("여섯 도구 가이드가 다이제스트와 계산 기준을 일반 섹션보다 앞에 싣는다", () => {
    const pairs: [GuideData, Finding[], Finding][] = [
      [HOUSE_PROPERTY_TAX_GUIDE, PROPERTY_TAX_DIGEST, PROPERTY_TAX_BASIS],
      [HOUSE_CAPITAL_GAINS_TAX_GUIDE, CAPITAL_GAINS_DIGEST, CAPITAL_GAINS_BASIS],
      [HOUSE_ACQUISITION_TAX_GUIDE, ACQUISITION_TAX_DIGEST, ACQUISITION_TAX_BASIS],
      [HOUSE_RENTAL_YIELD_GUIDE, RENTAL_YIELD_DIGEST, RENTAL_YIELD_BASIS],
      [HOUSE_BROKERAGE_FEE_GUIDE, BROKERAGE_FEE_DIGEST, BROKERAGE_FEE_BASIS],
      [HOUSE_FIRST_HOME_GUIDE, FIRST_HOME_DIGEST, FIRST_HOME_BASIS],
    ];
    for (const [guide, digest, basis] of pairs) {
      expect(guide.sections!.slice(0, digest.length)).toEqual(digest);
      expect(guide.sections![digest.length]).toEqual(basis);
      expect(guide.sections!.length).toBeGreaterThan(digest.length + 1);
    }
  });

  it("홈과 다른 계산기 가이드에는 다이제스트가 섞이지 않는다", () => {
    for (const guide of [HOUSE_HOME_GUIDE, HOUSE_JEONSE_VS_WOLSE_GUIDE]) {
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
    };
    const bodies = new Set<string>();
    for (const [page, basis] of Object.entries(BASES)) {
      expect(basis.h2).toBe("위 발견의 계산 기준");
      expect(basis.body, page).toContain(dates[page]);
      bodies.add(basis.body);
    }
    expect(bodies.size).toBe(6);
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

    const none = cg({ sellPrice: HIGH_SALE, holdingYears: 10, residenceYears: 0 });
    const full = cg({ sellPrice: HIGH_SALE, holdingYears: 10, residenceYears: 10 });
    expect(bodyOf(CAPITAL_GAINS_DIGEST, 2)).toContain(won(none.totalTax));
    expect(bodyOf(CAPITAL_GAINS_DIGEST, 2)).toContain(won(full.totalTax));
    // 보유·거주는 대칭이라 맞바꿔도 세액이 같다
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
