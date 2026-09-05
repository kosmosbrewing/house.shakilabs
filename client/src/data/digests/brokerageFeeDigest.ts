// /brokerage-fee digest. The rate table looks like a simple ladder; running the
// engine along the amount axis in 만원 steps shows the parts the table cannot
// show — the jumps at each tier line, the spans where the cap freezes the fee
// while the price keeps rising, and the discontinuity the monthly-rent
// conversion (×70 vs ×100) creates in the middle of an otherwise smooth curve.

import {
  BROKERAGE_DATA_UPDATED,
  MONTHLY_RENT_PRESETS,
  RENT_DEPOSIT_PRESETS,
  RENT_BROKERAGE_TIERS,
  SALE_BROKERAGE_TIERS,
  SALE_PRICE_PRESETS,
  type BrokerageDealType,
  type BrokerageTier,
} from "../brokerageRates";
import { calculateBrokerageFee } from "@/utils/housingCalculator";
import { type Finding, manwon, pct, pp, times, won } from "./format";

export const fee = (dealType: BrokerageDealType, amount: number, monthlyRent = 0) =>
  calculateBrokerageFee({ dealType, amount, monthlyRent });

export const AMOUNT_STEP = 10_000;
export const CONVERSION_LINE = 50_000_000;

/** First amount inside a tier at which the rate calculation reaches the cap. */
export function capStart(tiers: BrokerageTier[], index: number): number {
  const tier = tiers[index];
  const dealType: BrokerageDealType = tiers === SALE_BROKERAGE_TIERS ? "sale" : "jeonse";
  for (let amount = tier.min; amount < (tier.max ?? tier.min); amount += AMOUNT_STEP) {
    if (fee(dealType, amount).rawFee >= tier.cap!) return amount;
  }
  return 0;
}

/** Amount at which the next tier's fee first exceeds the frozen cap amount. */
export function unfreezeAmount(tiers: BrokerageTier[], index: number): number {
  const cap = tiers[index].cap!;
  const dealType: BrokerageDealType = tiers === SALE_BROKERAGE_TIERS ? "sale" : "jeonse";
  for (let amount = tiers[index].min; amount <= 1_000_000_000; amount += AMOUNT_STEP) {
    if (fee(dealType, amount).maxFee > cap) return amount;
  }
  return 0;
}

function saleTierCliffs(): Finding {
  const lines = SALE_BROKERAGE_TIERS.slice(3).map((tier) => {
    const below = fee("sale", tier.min - AMOUNT_STEP);
    const at = fee("sale", tier.min);
    return { tier, below, at };
  });
  const text = lines
    .map(({ tier, below, at }) => `${manwon(tier.min)} 직전 ${won(below.maxFee)} → ${manwon(tier.min)} ${won(at.maxFee)}`)
    .join(", ");
  const [first, , third] = lines;
  return {
    h2: `매매가 ${manwon(AMOUNT_STEP)} 차이로 중개보수가 ${won(first.at.maxFee - first.below.maxFee)}에서 ${won(third.at.maxFee - third.below.maxFee)}까지 뛴다`,
    body:
      `매매 상한요율은 구간마다 ${pp(SALE_BROKERAGE_TIERS[4].rate - SALE_BROKERAGE_TIERS[3].rate, 1)}씩 오르는데, 이 요율이 초과분이 아니라 거래금액 전체에 곱해집니다. 그래서 구간 경계를 ${manwon(AMOUNT_STEP)} 넘기는 순간 보수가 계단처럼 뜁니다. ` +
      `${text}입니다. 뛰는 금액은 각각 ${won(first.at.maxFee - first.below.maxFee)}, ${won(lines[1].at.maxFee - lines[1].below.maxFee)}, ${won(third.at.maxFee - third.below.maxFee)}으로, 경계가 높을수록 커집니다. ` +
      `실효요율로 보면 ${pct(first.below.effectiveRate, 1)}에서 ${pct(first.at.effectiveRate, 1)}로 한 칸 올라서는 것인데, 금액으로는 거래금액이 ${manwon(AMOUNT_STEP)} 오르는 사이 보수가 그 ${times(first.at.maxFee - first.below.maxFee, AMOUNT_STEP, 0)}만큼 늘어나는 셈입니다. ` +
      `${manwon(SALE_BROKERAGE_TIERS[3].min)}·${manwon(SALE_BROKERAGE_TIERS[4].min)}·${manwon(SALE_BROKERAGE_TIERS[5].min)} 언저리에서 가격을 협의 중이라면, 경계 아래로 맞추는 것이 보수 협의보다 확실한 절감입니다.`,
  };
}

