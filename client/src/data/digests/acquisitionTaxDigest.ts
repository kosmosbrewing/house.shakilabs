// /acquisition-tax digest. The calculator answers one purchase at a time; this
// file runs the same engine along price (1만원 steps in the graduated band),
// exclusive area, household count and regulated-area status, and records where
// the surtaxes behave differently from the headline rate — the 1㎡ step, the
// price where three houses cost as much tax as one house worth far more, and
// the parts of the bill the surcharge rate never touches.

import {
  ACQUISITION_TAX_UPDATED,
  BASE_RATE_THRESHOLDS,
  LOCAL_EDUCATION_RATE,
  MULTI_HOME_RATES,
  RURAL_TAX_AREA_THRESHOLD,
  RURAL_TAX_BASE_RATE,
  RURAL_TAX_SURCHARGE_RATE,
} from "../acquisitionTax";
import { DEFAULT_ACQUISITION_TAX_INPUT } from "@/lib/housingValidators";
import { calculateAcquisitionTax, type AcquisitionTaxInput } from "@/utils/housingCalculator";
import { type Finding, delta, manwon, pct, pp, squareMeter, times, won } from "./format";

export const aq = (patch: Partial<AcquisitionTaxInput>) =>
  calculateAcquisitionTax({ ...DEFAULT_ACQUISITION_TAX_INPUT, ...patch });

export const LARGE_AREA = 100;
export const HIGH_PRICE = 1_500_000_000;
export const ONE_HOUSE_REFERENCE = 2_000_000_000;
export const PRICE_STEP = 1_000_000;

/** Lowest three-house (non-regulated) price whose total tax reaches the one-house reference. */
export function threeHouseMatchPrice(): number {
  const reference = aq({ purchasePrice: ONE_HOUSE_REFERENCE }).totalTax;
  for (let price = 600_000_000; price <= 900_000_000; price += PRICE_STEP) {
    if (aq({ purchasePrice: price, homeCount: 3 }).totalTax >= reference) return price;
  }
  return 0;
}

function areaThreshold(): Finding {
  const price = BASE_RATE_THRESHOLDS.high;
  const exact = aq({ purchasePrice: price, exclusiveArea: RURAL_TAX_AREA_THRESHOLD });
  const over = aq({ purchasePrice: price, exclusiveArea: 86 });
  return {
    h2: `전용면적 ${squareMeter(85)}와 ${squareMeter(86)} 사이에 ${won(over.totalTax - exact.totalTax)}이 있다`,
    body:
      `농어촌특별세는 전용면적 ${squareMeter(RURAL_TAX_AREA_THRESHOLD)}를 "초과"할 때만 붙습니다. 매매가 ${manwon(price)}·1주택·비조정지역 조건으로 면적만 바꿔 계산하면 ${squareMeter(84)}, ${squareMeter(RURAL_TAX_AREA_THRESHOLD)} 모두 ${won(exact.totalTax)}이고, ${squareMeter(86)}에서 ${won(over.totalTax)}이 됩니다. ` +
      `늘어난 ${won(over.ruralTax)}은 취득세 기본세율분 ${won(over.acquisitionTax)}의 ${pct(RURAL_TAX_BASE_RATE, 0)}입니다. 면적 ${squareMeter(1)} 차이로 세금이 ${delta(exact.totalTax, over.totalTax)} 오르는 셈입니다. ` +
      `같은 단지에서 ${squareMeter(84)} 타입과 ${squareMeter(86)} 타입을 저울질하는 상황이라면, 매매가가 같아도 이 금액만큼은 확정적으로 갈립니다. ` +
      `전용면적은 등기부와 분양 계약서 기준이라 공급면적(분양면적)으로 착각하면 판정이 뒤집힙니다. 이 계산기에서 면적 칸은 세율이 아니라 부과 여부만 바꾸므로, ${squareMeter(RURAL_TAX_AREA_THRESHOLD)} 이하 구간에서는 어떤 값을 넣어도 결과가 같습니다.`,
  };
}

