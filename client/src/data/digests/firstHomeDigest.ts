// /first-home digest. Four switches (price, income, regulated area, household
// type) feed two very different outputs — a flat 200만원 tax relief and a capped
// loan — so the interesting facts are about where each switch stops mattering.
// Sweeping price in 100만원 steps shows the exact prices at which the LTV
// difference disappears, the newlywed cap starts paying, and the relief stops
// covering the bill.

import { FIRST_HOME_UPDATED } from "../firstHome";
import { DEFAULT_FIRST_HOME_INPUT } from "@/lib/housingValidators";
import { calculateFirstHomeBenefits, type FirstHomeBenefitInput } from "@/utils/housingCalculator";
import { type Finding, eun, manwon, pct, pp, times, won } from "./format";

export const fh = (patch: Partial<FirstHomeBenefitInput>) =>
  calculateFirstHomeBenefits({ ...DEFAULT_FIRST_HOME_INPUT, ...patch });

export const PRICE_STEP = 1_000_000;
export const PRICE_CEILING = 1_200_000_000;
export const INCOME_CEILING = 70_000_000;

/** Highest price at which the flat relief still wipes the acquisition tax out. */
export function fullyOffsetPrice(): number {
  let last = 0;
  for (let price = 100_000_000; price <= 400_000_000; price += PRICE_STEP) {
    if (fh({ homePrice: price }).acquisitionTaxAfterRelief === 0) last = price;
  }
  return last;
}

/** First price at which the regulated-area LTV no longer changes the loan. */
export function ltvIrrelevantPrice(): number {
  for (let price = 100_000_000; price <= PRICE_CEILING; price += PRICE_STEP) {
    if (fh({ homePrice: price, isRegulatedArea: true }).didimdolLoanAmount === fh({ homePrice: price }).didimdolLoanAmount) {
      return price;
    }
  }
  return 0;
}

/** First price at which the newlywed/multi-child cap produces a bigger loan. */
export function newlywedPayoffPrice(): number {
  for (let price = 100_000_000; price <= PRICE_CEILING; price += PRICE_STEP) {
    if (fh({ homePrice: price, isNewlywedOrMultiChild: true }).didimdolLoanAmount > fh({ homePrice: price }).didimdolLoanAmount) {
      return price;
    }
  }
  return 0;
}

function priceCutoff(): Finding {
  const at = fh({ homePrice: PRICE_CEILING });
  const over = fh({ homePrice: PRICE_CEILING + 1 });
  return {
    h2: `주택가액 ${manwon(PRICE_CEILING)}에서 1원을 넘기면 감면 ${won(at.estimatedTaxRelief)}이 사라진다`,
    body:
      `생애최초 취득세 감면은 주택가액 ${manwon(PRICE_CEILING)} 이하에만 적용되는 조건부 혜택입니다. 계산기에서 가격만 1원 올려 보면 감면이 ${won(at.estimatedTaxRelief)}에서 ${won(over.estimatedTaxRelief)}으로 바뀝니다. ` +
      `취득세 자체는 양쪽 모두 ${won(at.acquisitionTax)}으로 같은데 납부액이 ${won(at.acquisitionTaxAfterRelief)}과 ${won(over.acquisitionTaxAfterRelief)}으로 갈립니다. ` +
      `이 구간의 취득세율은 ${pct(at.taxRate, 1)}로 상한에 도달해 있어, 가격이 1원 오른 대가로 늘어나는 세금은 사실상 0인데도 감면 자격만 끊기는 셈입니다. ` +
      `주택가액이 이 선 근처라면 계약서 금액을 ${manwon(PRICE_CEILING)} 이하로 맞추는 것이 감면 ${won(at.estimatedTaxRelief)}을 지키는 유일한 방법이고, 이는 매매가를 ${won(at.estimatedTaxRelief)} 깎는 것과 같은 효과입니다.`,
  };
}

