// /property-tax digest. The calculator prints one year's bill for one price;
// this file runs the same engine across prices, official-price steps, housing
// type, owner age and holding years, and records only what shows up when those
// runs are placed side by side — cliffs, offsets, and the share of the bill that
// is not the base tax. Quoting a statutory rate is not a finding.

import {
  COMP_TAX_DEDUCTION,
  ELDERLY_DEDUCTION_TIERS,
  LONG_HOLD_DEDUCTION_TIERS,
  MAX_COMBINED_DEDUCTION,
  PROPERTY_FAIR_MARKET_RATIOS,
  PROPERTY_TAX_BASE_CAP_RATE,
  PROPERTY_TAX_UPDATED,
  REALIZATION_RATES,
  SPECIAL_RATE_THRESHOLD,
  URBAN_AREA_TAX_RATE,
} from "../propertyTax";
import { DEFAULT_PROPERTY_TAX_INPUT } from "@/lib/housingValidators";
import { calculatePropertyTax, type PropertyTaxInput } from "@/utils/housingCalculator";
import { type Finding, delta, manwon, pct, pp, times, won } from "./format";

export const run = (patch: Partial<PropertyTaxInput>) =>
  calculatePropertyTax({ ...DEFAULT_PROPERTY_TAX_INPUT, ...patch });

/** Market price whose estimated official price first reaches a threshold. */
export const marketAt = (official: number) => Math.ceil(official / REALIZATION_RATES.apartment);

export const CLIFF_BELOW = 1_304_000_000;
export const CLIFF_ABOVE = 1_305_000_000;
export const COMP_ENTRY_SAMPLE = 1_750_000_000;
export const DEDUCTION_SAMPLE = 2_500_000_000;
export const PREVIOUS_TAX_SAMPLE = 1_000_000;

function specialRateCliff(): Finding {
  const below = run({ marketPrice: CLIFF_BELOW });
  const above = run({ marketPrice: CLIFF_ABOVE });
  return {
    h2: `시가 ${manwon(CLIFF_BELOW)}과 ${manwon(CLIFF_ABOVE)} 사이에서 재산세가 ${delta(below.propertyTaxTotal, above.propertyTaxTotal)} 뛴다`,
    body:
      `1세대 1주택 특례세율은 공시가격 ${manwon(SPECIAL_RATE_THRESHOLD)} 이하에만 적용됩니다. 이 계산기가 시가에서 공시가격을 추정할 때 쓰는 공동주택 현실화율 ${pct(REALIZATION_RATES.apartment)}로 환산하면 그 경계는 시가 약 ${manwon(marketAt(SPECIAL_RATE_THRESHOLD))}입니다. ` +
      `시가 ${manwon(CLIFF_BELOW)}이면 추정 공시가격 ${won(below.officialPrice)}으로 특례 구간에 남아 재산세 계열(본세·도시지역분·지방교육세) 합계가 ${won(below.propertyTaxTotal)}인데, ` +
      `${manwon(CLIFF_ABOVE)}이면 공시가격 ${won(above.officialPrice)}으로 경계를 넘어 표준세율이 적용돼 ${won(above.propertyTaxTotal)}이 됩니다. ` +
      `시가는 ${manwon(CLIFF_ABOVE - CLIFF_BELOW)} 차이인데 세금은 ${won(above.propertyTaxTotal - below.propertyTaxTotal)} 차이가 나고, 본세만 보면 ${won(below.propertyTax)}에서 ${won(above.propertyTax)}으로 ${delta(below.propertyTax, above.propertyTax)}입니다. ` +
      `공시가격이 이 선 근처라면 추정치 대신 공시가격알리미의 실제 금액을 입력해야 어느 쪽인지 판정됩니다.`,
  };
}