function marginalBurden(): Finding {
  const low = BASE_RATE_THRESHOLDS.low;
  const high = 890_000_000;
  const step = 10_000_000;
  const atLow = aq({ purchasePrice: low });
  const nextLow = aq({ purchasePrice: low + step });
  const atHigh = aq({ purchasePrice: high });
  const nextHigh = aq({ purchasePrice: high + step });
  return {
    h2: `매매가를 ${manwon(step)} 올릴 때 세금은 ${won(nextLow.totalTax - atLow.totalTax)}에서 ${won(nextHigh.totalTax - atHigh.totalTax)}까지 커진다`,
    body:
      `${manwon(low)}에서 ${manwon(BASE_RATE_THRESHOLDS.high)} 사이는 세율이 계단이 아니라 매매가에 비례해 오르는 구간이라, 세율이 오르는 동시에 곱해지는 금액도 커집니다. ` +
      `그래서 같은 ${manwon(step)}을 더 얹어도 늘어나는 세금이 구간 초입에서는 ${won(nextLow.totalTax - atLow.totalTax)}, 끝자락에서는 ${won(nextHigh.totalTax - atHigh.totalTax)}으로 ${times(nextHigh.totalTax - atHigh.totalTax, nextLow.totalTax - atLow.totalTax, 1)} 차이가 납니다. ` +
      `한계 부담률로 읽으면 ${pct((nextLow.totalTax - atLow.totalTax) / step)}에서 ${pct((nextHigh.totalTax - atHigh.totalTax) / step)}이고, 이는 각 지점의 실효 부담률 ${pct(atLow.effectiveTotalRate)}·${pct(atHigh.effectiveTotalRate)}보다 세 배 가까이 높습니다. ` +
      `가격 협상 ${manwon(step)}의 값어치가 구간 어디에 서 있느냐로 달라진다는 뜻이라, ${manwon(BASE_RATE_THRESHOLDS.high)}에 가까울수록 깎은 금액보다 줄어드는 세금이 커집니다.`,
  };
}

function threeHouseParity(): Finding {
  const match = threeHouseMatchPrice();
  const three = aq({ purchasePrice: match, homeCount: 3 });
  const one = aq({ purchasePrice: ONE_HOUSE_REFERENCE });
  const sample = aq({ purchasePrice: 770_000_000, homeCount: 3 });
  return {
    h2: `비조정지역 3주택 ${manwon(match)}의 취득세가 1주택 ${manwon(ONE_HOUSE_REFERENCE)}을 넘어선다`,
    body:
      `비조정지역에서도 3주택째부터는 ${pct(MULTI_HOME_RATES.nonRegulated3, 0)} 중과세율이 적용됩니다. 매매가를 ${PRICE_STEP.toLocaleString("ko-KR")}원 단위로 올리며 1주택 ${manwon(ONE_HOUSE_REFERENCE)}의 세금 ${won(one.totalTax)}과 맞춰 보면, 3주택 기준으로는 ${manwon(match)}에서 ${won(three.totalTax)}이 되어 같은 금액에 도달합니다. ` +
      `가격은 ${times(ONE_HOUSE_REFERENCE, match, 1)} 차이인데 취득세는 같습니다. 예를 들어 ${manwon(770_000_000)}짜리 3주택째는 ${won(sample.totalTax)}으로, 그 가격 1주택의 ${times(sample.totalTax, aq({ purchasePrice: 770_000_000 }).totalTax, 1)}입니다. ` +
      `실효 부담률로 보면 3주택 ${pct(three.effectiveTotalRate)} 대 1주택 ${pct(one.effectiveTotalRate)}입니다. ` +
      `중과 여부가 가격대보다 세 부담을 크게 좌우하므로, 갈아타기처럼 일시적으로 주택 수가 늘어나는 상황이라면 중과 배제 요건을 먼저 확인하는 편이 매물 가격을 비교하는 것보다 금액이 큽니다.`,
  };
}