function incomeCutoff(): Finding {
  const at = fh({ annualIncome: INCOME_CEILING });
  const over = fh({ annualIncome: INCOME_CEILING + 1 });
  return {
    h2: `부부합산 소득 ${manwon(INCOME_CEILING)}에서 1원을 넘기면 대출 ${won(at.didimdolLoanAmount)}이 통째로 0이 된다`,
    body:
      `디딤돌대출 자격은 부부합산 연소득 ${manwon(INCOME_CEILING)} 이하로 계산합니다. 기본 주택가액 ${manwon(DEFAULT_FIRST_HOME_INPUT.homePrice)} 조건에서 소득만 1원 올리면 대출 가능액이 ${won(at.didimdolLoanAmount)}에서 ${won(over.didimdolLoanAmount)}으로 떨어집니다. ` +
      `그 결과 필요 현금이 ${won(at.requiredCash)}에서 ${won(over.requiredCash)}으로 ${won(over.requiredCash - at.requiredCash)} 늘어납니다. 소득 1원의 대가가 현금 ${won(over.requiredCash - at.requiredCash)}인 셈입니다. ` +
      `금리 우대 ${pp(at.rateDiscount)}도 함께 사라져 자격 유무의 차이는 한도만이 아닙니다. 취득세 감면 ${won(at.estimatedTaxRelief)}은 소득과 무관하게 유지되므로, 두 혜택의 조건이 서로 다르다는 점을 나눠 봐야 합니다. ` +
      `이 계산기는 소득을 한 칸으로 받지만 실제 심사는 부부합산이고 연도별 소득 인정 기준이 따로 있어, 경계 근처라면 기금 상담 창구에서 확인하는 편이 안전합니다.`,
  };
}

function ltvVanishes(): Finding {
  const price = ltvIrrelevantPrice();
  const sample = 375_000_000;
  const plain = fh({ homePrice: sample });
  const regulated = fh({ homePrice: sample, isRegulatedArea: true });
  const atPrice = fh({ homePrice: price });
  return {
    h2: `규제지역 LTV ${pp(plain.ltvLimit - regulated.ltvLimit, 0)} 차이는 주택가액 ${manwon(price)}부터 결과에 나타나지 않는다`,
    body:
      `규제지역이면 LTV가 ${pct(regulated.ltvLimit, 0)}, 아니면 ${pct(plain.ltvLimit, 0)}로 계산되지만, 대출 가능액에는 한도 ${manwon(plain.didimdolCap)}이 함께 걸립니다. 둘 중 작은 값이 답이므로 가격이 커지면 LTV가 아니라 한도가 결정합니다. ` +
      `주택가액을 ${PRICE_STEP.toLocaleString("ko-KR")}원 단위로 올리며 두 조건을 비교하면 ${manwon(price)}부터 양쪽 모두 ${won(atPrice.didimdolLoanAmount)}으로 같아집니다. ` +
      `그 아래에서는 차이가 실제로 납니다. ${manwon(sample)}이면 비규제 ${won(plain.didimdolLoanAmount)}, 규제 ${won(regulated.didimdolLoanAmount)}으로 ${won(plain.didimdolLoanAmount - regulated.didimdolLoanAmount)} 벌어지고 필요 현금도 그만큼 달라집니다. ` +
      `규제지역 지정 여부를 먼저 확인해야 하는 구간은 ${manwon(price)} 미만이라는 뜻이고, 그 위 가격대에서는 지정 여부보다 한도 자체가 자금 계획을 결정합니다.`,
  };
}