function fairMarketSteps(): Finding {
  const [tier1, tier2, tier3] = PROPERTY_FAIR_MARKET_RATIOS;
  const at3 = run({ officialPrice: tier1.max! });
  const over3 = run({ officialPrice: tier1.max! + 1 });
  const at6 = run({ officialPrice: tier2.max! });
  const over6 = run({ officialPrice: tier2.max! + 1 });
  return {
    h2: `공시가격 1원 차이로 과세표준이 ${manwon(over3.propertyTaxBase - at3.propertyTaxBase)} 움직이는 지점이 둘 있다`,
    body:
      `공정시장가액비율은 공시가격 ${manwon(tier1.max!)} 이하 ${pct(tier1.rate, 0)}, ${manwon(tier2.max!)} 이하 ${pct(tier2.rate, 0)}, 초과 ${pct(tier3.rate, 0)}로 계단식인데, 이 비율은 초과분이 아니라 공시가격 전체에 곱해집니다. ` +
      `그래서 공시가격 ${won(tier1.max!)}의 과세표준은 ${won(at3.propertyTaxBase)}이지만 ${won(tier1.max! + 1)}이면 ${won(over3.propertyTaxBase)}으로 뛰고, 재산세 계열 합계도 ${won(at3.propertyTaxTotal)}에서 ${won(over3.propertyTaxTotal)}으로 ${won(over3.propertyTaxTotal - at3.propertyTaxTotal)} 오릅니다. ` +
      `${manwon(tier2.max!)} 경계에서는 과세표준이 ${won(at6.propertyTaxBase)}에서 ${won(over6.propertyTaxBase)}으로 ${won(over6.propertyTaxBase - at6.propertyTaxBase)}, 합계가 ${won(at6.propertyTaxTotal)}에서 ${won(over6.propertyTaxTotal)}으로 ${won(over6.propertyTaxTotal - at6.propertyTaxTotal)} 움직입니다. ` +
      `비율 차이 ${pp(tier2.rate - tier1.rate, 0)}는 작아 보여도 곱해지는 밑수가 수억원이라 1원 경계에서 만원 단위 차이가 생깁니다.`,
  };
}

function compTaxEntry(): Finding {
  const entry = marketAt(COMP_TAX_DEDUCTION);
  const just = run({ marketPrice: COMP_ENTRY_SAMPLE });
  const more = run({ marketPrice: COMP_ENTRY_SAMPLE + 50_000_000 });
  return {
    h2: `종부세 진입 직후 실제 고지액은 세율표대로 계산한 금액의 ${pct(just.compTaxTotal / just.compTaxAmount, 0)} 수준이다`,
    body:
      `1세대 1주택 기본공제 ${manwon(COMP_TAX_DEDUCTION)}을 현실화율로 되돌리면 종합부동산세가 시작되는 시가는 약 ${manwon(entry)}입니다. ` +
      `시가 ${manwon(COMP_ENTRY_SAMPLE)}이면 추정 공시가격 ${won(just.officialPrice)}으로 공제를 ${won(just.officialPrice - COMP_TAX_DEDUCTION)} 넘고, 세율표를 그대로 적용한 종부세는 ${won(just.compTaxAmount)}입니다. ` +
      `여기서 같은 과세표준에 이미 매겨진 재산세 ${won(just.deductiblePropertyTax)}을 공제하므로 농어촌특별세를 더한 실제 종부세는 ${won(just.compTaxTotal)}에 그칩니다. ` +
      `시가 ${manwon(COMP_ENTRY_SAMPLE + 50_000_000)}에서도 세율표상 ${won(more.compTaxAmount)} 중 ${won(more.deductiblePropertyTax)}이 중복분으로 빠져 ${won(more.compTaxTotal)}만 남습니다. ` +
      `연 보유세 총액은 ${won(just.annualTotal)}에서 ${won(more.annualTotal)}으로 이어지므로, 공제선을 갓 넘은 구간에서 세액이 계단처럼 뛰지는 않습니다.`,
  };
}