function saleFlatSpan(): Finding {
  const tier = SALE_BROKERAGE_TIERS[1];
  const start = capStart(SALE_BROKERAGE_TIERS, 1);
  const end = unfreezeAmount(SALE_BROKERAGE_TIERS, 1);
  const atStart = fee("sale", start);
  const beforeEnd = fee("sale", end - AMOUNT_STEP);
  const atEnd = fee("sale", end);
  return {
    h2: `매매가가 ${manwon(end - AMOUNT_STEP - start)} 오르는 동안 중개보수가 ${won(tier.cap!)}에서 꿈쩍도 하지 않는 구간`,
    body:
      `${manwon(tier.min)} 이상 ${manwon(tier.max!)} 미만 구간은 상한요율 ${pct(tier.rate, 1)}에 한도액 ${won(tier.cap!)}이 함께 걸려 있습니다. 두 값이 만나는 지점을 ${manwon(AMOUNT_STEP)} 단위로 찾으면 ${manwon(start)}이고, 그 위로는 요율을 곱한 값이 한도액을 넘어 보수가 ${won(tier.cap!)}으로 고정됩니다. ` +
      `이 고정은 다음 구간 요율 ${pct(SALE_BROKERAGE_TIERS[2].rate, 1)}가 한도액을 다시 넘어서는 ${manwon(end)}까지 이어집니다. 즉 매매가 ${manwon(start)}과 ${manwon(end - AMOUNT_STEP)}의 보수가 둘 다 ${won(beforeEnd.maxFee)}입니다. ` +
      `그 사이 ${manwon(end - AMOUNT_STEP - start)} 구간에서 실효요율은 ${pct(atStart.effectiveRate, 2)}에서 ${pct(beforeEnd.effectiveRate, 2)}로 내려갑니다. 거래금액이 커지는데 부담률은 낮아지는 유일한 구간입니다. ` +
      `${manwon(end)}에서 보수가 ${won(atEnd.maxFee)}으로 다시 움직이기 시작하지만, 이 지점의 실효요율 ${pct(atEnd.effectiveRate, 1)}는 구간 시작점보다 여전히 낮습니다.`,
  };
}

