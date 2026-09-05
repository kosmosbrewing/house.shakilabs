// /capital-gains-tax digest. The calculator answers "how much tax for this
// sale"; this file sweeps holding years, residence years, sale price, expense
// ratio and the one-household flag through the same engine and writes down the
// discontinuities — the day the bill collapses to zero, the price where the
// partial-taxation ramp finally produces a bill, and how far the residence axis
// moves a number the statute never states directly.

import {
  BASIC_DEDUCTION,
  GENERAL_LONG_HOLD_MIN_YEARS,
  CAPITAL_GAINS_TAX_UPDATED,
  GENERAL_LONG_HOLD_RATE_PER_YEAR,
  INCOME_TAX_TIERS,
  ONE_HOUSE_EXEMPT_THRESHOLD,
  ONE_HOUSE_HOLD_MAX,
  ONE_HOUSE_HOLD_RATE_PER_YEAR,
  ONE_HOUSE_RESIDE_MAX,
  SHORT_TERM_RATES,
} from "../capitalGainsTax";
import { DEFAULT_CAPITAL_GAINS_TAX_INPUT } from "@/lib/housingValidators";
import { calculateCapitalGainsTax, type CapitalGainsTaxInput } from "@/utils/housingCalculator";
import { type Finding, delta, manwon, pct, pp, times, won, years } from "./format";

export const cg = (patch: Partial<CapitalGainsTaxInput>) =>
  calculateCapitalGainsTax({ ...DEFAULT_CAPITAL_GAINS_TAX_INPUT, ...patch });

export const HIGH_SALE = 1_500_000_000;
export const SCAN_STEP = 1_000_000;

/** Lowest sale price above the exemption line whose bill is no longer zero. */
export function firstTaxedSellPrice(): number {
  for (let price = ONE_HOUSE_EXEMPT_THRESHOLD; price <= 1_400_000_000; price += SCAN_STEP) {
    if (cg({ sellPrice: price }).totalTax > 0) return price;
  }
  return 0;
}

function holdingCliff(): Finding {
  const under1 = cg({ holdingYears: 0.9 });
  const under2 = cg({ holdingYears: 1.9 });
  const exempt = cg({ holdingYears: 2 });
  return {
    h2: `보유 ${years(1.9)}과 ${years(2)} 사이에서 세금 ${won(under2.totalTax)}이 통째로 0이 된다`,
    body:
      `기본 조건(양도가 ${manwon(DEFAULT_CAPITAL_GAINS_TAX_INPUT.sellPrice)}, 취득가 ${manwon(DEFAULT_CAPITAL_GAINS_TAX_INPUT.buyPrice)}, 필요경비율 ${pct(DEFAULT_CAPITAL_GAINS_TAX_INPUT.expenseRate, 0)}, 1세대 1주택·비조정지역)에서 보유 기간만 바꿔 돌리면, ` +
      `${years(0.9)}일 때 ${pct(SHORT_TERM_RATES.lessThan1Year, 0)} 단일세율로 ${won(under1.totalTax)}, ${years(1.9)}일 때 ${pct(SHORT_TERM_RATES.lessThan2Years, 0)}로 ${won(under2.totalTax)}, ${years(2)}이 되는 순간 ${won(exempt.totalTax)}입니다. ` +
      `1년 문턱을 넘기며 줄어드는 금액이 ${won(under1.totalTax - under2.totalTax)}인데, 2년 문턱에서는 남은 ${won(under2.totalTax)}이 한꺼번에 사라집니다. 양도가가 비과세 기준 ${manwon(ONE_HOUSE_EXEMPT_THRESHOLD)} 이하라 과세 대상 양도차익 자체가 ${won(exempt.taxableCapitalGain)}이 되기 때문입니다. ` +
      `양도차익 ${won(under2.capitalGain)}을 기준으로 보면 실효세율이 ${pct(under2.effectiveRate)}에서 0으로 떨어지는 셈이라, 잔금일을 며칠 미루는 선택이 이 계산기에서 가장 큰 금액을 움직입니다.`,
  };
}