function regulatedMultiplier(): Finding {
  const plain = aq({ purchasePrice: HIGH_PRICE, homeCount: 2 });
  const regulated = aq({ purchasePrice: HIGH_PRICE, homeCount: 2, isRegulatedArea: true });
  return {
    h2: `2주택째는 조정대상지역이냐 아니냐로 세금이 ${times(regulated.totalTax, plain.totalTax, 2)}가 된다`,
    body:
      `2주택은 지역 지정 여부가 곧 세율입니다. 비조정지역이면 기본세율 ${pct(plain.effectiveRate)}가 그대로 유지되지만, 조정대상지역이면 ${pct(MULTI_HOME_RATES.regulated2, 0)} 중과세율로 바뀝니다. ` +
      `매매가 ${manwon(HIGH_PRICE)}·전용 ${squareMeter(DEFAULT_ACQUISITION_TAX_INPUT.exclusiveArea)} 기준으로 세금이 ${won(plain.totalTax)}에서 ${won(regulated.totalTax)}으로, 차액 ${won(regulated.totalTax - plain.totalTax)}입니다. ` +
      `이 차액은 세율 차이 ${pp(MULTI_HOME_RATES.regulated2 - plain.effectiveRate, 0)}를 매매가에 곱한 값과 정확히 같습니다. 지방교육세는 중과분을 따라 오르지 않기 때문입니다(양쪽 모두 ${won(plain.localEducationTax)}). ` +
      `실효 부담률로는 ${pct(plain.effectiveTotalRate)}와 ${pct(regulated.effectiveTotalRate)}입니다. 3주택 이상에서는 같은 매매가로 ${won(aq({ purchasePrice: HIGH_PRICE, homeCount: 3 }).totalTax)}(비조정)과 ${won(aq({ purchasePrice: HIGH_PRICE, homeCount: 3, isRegulatedArea: true }).totalTax)}(조정)으로 벌어집니다.`,
  };
}

function educationTaxInvariance(): Finding {
  const one = aq({ purchasePrice: HIGH_PRICE });
  const three = aq({ purchasePrice: HIGH_PRICE, homeCount: 3, isRegulatedArea: true });
  return {
    h2: `취득세가 ${times(three.acquisitionTax, one.acquisitionTax, 0)}가 되어도 지방교육세는 ${won(one.localEducationTax)} 그대로다`,
    body:
      `지방교육세는 중과세율이 아니라 기본세율분의 ${pct(LOCAL_EDUCATION_RATE, 0)}로 계산됩니다. 매매가 ${manwon(HIGH_PRICE)}에서 1주택이면 취득세 ${won(one.acquisitionTax)}, 조정대상지역 3주택이면 ${won(three.acquisitionTax)}으로 ${times(three.acquisitionTax, one.acquisitionTax, 0)} 차이가 나지만 지방교육세는 양쪽 모두 ${won(one.localEducationTax)}입니다. ` +
      `그 결과 지방교육세가 총 세액에서 차지하는 비중이 ${pct(one.localEducationTax / one.totalTax)}에서 ${pct(three.localEducationTax / three.totalTax)}로 줄어듭니다. ` +
      `"취득세율 ${pct(MULTI_HOME_RATES.regulated3, 0)}에 부가세까지 얹으면 ${pct(MULTI_HOME_RATES.regulated3 * 1.1, 1)}"라는 식의 어림이 틀리는 이유가 여기 있습니다. 실제 실효 부담률은 ${pct(three.effectiveTotalRate)}입니다. ` +
      `중과 구간에서 총액을 좌우하는 부가세는 지방교육세가 아니라 면적 조건에 걸리는 농어촌특별세 쪽입니다.`,
  };
}

function ruralSurchargeSplit(): Finding {
  const plain = aq({ purchasePrice: HIGH_PRICE, homeCount: 3, exclusiveArea: LARGE_AREA });
  const regulated = aq({ purchasePrice: HIGH_PRICE, homeCount: 3, isRegulatedArea: true, exclusiveArea: LARGE_AREA });
  const single = aq({ purchasePrice: HIGH_PRICE, exclusiveArea: LARGE_AREA });
  return {
    h2: `농어촌특별세는 중과분에만 세율이 두 배여서 ${squareMeter(LARGE_AREA)} 주택에서 ${won(regulated.ruralTax - single.ruralTax)}까지 커진다`,
    body:
      `농어촌특별세는 기본세율분에는 ${pct(RURAL_TAX_BASE_RATE, 0)}, 중과로 늘어난 부분에는 ${pct(RURAL_TAX_SURCHARGE_RATE, 0)}가 적용됩니다. 두 층으로 나뉘어 계산된다는 점이 지방교육세와 다릅니다. ` +
      `매매가 ${manwon(HIGH_PRICE)}·전용 ${squareMeter(LARGE_AREA)} 조건에서 1주택이면 ${won(single.ruralTax)}, 비조정지역 3주택이면 ${won(plain.ruralTax)}, 조정대상지역 3주택이면 ${won(regulated.ruralTax)}입니다. ` +
      `중과세율이 ${pp(MULTI_HOME_RATES.regulated3 - MULTI_HOME_RATES.nonRegulated3, 0)} 오르는 사이 농어촌특별세는 ${won(regulated.ruralTax - plain.ruralTax)} 늘어, 이 항목만으로 총 세액이 ${won(plain.totalTax)}에서 ${won(regulated.totalTax)}으로 벌어지는 데 ${pct((regulated.ruralTax - plain.ruralTax) / (regulated.totalTax - plain.totalTax))}를 기여합니다. ` +
      `전용 ${squareMeter(RURAL_TAX_AREA_THRESHOLD)} 이하라면 이 층 전체가 사라지므로, 중과 대상일수록 면적 조건의 금액 효과가 커집니다.`,
  };
}