function jeonseFlatSpans(): Finding {
  const first = { tier: RENT_BROKERAGE_TIERS[0], start: capStart(RENT_BROKERAGE_TIERS, 0), end: unfreezeAmount(RENT_BROKERAGE_TIERS, 0) };
  const second = { tier: RENT_BROKERAGE_TIERS[1], start: capStart(RENT_BROKERAGE_TIERS, 1), end: unfreezeAmount(RENT_BROKERAGE_TIERS, 1) };
  return {
    h2: `전세 보증금에는 보수가 멈추는 구간이 두 번 나온다`,
    body:
      `전세·월세 요율표에는 한도액이 두 곳 있습니다. ${manwon(first.tier.max!)} 미만 구간의 ${won(first.tier.cap!)}, ${manwon(second.tier.min)} 이상 ${manwon(second.tier.max!)} 미만 구간의 ${won(second.tier.cap!)}입니다. ` +
      `보증금을 ${manwon(AMOUNT_STEP)} 단위로 올리며 계산하면 첫 번째 한도는 ${manwon(first.start)}부터 걸려 ${manwon(first.end - AMOUNT_STEP)}까지, 두 번째 한도는 ${manwon(second.start)}부터 ${manwon(second.end - AMOUNT_STEP)}까지 보수가 고정됩니다. ` +
      `앞 구간은 ${manwon(first.end - AMOUNT_STEP - first.start)}, 뒤 구간은 ${manwon(second.end - AMOUNT_STEP - second.start)} 폭입니다. 보증금 ${manwon(first.start)}과 ${manwon(first.end - AMOUNT_STEP)}의 보수가 둘 다 ${won(fee("jeonse", first.start).maxFee)}, ${manwon(second.start)}과 ${manwon(second.end - AMOUNT_STEP)}이 둘 다 ${won(fee("jeonse", second.start).maxFee)}입니다. ` +
      `실효요율로는 ${pct(fee("jeonse", first.start).effectiveRate, 2)}에서 ${pct(fee("jeonse", first.end - AMOUNT_STEP).effectiveRate, 2)}, ${pct(fee("jeonse", second.start).effectiveRate, 2)}에서 ${pct(fee("jeonse", second.end - AMOUNT_STEP).effectiveRate, 2)}로 두 번 내려갑니다. 보증금을 조금 올려 계약 조건을 맞출 때 보수가 그대로인 구간이 여기입니다.`,
  };
}

function rawVersusCap(): Finding {
  const tier = SALE_BROKERAGE_TIERS[1];
  const worst = fee("sale", tier.max! - AMOUNT_STEP);
  const rentWorst = fee("jeonse", RENT_BROKERAGE_TIERS[1].max! - AMOUNT_STEP);
  return {
    h2: `요율만 곱해 계산하면 매매에서 ${won(worst.rawFee - worst.maxFee)}까지 과다 계산된다`,
    body:
      `"거래금액 × 상한요율"로 암산하면 한도액을 빠뜨리게 됩니다. 매매 ${manwon(tier.max! - AMOUNT_STEP)}에서 요율 ${pct(tier.rate, 1)}를 그대로 곱하면 ${won(worst.rawFee)}이지만 실제 상한은 한도액 ${won(worst.maxFee)}입니다. 차이가 ${won(worst.rawFee - worst.maxFee)}으로, 요율 계산값의 ${pct((worst.rawFee - worst.maxFee) / worst.rawFee)}에 해당합니다. ` +
      `전세도 마찬가지여서 보증금 ${manwon(RENT_BROKERAGE_TIERS[1].max! - AMOUNT_STEP)}이면 요율 계산값 ${won(rentWorst.rawFee)}과 실제 ${won(rentWorst.maxFee)}의 차이가 ${won(rentWorst.rawFee - rentWorst.maxFee)}입니다. ` +
      `한도액이 걸리는 구간은 매매 ${manwon(SALE_BROKERAGE_TIERS[1].max!)} 미만, 전세 ${manwon(RENT_BROKERAGE_TIERS[1].max!)} 미만으로 소액 거래에 몰려 있습니다. ` +
      `금액이 작을수록 요율표만 보고 계산한 값과 실제 상한의 차이가 상대적으로 크다는 뜻이라, 소액 전월세일수록 이 계산기를 거치는 편이 정확합니다.`,
  };
}