function taxableRatioRamp(): Finding {
  const line = cg({ sellPrice: ONE_HOUSE_EXEMPT_THRESHOLD });
  const first = firstTaxedSellPrice();
  const firstResult = cg({ sellPrice: first });
  const over = cg({ sellPrice: 1_300_000_000 });
  return {
    h2: `비과세 기준을 넘겨도 양도가 ${manwon(first - SCAN_STEP)}까지는 세금이 0으로 계산된다`,
    body:
      `1세대 1주택이 ${manwon(ONE_HOUSE_EXEMPT_THRESHOLD)}을 넘으면 전액 과세가 아니라 "초과분 비율"만 과세됩니다. 양도가에서 기준선을 뺀 몫을 양도가로 나눈 비율이 양도차익에 곱해지는 구조입니다. ` +
      `그래서 양도가를 ${SCAN_STEP.toLocaleString("ko-KR")}원 단위로 올려 보면, 기준선에서 ${won(line.totalTax)}이던 세금이 ${manwon(first)}에 이르러서야 ${won(firstResult.totalTax)}으로 0을 벗어납니다. ` +
      `이 구간에서는 과세 대상 양도차익이 ${won(firstResult.taxableCapitalGain)}까지 커져도 장기보유특별공제 ${pct(firstResult.longTermDeductionRate, 0)}와 기본공제 ${manwon(BASIC_DEDUCTION)}이 차례로 깎아내 과세표준이 남지 않기 때문입니다. ` +
      `양도가 ${manwon(1_300_000_000)}이면 과세 대상 양도차익 ${won(over.taxableCapitalGain)}에 세금 ${won(over.totalTax)}이 붙는데, 이는 전체 양도차익 ${won(over.capitalGain)}의 ${pct(over.effectiveRate)}에 해당합니다. "12억을 1원이라도 넘으면 과세"라는 요약과 실제 고지액 사이에 이만큼의 완충 구간이 있습니다.`,
  };
}

function residenceAxis(): Finding {
  const none = cg({ sellPrice: HIGH_SALE, holdingYears: 10, residenceYears: 0 });
  const full = cg({ sellPrice: HIGH_SALE, holdingYears: 10, residenceYears: 10 });
  const half = cg({ sellPrice: HIGH_SALE, holdingYears: 10, residenceYears: 5 });
  return {
    h2: `보유 ${years(10)}이 같아도 거주 ${years(10)} 여부가 세금을 ${delta(none.totalTax, full.totalTax)} 바꾼다`,
    body:
      `양도가 ${manwon(HIGH_SALE)}·취득가 ${manwon(DEFAULT_CAPITAL_GAINS_TAX_INPUT.buyPrice)}·보유 ${years(10)} 조건에서 거주 기간만 0·5·10년으로 바꾸면 공제율이 ${pct(none.longTermDeductionRate, 0)}, ${pct(half.longTermDeductionRate, 0)}, ${pct(full.longTermDeductionRate, 0)}로 올라갑니다. ` +
      `세금은 ${won(none.totalTax)}, ${won(half.totalTax)}, ${won(full.totalTax)}입니다. 거주 1년이 평균 ${won((none.totalTax - full.totalTax) / 10)}씩 깎는 셈인데, 실제로는 균등하지 않습니다 — 앞의 5년이 ${won(none.totalTax - half.totalTax)}, 뒤의 5년이 ${won(half.totalTax - full.totalTax)}을 줄입니다. ` +
      `과세표준이 줄면서 누진세율 구간까지 내려가기 때문입니다. 실제로 거주 0년일 때 적용 구간은 "${none.taxRateLabel}"이지만 거주 10년에서는 "${full.taxRateLabel}"으로 내려갑니다. ` +
      `같은 집을 같은 기간 보유했어도 전세를 준 기간이 길면 이 축의 공제를 받지 못하므로, 매도 시점을 정하기 전에 거주 기간부터 확인해야 합니다.`,
  };
}