function effectiveRateLadder(): Finding {
  const rungs = [300_000_000, BASE_RATE_THRESHOLDS.low, 750_000_000, BASE_RATE_THRESHOLDS.high].map((purchasePrice) => ({
    purchasePrice,
    r: aq({ purchasePrice }),
  }));
  const worst = aq({ purchasePrice: BASE_RATE_THRESHOLDS.high, homeCount: 3, isRegulatedArea: true, exclusiveArea: LARGE_AREA });
  const text = rungs
    .map(({ purchasePrice, r }) => `${manwon(purchasePrice)} ${won(r.totalTax)}(${pct(r.effectiveTotalRate)})`)
    .join(", ");
  return {
    h2: `같은 ${manwon(BASE_RATE_THRESHOLDS.high)} 주택의 실효 부담률이 ${pct(rungs[3].r.effectiveTotalRate)}와 ${pct(worst.effectiveTotalRate)}로 갈린다`,
    body:
      `1주택·비조정지역·전용 ${squareMeter(DEFAULT_ACQUISITION_TAX_INPUT.exclusiveArea)} 기준으로 매매가별 총 세액과 실효 부담률은 ${text}입니다. ${manwon(300_000_000)}과 ${manwon(BASE_RATE_THRESHOLDS.low)}의 부담률이 같은 이유는 ${manwon(BASE_RATE_THRESHOLDS.low)} 이하가 단일 세율 구간이기 때문입니다. ` +
      `같은 ${manwon(BASE_RATE_THRESHOLDS.high)} 주택이라도 조정대상지역 3주택째·전용 ${squareMeter(LARGE_AREA)}로 사면 세금이 ${won(worst.totalTax)}, 부담률 ${pct(worst.effectiveTotalRate)}가 됩니다. ` +
      `가격은 그대로인데 세금만 ${won(worst.totalTax - rungs[3].r.totalTax)} 늘어나는 것으로, ${manwon(300_000_000)}짜리 주택의 취득세를 ${times(worst.totalTax - rungs[3].r.totalTax, rungs[0].r.totalTax, 1)} 낼 수 있는 금액입니다. ` +
      `취득세에서 가격보다 조건이 더 큰 변수라는 사실이 이 두 줄에 다 들어 있습니다.`,
  };
}

function noStepAtSixEok(): Finding {
  const before = aq({ purchasePrice: BASE_RATE_THRESHOLDS.low });
  const after = aq({ purchasePrice: BASE_RATE_THRESHOLDS.low + PRICE_STEP });
  const nine = aq({ purchasePrice: BASE_RATE_THRESHOLDS.high });
  const overNine = aq({ purchasePrice: BASE_RATE_THRESHOLDS.high + PRICE_STEP });
  return {
    h2: `${manwon(BASE_RATE_THRESHOLDS.low)} 경계에서는 ${won(after.totalTax - before.totalTax)}, ${manwon(BASE_RATE_THRESHOLDS.high)} 경계에서는 ${won(overNine.totalTax - nine.totalTax)}만 움직인다`,
    body:
      `취득세율 표를 계단으로 오해하면 ${manwon(BASE_RATE_THRESHOLDS.low)}이나 ${manwon(BASE_RATE_THRESHOLDS.high)}을 1원 넘기는 순간 세금이 뛴다고 생각하게 됩니다. 실제로는 두 지점 모두 연속입니다. ` +
      `매매가를 ${PRICE_STEP.toLocaleString("ko-KR")}원만 올려 보면 ${manwon(BASE_RATE_THRESHOLDS.low)}에서는 세금이 ${won(before.totalTax)}에서 ${won(after.totalTax)}으로 ${won(after.totalTax - before.totalTax)}, ${manwon(BASE_RATE_THRESHOLDS.high)}에서는 ${won(nine.totalTax)}에서 ${won(overNine.totalTax)}으로 ${won(overNine.totalTax - nine.totalTax)} 오릅니다. ` +
      `세율도 ${pct(before.baseRate)}에서 ${pct(after.baseRate)}로 매끄럽게 이어집니다. ${manwon(BASE_RATE_THRESHOLDS.high)}을 넘으면 세율이 ${pct(BASE_RATE_THRESHOLDS.highRate, 0)}에 고정되므로 그 위로는 세금이 매매가에 정비례합니다. ` +
      `계단이 있는 곳은 가격이 아니라 주택 수와 지역 지정, 그리고 전용면적 쪽입니다. 이 계산기에서 가격을 ${PRICE_STEP.toLocaleString("ko-KR")}원 단위로 흔들어 봐도 세금이 급변하는 지점은 나오지 않습니다.`,
  };
}