function monthlyConversionCliff(): Finding {
  const deposit = 10_000_000;
  const lowRent = 390_000;
  const highRent = 400_000;
  const annualRentGap = (highRent - lowRent) * 12;
  const low = fee("monthly", deposit, lowRent);
  const high = fee("monthly", deposit, highRent);
  return {
    h2: `월세 ${won(highRent - lowRent)} 차이로 환산 거래금액이 ${won(high.dealAmount - low.dealAmount)} 뛴다`,
    body:
      `월세 거래금액은 보증금 + 월세×100으로 환산하되, 그 합이 ${manwon(CONVERSION_LINE)} 미만이면 보증금 + 월세×70을 씁니다. 어느 식을 쓸지 판정하는 기준이 ×100 결과이므로, 판정선을 넘는 순간 적용 식 자체가 바뀝니다. ` +
      `보증금 ${manwon(deposit)}·월세 ${won(lowRent)}이면 ×100 환산액이 ${manwon(CONVERSION_LINE)}에 못 미쳐 ×70이 적용돼 거래금액이 ${won(low.dealAmount)}, 보수가 ${won(low.maxFee)}입니다. ` +
      `월세를 ${won(highRent)}으로 ${won(highRent - lowRent)}만 올리면 ×100이 적용돼 거래금액이 ${won(high.dealAmount)}, 보수가 ${won(high.maxFee)}이 됩니다. 거래금액이 ${won(high.dealAmount - low.dealAmount)} 뛰고 보수는 ${won(high.maxFee - low.maxFee)} 오릅니다. ` +
      `월세 ${won(highRent - lowRent)}의 연간 부담이 ${won(annualRentGap)}인 것과 비교하면 보수 증가분이 그중 ${pct((high.maxFee - low.maxFee) / annualRentGap)}를 차지합니다. 판정선 근처에서는 보증금을 조금 올려 월세를 낮추는 쪽이 보수까지 함께 낮춥니다.`,
  };
}

function monthlyPresetGrid(): Finding {
  const cells = RENT_DEPOSIT_PRESETS.flatMap((deposit) =>
    MONTHLY_RENT_PRESETS.map((rent) => ({ deposit, rent, r: fee("monthly", deposit, rent) })),
  );
  const converted = cells.filter((c) => c.r.dealAmount < c.deposit + c.rent * 100);
  const sorted = [...cells].sort((a, b) => a.r.maxFee - b.r.maxFee);
  const cheapest = sorted[0];
  const priciest = sorted[sorted.length - 1];
  const twins = cells.filter((c) => c.r.dealAmount === 150_000_000);
  return {
    h2: `월세 프리셋 ${cells.length}조합 중 ×70 환산에 걸리는 것은 ${converted.length}개다`,
    body:
      `이 페이지의 보증금 프리셋 ${RENT_DEPOSIT_PRESETS.length}개와 월세 프리셋 ${MONTHLY_RENT_PRESETS.length}개를 모두 곱한 ${cells.length}가지 조합을 계산해 보면, 환산 거래금액이 전부 판정선 ${manwon(CONVERSION_LINE)} 위에 있어 ×70 식이 쓰이는 조합은 ${converted.length}가지입니다. ` +
      `가장 낮은 조합은 보증금 ${manwon(cheapest.deposit)}·월세 ${won(cheapest.rent)}의 ${won(cheapest.r.maxFee)}, 가장 높은 조합은 보증금 ${manwon(priciest.deposit)}·월세 ${won(priciest.rent)}의 ${won(priciest.r.maxFee)}으로 ${times(priciest.r.maxFee, cheapest.r.maxFee, 0)} 차이가 납니다. ` +
      `보증금과 월세를 어떻게 나누든 환산액이 같으면 결과도 같습니다. 보증금 ${manwon(twins[0].deposit)}·월세 ${won(twins[0].rent)}과 보증금 ${manwon(twins[1].deposit)}·월세 ${won(twins[1].rent)}은 서로 조건이 달라 보이지만 둘 다 환산 ${won(twins[0].r.dealAmount)}, 보수 ${won(twins[1].r.maxFee)}입니다. ` +
      `보증금을 월세로 돌리는 협상은 판정선 위에서는 보수를 바꾸지 못한다는 뜻이고, 실제로 바꾸려면 환산 총액 자체를 낮춰야 합니다.`,
  };
}