function holdResideSymmetry(): Finding {
  const holdHeavy = cg({ sellPrice: HIGH_SALE, holdingYears: 10, residenceYears: 3 });
  const resideHeavy = cg({ sellPrice: HIGH_SALE, holdingYears: 3, residenceYears: 10 });
  const holdOnly = cg({ sellPrice: HIGH_SALE, holdingYears: 20, residenceYears: 0 });
  return {
    h2: `보유 ${years(10)}·거주 ${years(3)}과 보유 ${years(3)}·거주 ${years(10)}은 세금이 1원도 다르지 않다`,
    body:
      `1세대 1주택 장기보유특별공제는 보유와 거주가 각각 연 ${pct(ONE_HOUSE_HOLD_RATE_PER_YEAR, 0)}, 각각 상한 ${pct(ONE_HOUSE_HOLD_MAX, 0)}로 완전히 대칭입니다. ` +
      `양도가 ${manwon(HIGH_SALE)} 기준으로 두 조합을 돌리면 공제율이 ${pct(holdHeavy.longTermDeductionRate, 0)}로 같고 세금도 둘 다 ${won(resideHeavy.totalTax)}입니다. ` +
      `대칭이 깨지는 곳은 한쪽에만 기간이 쏠릴 때입니다. 거주 없이 보유만 ${years(20)}을 채우면 공제율은 상한 ${pct(ONE_HOUSE_HOLD_MAX, 0)}에서 멈춰 세금이 ${won(holdOnly.totalTax)}으로, 두 축을 합쳐 ${pct(holdHeavy.longTermDeductionRate, 0)}를 만든 경우보다 ${won(holdOnly.totalTax - holdHeavy.totalTax)} 많습니다. ` +
      `보유 기간을 더 늘려도 이 차이는 줄지 않습니다. 거주 축의 상한 ${pct(ONE_HOUSE_RESIDE_MAX, 0)}는 살아본 적이 없으면 영원히 잠겨 있는 몫이기 때문입니다.`,
  };
}

function oneHouseVsGeneral(): Finding {
  const one = cg({ sellPrice: HIGH_SALE });
  const general = cg({ sellPrice: HIGH_SALE, isOneHousehold: false });
  return {
    h2: `같은 매도 조건에서 1세대 1주택 여부가 세금을 ${times(general.totalTax, one.totalTax, 1)}로 벌린다`,
    body:
      `양도가 ${manwon(HIGH_SALE)}·취득가 ${manwon(DEFAULT_CAPITAL_GAINS_TAX_INPUT.buyPrice)}·보유 ${years(DEFAULT_CAPITAL_GAINS_TAX_INPUT.holdingYears)}·거주 ${years(DEFAULT_CAPITAL_GAINS_TAX_INPUT.residenceYears)} 조건에서 1세대 1주택이면 세금이 ${won(one.totalTax)}, 아니면 ${won(general.totalTax)}입니다. ` +
      `벌어지는 이유는 두 가지가 겹쳐서입니다. 첫째, 1주택은 과세 대상 양도차익이 ${won(one.taxableCapitalGain)}으로 줄지만 그렇지 않으면 양도차익 ${won(general.capitalGain)} 전액이 과세 대상입니다. ` +
      `둘째, 장기보유특별공제율이 ${pct(one.longTermDeductionRate, 0)} 대 ${pct(general.longTermDeductionRate, 0)}로 갈립니다. ` +
      `그 결과 적용 세율 구간도 "${one.taxRateLabel}"과 "${general.taxRateLabel}"으로 달라져, 양도차익 대비 실효세율이 ${pct(one.effectiveRate)} 대 ${pct(general.effectiveRate)}가 됩니다. 세대 요건 판정 하나가 이 계산기에서 가장 큰 배수를 만듭니다.`,
  };
}

function regulatedResidence(): Finding {
  const short = cg({ isRegulatedArea: true, residenceYears: 1 });
  const met = cg({ isRegulatedArea: true, residenceYears: 2 });
  const nonRegulated = cg({ isRegulatedArea: false, residenceYears: 1 });
  return {
    h2: `조정대상지역에서는 거주 ${years(1)}과 ${years(2)}의 차이가 ${won(short.totalTax - met.totalTax)}이다`,
    body:
      `비조정지역에서는 보유 ${years(2)}만 채우면 비과세 요건이 성립하지만, 조정대상지역에서 취득한 주택은 거주 ${years(2)}이 추가로 필요합니다. ` +
      `기본 조건에서 지역만 조정대상으로 바꾸고 거주를 ${years(1)}으로 두면 비과세가 깨져 과세 대상 양도차익이 ${won(short.taxableCapitalGain)}, 세금이 ${won(short.totalTax)}이 됩니다. 거주를 ${years(2)}으로 채우면 ${won(met.totalTax)}입니다. ` +
      `같은 거주 ${years(1)}이라도 비조정지역이면 세금이 ${won(nonRegulated.totalTax)}이므로, 이 차이는 거주 기간이 아니라 취득 당시 지역 지정 여부가 만든 것입니다. ` +
      `양도차익 ${won(short.capitalGain)} 대비로는 실효세율 ${pct(short.effectiveRate)}와 0의 차이입니다. 규제지역 지정·해제 이력이 계약서보다 앞서는 변수라는 뜻이라, 취득 시점의 지정 여부를 먼저 확인해야 합니다.`,
  };
}