function apartmentVsDetached(): Finding {
  const price = 2_000_000_000;
  const apt = run({ marketPrice: price });
  const house = run({ marketPrice: price, housingType: "detached" });
  return {
    h2: `같은 시가 ${manwon(price)}이라도 단독주택 재산세는 아파트보다 ${delta(apt.propertyTaxTotal, house.propertyTaxTotal)}`,
    body:
      `시가에서 공시가격을 추정할 때 이 계산기는 공동주택 ${pct(REALIZATION_RATES.apartment)}, 단독주택 ${pct(REALIZATION_RATES.detached)}의 현실화율을 씁니다. ` +
      `그래서 시가 ${manwon(price)}의 추정 공시가격이 아파트 ${won(apt.officialPrice)}, 단독주택 ${won(house.officialPrice)}으로 ${won(apt.officialPrice - house.officialPrice)} 갈립니다. ` +
      `재산세 계열 합계는 아파트 ${won(apt.propertyTaxTotal)}, 단독주택 ${won(house.propertyTaxTotal)}이고, 공시가격 격차(${delta(apt.officialPrice, house.officialPrice)})보다 세금 격차(${delta(apt.propertyTaxTotal, house.propertyTaxTotal)})가 더 큽니다 — 누진 구조라 밑수가 줄면 세금은 그보다 빨리 줍니다. ` +
      `다만 이 비교는 재산세 계열에 한정됩니다. 단독주택은 이 계산기가 특례세율과 종부세를 계산하지 않는 범위이고, 아파트 쪽은 같은 시가에서 종부세 ${won(apt.compTaxTotal)}이 더 붙어 연 ${won(apt.annualTotal)}이 됩니다. ` +
      `현실화율은 전국 평균 가정이라 실제 개별 공시가격과는 차이가 있습니다.`,
  };
}

function deductionOffset(): Finding {
  const young = run({ marketPrice: DEDUCTION_SAMPLE, ownerAge: 50, holdingYears: 0 });
  const senior = run({ marketPrice: DEDUCTION_SAMPLE, ownerAge: 70, holdingYears: 15 });
  const elderly = ELDERLY_DEDUCTION_TIERS[0];
  const longHold = LONG_HOLD_DEDUCTION_TIERS[0];
  return {
    h2: `공제율 ${pct(MAX_COMBINED_DEDUCTION, 0)}를 다 받아도 연 보유세는 ${delta(young.annualTotal, senior.annualTotal)}만 줄어든다`,
    body:
      `고령자 공제(${elderly.label} ${pct(elderly.rate, 0)})와 장기보유 공제(${longHold.label} ${pct(longHold.rate, 0)})는 합산 ${pct(MAX_COMBINED_DEDUCTION, 0)} 상한까지 종부세에서 차감됩니다. ` +
      `시가 ${manwon(DEDUCTION_SAMPLE)} 아파트를 50세·보유 0년 조건으로 돌리면 종부세(농특세 포함) ${won(young.compTaxTotal)}, 연 보유세 ${won(young.annualTotal)}입니다. ` +
      `같은 주택을 70세·보유 15년으로 바꾸면 공제율 ${pct(senior.totalDeductionRate, 0)}가 적용돼 종부세는 ${won(senior.compTaxTotal)}(${delta(young.compTaxTotal, senior.compTaxTotal)})이 되지만, 연 보유세는 ${won(senior.annualTotal)}으로 ${delta(young.annualTotal, senior.annualTotal)}에 그칩니다. ` +
      `공제가 종부세에만 걸리고 재산세 계열 ${won(senior.propertyTaxTotal)}은 나이·보유기간과 무관하게 그대로이기 때문입니다. ` +
      `이 가격대에서는 보유세의 ${pct(senior.propertyTaxTotal / young.annualTotal, 0)}가 애초에 공제 대상이 아니라서, 공제율만 보고 기대한 절감액과 실제 절감액이 크게 벌어집니다.`,
  };
}