function newlywedCap(): Finding {
  const payoff = newlywedPayoffPrice();
  const atPayoff = fh({ homePrice: payoff, isNewlywedOrMultiChild: true });
  const basePayoff = fh({ homePrice: payoff });
  const full = fh({ homePrice: 500_000_000, isNewlywedOrMultiChild: true });
  const fullBase = fh({ homePrice: 500_000_000 });
  return {
    h2: `신혼·다자녀 한도 ${eun(manwon(atPayoff.didimdolCap - basePayoff.didimdolCap))} 주택가액 ${manwon(payoff)}부터 붙기 시작해 ${manwon(500_000_000)}에서야 다 채워진다`,
    body:
      `신혼부부·다자녀 가구는 한도가 ${manwon(basePayoff.didimdolCap)}에서 ${manwon(atPayoff.didimdolCap)}으로 올라갑니다. 그런데 대출액은 LTV를 곱한 값과 한도 중 작은 쪽이라, 가격이 낮으면 늘어난 한도가 놀고 있습니다. ` +
      `${PRICE_STEP.toLocaleString("ko-KR")}원 단위로 훑으면 차이가 처음 나타나는 지점이 ${manwon(payoff)}이고, 그때의 차이는 ${won(atPayoff.didimdolLoanAmount - basePayoff.didimdolLoanAmount)}에 불과합니다. ` +
      `가격이 ${manwon(500_000_000)}에 이르러서야 ${won(full.didimdolLoanAmount)} 대 ${won(fullBase.didimdolLoanAmount)}으로 ${won(full.didimdolLoanAmount - fullBase.didimdolLoanAmount)} 전부가 살아납니다. ` +
      `필요 현금으로 보면 같은 주택에서 ${won(fullBase.requiredCash)}이 ${won(full.requiredCash)}으로 줄어드는 차이입니다. 한도 증액을 자산으로 계산하려면 주택가액이 ${manwon(payoff)}을 넘어야 한다는 조건이 먼저입니다.`,
  };
}

function reliefShare(): Finding {
  const offset = fullyOffsetPrice();
  const atOffset = fh({ homePrice: offset });
  const base = fh({});
  const high = fh({ homePrice: 900_000_000 });
  return {
    h2: `감면 ${won(base.estimatedTaxRelief)}이 취득세를 전부 지우는 최대 주택가액은 ${manwon(offset)}이다`,
    body:
      `생애최초 감면은 비율이 아니라 정액 상한입니다. 산출세액이 그보다 작으면 세금이 0이 되고, 크면 초과분만 남습니다. ` +
      `${PRICE_STEP.toLocaleString("ko-KR")}원 단위로 훑으면 ${manwon(offset)}까지는 취득세 ${won(atOffset.acquisitionTax)}이 전액 감면돼 납부액이 ${won(atOffset.acquisitionTaxAfterRelief)}이고, 그 위로는 잔액이 생깁니다. ` +
      `기본값 ${manwon(DEFAULT_FIRST_HOME_INPUT.homePrice)}에서는 취득세 ${won(base.acquisitionTax)} 중 ${won(base.estimatedTaxRelief)}이 감면돼 감면율이 ${pct(base.estimatedTaxRelief / base.acquisitionTax)}, ${manwon(900_000_000)}에서는 ${won(high.acquisitionTax)} 중 같은 금액이 감면돼 ${pct(high.estimatedTaxRelief / high.acquisitionTax)}로 떨어집니다. ` +
      `가격이 ${times(900_000_000, offset, 1)}가 되는 동안 감면의 체감 가치는 ${pct(atOffset.estimatedTaxRelief / atOffset.acquisitionTax)}에서 ${pct(high.estimatedTaxRelief / high.acquisitionTax)}로 줄어듭니다. 정액 혜택은 저가 주택에서 가장 강하게 작동합니다.`,
  };
}