function expenseLeverage(): Finding {
  const none = cg({ sellPrice: HIGH_SALE, expenseRate: 0 });
  const full = cg({ sellPrice: HIGH_SALE, expenseRate: 0.05 });
  const perWon = (none.totalTax - full.totalTax) / (full.expenses - none.expenses);
  const per10m = perWon * 10_000_000;
  return {
    h2: `증빙 ${manwon(10_000_000)}을 더 찾으면 세금이 ${won(per10m)} 줄어든다`,
    body:
      `필요경비는 양도차익에서 먼저 빠지므로 절세 효과가 세율만큼일 것 같지만, 1세대 1주택은 과세 비율과 장기보유특별공제를 차례로 통과한 뒤에야 세율이 곱해집니다. ` +
      `양도가 ${manwon(HIGH_SALE)} 기준으로 필요경비율을 ${pct(0, 0)}에서 ${pct(0.05, 0)}로 올리면 필요경비가 ${won(none.expenses)}에서 ${won(full.expenses)}으로 ${won(full.expenses - none.expenses)} 늘고, 세금은 ${won(none.totalTax)}에서 ${won(full.totalTax)}으로 ${won(none.totalTax - full.totalTax)} 줄어듭니다. ` +
      `경비 1원이 깎는 세금은 ${pct(perWon)}으로, 적용 세율 구간 "${full.taxRateLabel}"이 시사하는 수준보다 훨씬 낮습니다. 과세 대상 양도차익이 전체의 ${pct(full.taxableCapitalGain / full.capitalGain)}에 불과하고 거기서 다시 ${pct(full.longTermDeductionRate, 0)}가 공제되기 때문입니다. ` +
      `영수증을 모으는 일은 여전히 이득이지만, 이 구조에서는 "경비 × 세율"로 기대한 금액의 몇 분의 일만 돌아옵니다.`,
  };
}

function generalHoldCliff(): Finding {
  const before = cg({ holdingYears: 2.9, isOneHousehold: false });
  const after = cg({ holdingYears: GENERAL_LONG_HOLD_MIN_YEARS, isOneHousehold: false });
  const long = cg({ holdingYears: 15, isOneHousehold: false });
  return {
    h2: `1세대 1주택이 아니면 보유 ${years(3)}을 채우는 날 세금이 ${won(before.totalTax - after.totalTax)} 떨어진다`,
    body:
      `일반 장기보유특별공제는 보유 ${years(GENERAL_LONG_HOLD_MIN_YEARS)}부터 연 ${pct(GENERAL_LONG_HOLD_RATE_PER_YEAR, 0)}씩 붙습니다. 3년에 도달하는 순간 ${pct(GENERAL_LONG_HOLD_RATE_PER_YEAR * GENERAL_LONG_HOLD_MIN_YEARS, 0)}가 한꺼번에 켜지는 구조입니다. ` +
      `기본 조건에서 세대 요건만 빼고 보유를 ${years(2.9)}에서 ${years(3)}으로 늘리면 공제율이 ${pct(before.longTermDeductionRate, 0)}에서 ${pct(after.longTermDeductionRate, 0)}가 되고 세금이 ${won(before.totalTax)}에서 ${won(after.totalTax)}으로 내려갑니다. ` +
      `이후 12년을 더 보유해 상한 ${pct(long.longTermDeductionRate, 0)}를 채워도 세금은 ${won(long.totalTax)}까지만 줄어, 3년째 하루가 만든 감소분이 그 뒤 12년이 만든 감소분 ${won(after.totalTax - long.totalTax)}보다 큽니다. ` +
      `양도차익 ${won(before.capitalGain)} 기준 실효세율로는 ${pct(before.effectiveRate)}에서 ${pct(after.effectiveRate)}로 내려가는 한 칸입니다.`,
  };
}