function baseCap(): Finding {
  const price = 1_200_000_000;
  const prev = 700_000_000;
  const capped = run({ marketPrice: price, previousYearOfficialPrice: prev });
  const plain = run({ marketPrice: price });
  return {
    h2: `전년 공시가격 칸 하나가 과세표준을 ${won(capped.propertyTaxBaseCapReduction)} 깎는다`,
    body:
      `주택 재산세에는 직전 연도 과세표준 상당액에 ${pct(PROPERTY_TAX_BASE_CAP_RATE, 0)}를 더한 금액을 올해 과세표준의 상한으로 두는 규정이 있습니다. ` +
      `시가 ${manwon(price)} 아파트의 올해 추정 과세표준은 ${won(plain.propertyTaxBaseBeforeCap)}인데, 전년 공시가격을 ${manwon(prev)}으로 입력하면 상한이 ${won(capped.propertyTaxBaseCapAmount!)}으로 계산돼 과세표준이 ${won(capped.propertyTaxBase)}으로 내려갑니다. ` +
      `본세는 ${won(plain.propertyTax)}에서 ${won(capped.propertyTax)}으로, 재산세 계열 합계는 ${won(plain.propertyTaxTotal)}에서 ${won(capped.propertyTaxTotal)}으로 ${won(plain.propertyTaxTotal - capped.propertyTaxTotal)}(${delta(plain.propertyTaxTotal, capped.propertyTaxTotal)}) 줄어듭니다. ` +
      `이 칸을 비우면 상한 자체가 적용되지 않으므로, 공시가격이 한 해에 크게 오른 주택일수록 빈칸 상태의 결과가 실제 고지액보다 높게 나옵니다. 지난해 고지서나 공시가격알리미에서 한 줄만 찾아 넣으면 되는 차이입니다.`,
  };
}

function burdenCap(): Finding {
  const plain = run({ marketPrice: DEDUCTION_SAMPLE });
  const capped = run({ marketPrice: DEDUCTION_SAMPLE, previousYearPropertyTax: PREVIOUS_TAX_SAMPLE });
  return {
    h2: `전년 재산세 ${manwon(PREVIOUS_TAX_SAMPLE)}을 넣으면 종부세 ${won(plain.compTaxTotal)}이 ${won(capped.compTaxTotal)}으로 사라진다`,
    body:
      `종부세 세부담상한은 전년 재산세와 종부세를 합한 금액의 150%를 올해 재산세·종부세 합계의 천장으로 삼습니다. ` +
      `시가 ${manwon(DEDUCTION_SAMPLE)} 아파트를 전년 세액 없이 계산하면 본세 ${won(plain.propertyTax)}에 종부세 ${won(plain.compTaxTotal)}이 얹혀 연 ${won(plain.annualTotal)}입니다. ` +
      `여기서 전년 재산세만 ${manwon(PREVIOUS_TAX_SAMPLE)}으로 입력하면 천장이 ${won(capped.compTaxBurdenCapAmount!)}으로 잡히는데, 올해 본세 ${won(capped.propertyTax)}만으로 이미 그 금액을 넘어 종부세 ${won(capped.compTaxBurdenCapReduction)}이 전액 깎이고 연 보유세가 ${won(capped.annualTotal)}(${delta(plain.annualTotal, capped.annualTotal)})이 됩니다. ` +
      `상한은 재산세를 낮추지 못하고 종부세만 0까지 끌어내리는 장치라, 전년 세액이 낮았던 주택일수록 이 칸의 유무가 결과를 통째로 바꿉니다.`,
  };
}

function priceLadder(): Finding {
  const low = run({ marketPrice: 500_000_000 });
  const mid = run({ marketPrice: 1_500_000_000 });
  const high = run({ marketPrice: 3_000_000_000 });
  return {
    h2: `시가가 ${times(3_000_000_000, 500_000_000, 0)}가 되는 동안 보유세는 ${times(high.annualTotal, low.annualTotal, 1)}가 된다`,
    body:
      `연 보유세를 시가로 나눈 실효 부담률은 시가 ${manwon(500_000_000)}에서 ${pct(low.annualTotal / 500_000_000, 3)}(연 ${won(low.annualTotal)}, 월 ${won(low.monthlyEquivalent)}), ` +
      `${manwon(1_500_000_000)}에서 ${pct(mid.annualTotal / 1_500_000_000, 3)}(연 ${won(mid.annualTotal)}), ${manwon(3_000_000_000)}에서 ${pct(high.annualTotal / 3_000_000_000, 3)}(연 ${won(high.annualTotal)}, 월 ${won(high.monthlyEquivalent)})입니다. ` +
      `가격은 ${times(3_000_000_000, 500_000_000, 0)}인데 세금은 ${times(high.annualTotal, low.annualTotal, 1)}, 부담률로는 ${times(high.annualTotal / 3_000_000_000, low.annualTotal / 500_000_000, 1)}로 벌어집니다. ` +
      `특례세율 이탈, 종부세 진입, 누진 구간 상승이 차례로 겹치기 때문이며, 종부세가 연 보유세에서 차지하는 몫도 ${manwon(1_500_000_000)}까지는 ${won(mid.compTaxTotal)}이다가 ${manwon(3_000_000_000)}에서는 ${won(high.compTaxTotal)}으로 전체의 ${pct(high.compTaxTotal / high.annualTotal, 0)}까지 올라갑니다.`,
  };
}