function requiredCashLadder(): Finding {
  const rungs = [300_000_000, 600_000_000, 900_000_000].map((homePrice) => ({ homePrice, r: fh({ homePrice }) }));
  const [low, mid, high] = rungs;
  const text = rungs
    .map(({ homePrice, r }) => `${manwon(homePrice)} 대출 ${won(r.didimdolLoanAmount)}·현금 ${won(r.requiredCash)}`)
    .join(", ");
  return {
    h2: `한도에 걸린 뒤로는 주택가액이 ${manwon(300_000_000)} 오르면 필요 현금도 정확히 ${won(high.r.requiredCash - mid.r.requiredCash)} 늘어난다`,
    body:
      `대출 한도가 ${manwon(low.r.didimdolCap)}에서 멈추기 때문에, 그 한도에 도달한 뒤로는 가격 상승분이 전액 현금 부담이 됩니다. ` +
      `계산해 보면 ${text}입니다. ${manwon(low.homePrice)}에서는 LTV ${pct(low.r.ltvLimit, 0)}가 먼저 걸려 대출이 ${won(low.r.didimdolLoanAmount)}이지만, ${manwon(mid.homePrice)}부터는 한도가 걸려 대출이 ${won(mid.r.didimdolLoanAmount)}으로 고정됩니다. ` +
      `그래서 ${manwon(low.homePrice)}→${manwon(mid.homePrice)} 구간에서 현금이 ${won(mid.r.requiredCash - low.r.requiredCash)} 늘어나는 동안 ${manwon(mid.homePrice)}→${manwon(high.homePrice)} 구간에서는 ${won(high.r.requiredCash - mid.r.requiredCash)}, 즉 가격 상승분 전부가 현금으로 옮겨 갑니다. ` +
      `주택가액 대비 대출 비율로 보면 ${pct(low.r.didimdolLoanAmount / low.homePrice)}에서 ${pct(high.r.didimdolLoanAmount / high.homePrice)}로 떨어져, 가격이 높을수록 이 제도의 지렛대 효과가 약해집니다.`,
  };
}

function cashOmitsTax(): Finding {
  const base = fh({});
  const high = fh({ homePrice: 900_000_000 });
  return {
    h2: `계산기의 필요 현금에는 취득세 ${won(base.acquisitionTaxAfterRelief)}이 빠져 있다`,
    body:
      `필요 현금은 주택가액에서 대출 가능액을 뺀 금액으로 계산됩니다. 잔금 자체만 본 숫자라 세금과 부대비용은 들어 있지 않습니다. ` +
      `기본값 ${manwon(DEFAULT_FIRST_HOME_INPUT.homePrice)}이면 필요 현금 ${won(base.requiredCash)}에 감면 후 취득세 ${won(base.acquisitionTaxAfterRelief)}을 더해 ${won(base.requiredCash + base.acquisitionTaxAfterRelief)}을 준비해야 합니다. ` +
      `주택가액 ${manwon(900_000_000)}이면 세금이 ${won(high.acquisitionTaxAfterRelief)}으로 커져 실제 필요 금액이 ${won(high.requiredCash)}에서 ${won(high.requiredCash + high.acquisitionTaxAfterRelief)}으로 올라갑니다. 표시된 필요 현금 대비 ${pct(high.acquisitionTaxAfterRelief / high.requiredCash)}가 더 드는 셈입니다. ` +
      `여기에 중개보수와 법무사 비용, 이사비가 더 붙습니다. 이 페이지의 숫자는 자금 계획의 하한선으로 읽고, 세금은 취득세 계산기에서, 중개보수는 중개보수 계산기에서 각각 더해야 실제 잔금일에 필요한 금액이 나옵니다.`,
  };
}

function rateDiscountValue(): Finding {
  const base = fh({});
  const annual = base.didimdolLoanAmount * base.rateDiscount;
  const years = base.estimatedTaxRelief / annual;
  return {
    h2: `금리 우대 ${pp(base.rateDiscount)}의 첫해 값은 ${won(annual)}으로, 감면 ${won(base.estimatedTaxRelief)}을 ${years.toFixed(1)}년이면 따라잡는다`,
    body:
      `생애최초 자격이 주는 혜택은 취득세 감면과 대출 한도만이 아닙니다. 계산기는 금리 우대 ${pp(base.rateDiscount)}도 함께 판정합니다. ` +
      `기본값에서 대출 ${won(base.didimdolLoanAmount)}에 이 우대를 적용하면 첫해 이자가 ${won(annual)} 줄어듭니다. 취득세 감면 ${won(base.estimatedTaxRelief)}과 비교하면 ${years.toFixed(1)}년치에 해당하는 금액입니다. ` +
      `원금이 줄면 절감액도 함께 줄지만, 대출 기간이 통상 20~30년인 점을 감안하면 한 번 받는 감면보다 누적 금액이 커집니다. 감면은 잔금일에 한 번, 우대금리는 상환 기간 내내 작동하기 때문입니다. ` +
      `이 계산기는 우대 폭만 판정하고 상환 스케줄은 계산하지 않으므로, 총 이자 차이는 대출 계산기에서 원금과 기간을 넣어 확인해야 합니다.`,
  };
}