function effectiveRateLadder(): Finding {
  const rungs = [900_000_000, 1_200_000_000, HIGH_SALE, 2_000_000_000].map((sellPrice) => ({
    sellPrice,
    r: cg({ sellPrice, isOneHousehold: false }),
  }));
  const [low, , , high] = rungs;
  const topTier = INCOME_TAX_TIERS[INCOME_TAX_TIERS.length - 1];
  const text = rungs
    .map(({ sellPrice, r }) => `${manwon(sellPrice)} ${won(r.totalTax)}(${pct(r.effectiveRate)})`)
    .join(", ");
  return {
    h2: `1주택 요건이 없을 때 양도차익 대비 실효세율은 ${pct(low.r.effectiveRate)}에서 ${pct(high.r.effectiveRate)}까지만 움직인다`,
    body:
      `취득가 ${manwon(DEFAULT_CAPITAL_GAINS_TAX_INPUT.buyPrice)}·보유 ${years(DEFAULT_CAPITAL_GAINS_TAX_INPUT.holdingYears)}·1세대 1주택 아님 조건에서 양도가만 올리며 계산하면 ${text}입니다. ` +
      `양도차익은 ${won(low.r.capitalGain)}에서 ${won(high.r.capitalGain)}으로 ${times(high.r.capitalGain, low.r.capitalGain, 1)}가 되는데 실효세율은 ${pp(high.r.effectiveRate - low.r.effectiveRate)} 오르는 데 그칩니다. ` +
      `최고 구간 세율이 ${pct(topTier.rate, 0)}이고 지방소득세가 그 위에 10% 더 붙는데도 실효세율이 ${pct(high.r.effectiveRate)}에서 멈추는 이유는 누진공제 ${won(topTier.deduction)}과 장기보유특별공제 ${pct(low.r.longTermDeductionRate, 0)}, 기본공제 ${manwon(BASIC_DEDUCTION)}이 함께 작동하기 때문입니다. ` +
      `양도가를 한 칸씩 올릴 때 늘어나는 세금도 ${won(rungs[1].r.totalTax - low.r.totalTax)}, ${won(rungs[2].r.totalTax - rungs[1].r.totalTax)}, ${won(high.r.totalTax - rungs[2].r.totalTax)}으로 일정하지 않아, 세율 구간이 아니라 양도차익의 절대 크기가 부담을 결정합니다.`,
  };
}

export const CAPITAL_GAINS_DIGEST: Finding[] = [
  holdingCliff(),
  taxableRatioRamp(),
  residenceAxis(),
  holdResideSymmetry(),
  oneHouseVsGeneral(),
  regulatedResidence(),
  expenseLeverage(),
  generalHoldCliff(),
  effectiveRateLadder(),
];

export const CAPITAL_GAINS_BASIS: Finding = {
  h2: "위 발견의 계산 기준",
  body:
    `위 금액은 전부 이 페이지의 양도소득세 계산기에 조건을 넣어 실행한 값이며, 따로 적지 않은 항목은 기본값(취득가 ${manwon(DEFAULT_CAPITAL_GAINS_TAX_INPUT.buyPrice)}, 필요경비율 ${pct(DEFAULT_CAPITAL_GAINS_TAX_INPUT.expenseRate, 0)}, 보유 ${years(DEFAULT_CAPITAL_GAINS_TAX_INPUT.holdingYears)}, 거주 ${years(DEFAULT_CAPITAL_GAINS_TAX_INPUT.residenceYears)}, 1세대 1주택, 비조정지역)을 씁니다. ` +
    `보유·거주 기간은 계산 편의를 위해 소수점 단위로 입력할 수 있게 되어 있지만 실제 판정은 등기·전입 일자로 하며, 세율·공제율은 소득세법 기준 ${CAPITAL_GAINS_TAX_UPDATED} 확인분입니다. ` +
    `이 계산기는 1세대 1주택 비과세와 장기보유특별공제, 지방소득세까지만 모델링합니다. 상속·증여 취득, 부담부증여, 다주택 중과, 감면 특례, 분양권·조합원입주권은 반영하지 않으므로 해당 사례에서는 실제 세액이 위 수치와 다르게 나옵니다.`,
};