function surchargeShareAtDefault(): Finding {
  const base = aq({});
  const large = aq({ exclusiveArea: 86 });
  const price = DEFAULT_ACQUISITION_TAX_INPUT.purchasePrice;
  return {
    h2: `기본값 ${manwon(price)}에서 부가세가 총액의 ${pct(large.localEducationTax / large.totalTax + large.ruralTax / large.totalTax)}를 차지한다`,
    body:
      `취득세 본세만 보면 ${manwon(price)}·1주택·비조정지역에서 ${won(base.acquisitionTax)}입니다. 여기에 지방교육세 ${won(base.localEducationTax)}이 더해져 전용 ${squareMeter(DEFAULT_ACQUISITION_TAX_INPUT.exclusiveArea)} 기준 실제 납부액은 ${won(base.totalTax)}이 됩니다. ` +
      `전용면적만 ${squareMeter(86)}로 바꾸면 농어촌특별세 ${won(large.ruralTax)}이 추가돼 ${won(large.totalTax)}으로 늘고, 본세 대비 부가세 비중이 ${pct(base.localEducationTax / base.acquisitionTax)}에서 ${pct((large.localEducationTax + large.ruralTax) / large.acquisitionTax)}로 올라갑니다. ` +
      `세율 ${pct(base.baseRate, 0)}만 곱해 ${won(base.acquisitionTax)}을 준비했다면 ${squareMeter(86)} 주택에서는 ${won(large.totalTax - base.acquisitionTax)}이 모자랍니다. ` +
      `잔금일에 필요한 현금은 실효 부담률 ${pct(large.effectiveTotalRate)}로 잡아야 맞고, 여기에 중개보수와 법무사 비용은 아직 포함되지 않았습니다.`,
  };
}

export const ACQUISITION_TAX_DIGEST: Finding[] = [
  areaThreshold(),
  marginalBurden(),
  threeHouseParity(),
  regulatedMultiplier(),
  educationTaxInvariance(),
  ruralSurchargeSplit(),
  effectiveRateLadder(),
  noStepAtSixEok(),
  surchargeShareAtDefault(),
];

export const ACQUISITION_TAX_BASIS: Finding = {
  h2: "위 발견의 계산 기준",
  body:
    `위 금액은 전부 이 페이지의 취득세 계산기를 돌린 값이며, 따로 적지 않은 조건은 기본값(1주택, 비조정지역, 전용 ${squareMeter(DEFAULT_ACQUISITION_TAX_INPUT.exclusiveArea)})을 씁니다. 세율과 부가세 계산식은 지방세법 기준 ${ACQUISITION_TAX_UPDATED} 확인분입니다. ` +
    `조정대상지역 지정 현황은 계산기에 내장되어 있지 않고 사용자가 선택하는 값이므로, 위의 "조정"·"비조정" 비교는 지역 지정 여부를 가정한 결과입니다. 잔금일 기준으로 지정이 바뀌면 결과도 바뀝니다. ` +
    `생애최초 감면, 일시적 2주택 중과 배제, 상속·증여 취득, 오피스텔·분양권은 이 계산기의 범위 밖입니다. 생애최초 감면은 이 사이트의 생애최초 주택 혜택 계산기에서 따로 확인할 수 있습니다.`,
};