function reliefVersusPriceSlope(): Finding {
  const step = 10_000_000;
  const low = fh({ homePrice: 700_000_000 });
  const lowNext = fh({ homePrice: 700_000_000 + step });
  const base = fh({});
  const equivalent = (base.estimatedTaxRelief / (lowNext.acquisitionTax - low.acquisitionTax)) * step;
  return {
    h2: `감면 ${won(base.estimatedTaxRelief)}은 ${manwon(700_000_000)} 구간에서 매매가 ${manwon(equivalent)}을 깎은 것과 같다`,
    body:
      `${manwon(600_000_000)}에서 ${manwon(900_000_000)} 사이는 취득세율이 가격에 따라 오르는 구간이라, 가격을 깎으면 세율과 곱해지는 금액이 함께 내려갑니다. ` +
      `${manwon(700_000_000)}에서 ${manwon(step)}을 올리면 취득세가 ${won(low.acquisitionTax)}에서 ${won(lowNext.acquisitionTax)}으로 ${won(lowNext.acquisitionTax - low.acquisitionTax)} 오릅니다. 세율도 ${pct(low.taxRate)}에서 ${pct(lowNext.taxRate)}로 함께 움직입니다. ` +
      `이 기울기로 환산하면 감면 ${won(base.estimatedTaxRelief)}은 매매가를 ${manwon(equivalent)} 낮춘 것과 같은 세금 효과입니다. ` +
      `감면 자격을 따지는 일과 가격을 협상하는 일 중 어느 쪽이 큰지 이 숫자로 비교할 수 있고, 이 구간에서는 가격 ${manwon(step)}의 협상이 감면의 ${pct((lowNext.acquisitionTax - low.acquisitionTax) / base.estimatedTaxRelief)}에 해당합니다.`,
  };
}

export const FIRST_HOME_DIGEST: Finding[] = [
  priceCutoff(),
  incomeCutoff(),
  ltvVanishes(),
  newlywedCap(),
  reliefShare(),
  requiredCashLadder(),
  cashOmitsTax(),
  rateDiscountValue(),
  reliefVersusPriceSlope(),
];

export const FIRST_HOME_BASIS: Finding = {
  h2: "위 발견의 계산 기준",
  body:
    `위 수치는 전부 이 페이지의 생애최초 주택 혜택 계산기를 돌린 값이며, 따로 적지 않은 조건은 기본값(주택가액 ${manwon(DEFAULT_FIRST_HOME_INPUT.homePrice)}, 부부합산 연소득 ${manwon(DEFAULT_FIRST_HOME_INPUT.annualIncome)}, 생애최초, 비규제지역, 신혼·다자녀 아님)을 씁니다. 감면·한도 기준은 ${FIRST_HOME_UPDATED} 확인분입니다. ` +
    `이 계산기는 취득세 감면 상한과 디딤돌대출 한도만 모델링한 참고용 추정입니다. 주택 면적·소재지 요건, 무주택 세대주 판정, 실거주 의무, 대출 기간과 상환 방식, 방공제(소액임차보증금) 같은 실제 심사 항목은 반영되어 있지 않아 실제 승인 금액은 위 수치보다 작을 수 있습니다. ` +
    `특히 대출 한도는 주택가액만으로 계산하므로 고가 주택에서도 한도가 그대로 나오지만, 실제 기금 대출에는 주택가액 상한이 별도로 있습니다. 정확한 자격과 한도는 주택도시기금 창구에서 확인하시기 바랍니다.`,
};