function saleJeonseEqualBand(): Finding {
  const overlapStart = RENT_BROKERAGE_TIERS[3].min;
  const overlapEnd = SALE_BROKERAGE_TIERS[2].max!;
  const low = 500_000_000;
  const inside = 700_000_000;
  const high = 1_200_000_000;
  return {
    h2: `${manwon(overlapStart)}부터 ${manwon(overlapEnd)}까지는 매매와 전세의 보수 상한이 같다`,
    body:
      `매매와 전세는 구간 경계가 어긋나 있어 같은 금액이라도 보수가 다릅니다. 매매 ${manwon(low)}은 ${won(fee("sale", low).maxFee)}, 전세 ${manwon(low)}은 ${won(fee("jeonse", low).maxFee)}으로 전세가 ${won(fee("sale", low).maxFee - fee("jeonse", low).maxFee)} 낮습니다. ` +
      `그런데 매매 ${pct(SALE_BROKERAGE_TIERS[2].rate, 1)} 구간(${manwon(SALE_BROKERAGE_TIERS[2].min)}~${manwon(SALE_BROKERAGE_TIERS[2].max!)})과 전세 ${pct(RENT_BROKERAGE_TIERS[3].rate, 1)} 구간(${manwon(RENT_BROKERAGE_TIERS[3].min)}~${manwon(RENT_BROKERAGE_TIERS[3].max!)})이 겹치는 ${manwon(overlapStart)}~${manwon(overlapEnd)}에서는 두 요율이 같아집니다. 실제로 ${manwon(inside)}에서 매매 ${won(fee("sale", inside).maxFee)}, 전세 ${won(fee("jeonse", inside).maxFee)}으로 동일합니다. ` +
      `이 구간을 벗어나면 다시 갈라져서 ${manwon(high)}이면 매매 ${won(fee("sale", high).maxFee)}, 전세 ${won(fee("jeonse", high).maxFee)}으로 ${won(fee("sale", high).maxFee - fee("jeonse", high).maxFee)} 차이가 납니다. ` +
      `"전세가 매매보다 싸다"는 일반화가 성립하지 않는 구간이 중간에 끼어 있다는 뜻이고, 그 폭은 ${manwon(overlapEnd - overlapStart)}입니다.`,
  };
}

function highEndLinear(): Finding {
  const top = SALE_BROKERAGE_TIERS[SALE_BROKERAGE_TIERS.length - 1];
  const at15 = fee("sale", top.min);
  const at30 = fee("sale", top.min * 2);
  const smallest = fee("sale", capStart(SALE_BROKERAGE_TIERS, 0));
  return {
    h2: `${manwon(top.min)} 위로는 한도액이 없어 거래금액이 ${times(at30.dealAmount, at15.dealAmount, 0)}면 보수도 정확히 ${times(at30.maxFee, at15.maxFee, 0)}가 된다`,
    body:
      `요율표의 두 끝은 정반대로 작동합니다. 아래쪽 ${manwon(SALE_BROKERAGE_TIERS[0].max!)} 미만 구간은 한도액 ${won(SALE_BROKERAGE_TIERS[0].cap!)}이 있어 ${manwon(capStart(SALE_BROKERAGE_TIERS, 0))}을 넘으면 보수가 ${won(smallest.maxFee)}에서 멈춥니다. ` +
      `위쪽 ${manwon(top.min)} 이상 구간에는 한도액이 없어 상한요율 ${pct(top.rate, 1)}가 그대로 비례합니다. ${manwon(top.min)}이면 ${won(at15.maxFee)}, ${manwon(top.min * 2)}이면 ${won(at30.maxFee)}으로 정확히 ${times(at30.maxFee, at15.maxFee, 0)}입니다. ` +
      `두 끝의 실효요율은 ${pct(smallest.effectiveRate, 2)}와 ${pct(at30.effectiveRate, 1)}로 ${times(at30.effectiveRate, smallest.effectiveRate, 1)} 차이가 납니다. ` +
      `거래금액이 커질수록 협의 한 번의 금액이 커지는 구조라, ${manwon(top.min * 2)} 거래에서 요율을 ${pp(top.rate - SALE_BROKERAGE_TIERS[4].rate, 1)} 낮춰 ${pct(SALE_BROKERAGE_TIERS[4].rate, 1)}로 정하면 보수가 ${won(at30.maxFee - top.min * 2 * SALE_BROKERAGE_TIERS[4].rate)} 줄어듭니다. 이 계산기가 보여주는 값은 어디까지나 상한이고, 실제 보수는 그 안에서 협의해 정합니다.`,
  };
}