function surchargeShare(): Finding {
  const r = run({});
  const price = DEFAULT_PROPERTY_TAX_INPUT.marketPrice;
  const surcharge = r.urbanAreaTax + r.localEducationTax;
  return {
    h2: `고지서의 ${pct(surcharge / r.propertyTaxTotal, 0)}는 재산세 본세가 아니다`,
    body:
      `기본값인 시가 ${manwon(price)} 아파트의 재산세 본세는 ${won(r.propertyTax)}입니다. 여기에 과세표준 ${won(r.propertyTaxBase)}에 ${pct(URBAN_AREA_TAX_RATE)}를 곱한 도시지역분 ${won(r.urbanAreaTax)}과 본세의 20%인 지방교육세 ${won(r.localEducationTax)}이 붙어 고지액이 ${won(r.propertyTaxTotal)}이 됩니다. ` +
      `도시지역분 하나가 본세의 ${pct(r.urbanAreaTax / r.propertyTax, 0)}에 이릅니다. 세율 ${pct(URBAN_AREA_TAX_RATE)}가 이 구간 특례세율 ${pct(r.propertyTaxRate)}의 ${pct(URBAN_AREA_TAX_RATE / r.propertyTaxRate, 0)}에 달하는 데다, 본세와 달리 누진공제 없이 과세표준 전체에 곱해지기 때문입니다. ` +
      `특례세율로 본세를 낮춘 효과가 도시지역분에서 상당 부분 상쇄되는 구조라, 세율표의 ${pct(r.propertyTaxRate)}만으로 어림하면 실제 고지액의 절반 수준밖에 잡히지 않습니다. 도시지역 밖 주택이면 이 항목이 빠져 ${won(r.propertyTaxTotal - r.urbanAreaTax)}이 됩니다.`,
  };
}

export const PROPERTY_TAX_DIGEST: Finding[] = [
  specialRateCliff(),
  fairMarketSteps(),
  compTaxEntry(),
  apartmentVsDetached(),
  deductionOffset(),
  baseCap(),
  burdenCap(),
  priceLadder(),
  surchargeShare(),
];

export const PROPERTY_TAX_BASIS: Finding = {
  h2: "위 발견의 계산 기준",
  body:
    `위 금액은 전부 이 페이지의 재산세·종부세 계산기를 같은 조건(1세대 1주택 단독명의 아파트, 도시지역, 따로 적지 않으면 소유자 45세·보유 5년)으로 실행한 값이고, 산문에 손으로 적은 숫자는 없습니다. ` +
    `세율·공정시장가액비율·현실화율은 ${PROPERTY_TAX_UPDATED} 확인 기준이며, 재산세 공정시장가액비율은 2024년 고시(${pct(PROPERTY_FAIR_MARKET_RATIOS[0].rate, 0)}·${pct(PROPERTY_FAIR_MARKET_RATIOS[1].rate, 0)}·${pct(PROPERTY_FAIR_MARKET_RATIOS[2].rate, 0)})가 유지된다는 전제로 계산합니다. 이후 고시가 달리 나오면 위 수치도 함께 바뀝니다. ` +
    `시가에서 추정한 공시가격은 전국 평균 현실화율을 적용한 근사치라 개별 주택의 실제 공시가격과는 차이가 있으므로, 경계 근처 판정은 공시가격알리미의 실제 공시가격으로 다시 계산해야 합니다.`,
};