function presetLadder(): Finding {
  const rungs = SALE_PRICE_PRESETS.map((amount) => ({ amount, r: fee("sale", amount) }));
  const text = rungs.map(({ amount, r }) => `${manwon(amount)} ${won(r.maxFee)}(${pct(r.effectiveRate, 1)})`).join(", ");
  const [low, , , high] = rungs;
  return {
    h2: `프리셋 네 개만 눌러 봐도 보수가 ${times(high.r.maxFee, low.r.maxFee, 1)}가 된다`,
    body:
      `이 페이지의 매매 프리셋으로 계산하면 ${text}입니다. 거래금액은 ${manwon(low.amount)}에서 ${manwon(high.amount)}으로 ${times(high.amount, low.amount, 1)}가 되는데 보수는 ${times(high.r.maxFee, low.r.maxFee, 1)}가 됩니다. ` +
      `요율이 ${pct(low.r.tier.rate, 1)}에서 ${pct(high.r.tier.rate, 1)}로 올라가기 때문이고, 그만큼 실효요율도 ${pct(low.r.effectiveRate, 1)}에서 ${pct(high.r.effectiveRate, 1)}로 ${pp(high.r.effectiveRate - low.r.effectiveRate, 1)} 벌어집니다. ` +
      `구간별 증가폭도 고르지 않아 ${manwon(rungs[0].amount)}에서 ${manwon(rungs[1].amount)}으로 갈 때 ${won(rungs[1].r.maxFee - rungs[0].r.maxFee)}, ${manwon(rungs[2].amount)}에서 ${manwon(rungs[3].amount)}으로 갈 때 ${won(rungs[3].r.maxFee - rungs[2].r.maxFee)} 늘어납니다. ` +
      `여기에 부가가치세가 별도로 붙고, 매도인과 매수인이 각각 이 금액을 부담하므로 한 거래에서 중개사가 받는 총액은 표시 금액의 두 배가 됩니다.`,
  };
}

export const BROKERAGE_FEE_DIGEST: Finding[] = [
  saleTierCliffs(),
  saleFlatSpan(),
  jeonseFlatSpans(),
  rawVersusCap(),
  monthlyConversionCliff(),
  monthlyPresetGrid(),
  saleJeonseEqualBand(),
  highEndLinear(),
  presetLadder(),
];

export const BROKERAGE_FEE_BASIS: Finding = {
  h2: "위 발견의 계산 기준",
  body:
    `위 금액은 전부 이 페이지의 중개보수 계산기를 거래금액 ${manwon(AMOUNT_STEP)} 단위로 돌려 얻은 값이며, 요율표는 ${BROKERAGE_DATA_UPDATED}에 확인한 서울시 주택 중개보수 기준입니다. 다른 지자체는 조례로 요율이 다를 수 있어 같은 금액이라도 결과가 달라집니다. ` +
    `계산 결과는 의뢰인 한 사람이 부담하는 상한액이고 확정 금액이 아닙니다. 실제 보수는 상한 안에서 중개사와 협의해 정하며, 부가가치세는 별도입니다. ` +
    `주택 외 오피스텔·상가·토지는 요율 체계가 달라 이 계산기의 범위 밖입니다. 위 비교에 쓴 보증금·월세 조합은 요율 구조를 드러내기 위한 가정값입니다.`,
};
