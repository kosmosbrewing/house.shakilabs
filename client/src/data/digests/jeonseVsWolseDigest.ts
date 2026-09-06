// /jeonse-vs-wolse digest. The comparison looks linear, but the engine hides a
// tie point that equals the listing's own conversion rate, a clamp that breaks
// the relation between the monthly gap and the cumulative difference, and an
// analysis-period field that scales the answer without ever changing it.

import { JEONSE_WOLSE_DATA_UPDATED, OPPORTUNITY_RATE_PRESETS } from "../jeonseWolse";
import { calculateJeonseVsWolse, type JeonseVsWolseInput } from "@/utils/housingCalculator";
import { type Finding, manwon, num, pct, times, won } from "./format";

// The screen defaults are written out again as an independent literal on purpose.
// 화면 기본값 객체를 그대로 참조하면 "기준 입력이 화면 기본값과 같다"는 테스트가
// 자기 자신을 비교하게 되어 절대 red가 되지 않는다. 같은 값을 따로 적어 두고
// digests.test.ts가 DEFAULT_JEONSE_WOLSE_INPUT과 대조하게 만든다.
export const BASE: JeonseVsWolseInput = {
  jeonseDeposit: 400_000_000,
  wolseDeposit: 50_000_000,
  monthlyRent: 1_300_000,
  annualOpportunityRate: 0.035,
  analysisYears: 2,
};

export const jw = (patch: Partial<JeonseVsWolseInput> = {}) =>
  calculateJeonseVsWolse({ ...BASE, ...patch });

/** Opportunity rate at which both sides cost exactly the same = the listing's conversion rate. */
export function tieRate(input: JeonseVsWolseInput = BASE): number {
  return (input.monthlyRent * 12) / (input.jeonseDeposit - input.wolseDeposit);
}

/** Lowest whole-won rent cut that makes a deposit-for-rent swap actually pay off. */
export function swapPayoffCut(addedDeposit: number): number {
  const baseline = jw().difference;
  for (let cut = 0; cut <= 1_000_000; cut += 1) {
    if (jw({ wolseDeposit: BASE.wolseDeposit + addedDeposit, monthlyRent: BASE.monthlyRent - cut }).difference < baseline) {
      return cut;
    }
  }
  return 0;
}

export const SWAP_DEPOSIT = 50_000_000;
export const OFFER_A = { wolseDeposit: 50_000_000, monthlyRent: 1_000_000 };
export const OFFER_B = { wolseDeposit: 200_000_000, monthlyRent: 700_000 };
/** Rate at which the two monthly-rent offers cost the same: 12 x rent gap / deposit gap. */
export const OFFER_TIE_RATE =
  ((OFFER_A.monthlyRent - OFFER_B.monthlyRent) * 12) / (OFFER_B.wolseDeposit - OFFER_A.wolseDeposit);
/** jeonseDeposit ceiling declared by the input validator. */
export const DEPOSIT_INPUT_CEILING = 5_000_000_000;

function baseline(): Finding {
  const b = jw();
  return {
    h2: `기본 조건의 손익분기 월세는 ${won(b.breakEvenMonthlyRent)}이고 실제 월세가 ${won(b.monthlyCostGap)} 위에 있다`,
    body:
      `계산기 기본값(전세보증금 ${manwon(BASE.jeonseDeposit)}, 월세보증금 ${manwon(BASE.wolseDeposit)}, 월세 ${manwon(BASE.monthlyRent)}, 기회비용 금리 연 ${pct(BASE.annualOpportunityRate, 1)}, 분석 기간 ${BASE.analysisYears}년)으로 돌리면 전세 쪽 연간 비용이 ${won(b.jeonseAnnualCost)}, 월세 쪽이 ${won(b.wolseAnnualCost)}입니다. ` +
      `${BASE.analysisYears}년 누적으로는 ${won(b.difference)} 차이가 나고 판정은 전세입니다. ` +
      `이 조건의 손익분기 월세가 ${won(b.breakEvenMonthlyRent)}이므로 지금 월세는 그보다 ${won(b.monthlyCostGap)} 높고, 그 초과분이 열두 달과 ${BASE.analysisYears}년을 거쳐 누적 차액이 됩니다. ` +
      `같은 판정을 보증금 축에서 보면 손익분기 전세보증금이 ${won(b.breakEvenJeonseDeposit)}입니다. 이 매물의 전세보증금이 그 선을 넘어야 비로소 월세 쪽이 이깁니다. ` +
      `월세를 깎는 협상은 ${won(b.monthlyCostGap)}을, 전세를 올려 받으려는 협상은 ${won(b.breakEvenJeonseDeposit - BASE.jeonseDeposit)}을 각각의 여유 구간으로 씁니다.`,
  };
}

function oneWonFlip(): Finding {
  const low = jw({ monthlyRent: 1_020_833 });
  const high = jw({ monthlyRent: 1_020_834 });
  const b = jw();
  return {
    h2: `월세 1원 차이로 판정이 뒤집히고 그때 ${BASE.analysisYears}년 누적 차액은 ${won(Math.abs(low.difference))}에 그친다`,
    body:
      `판정 라벨은 어느 쪽이 싼지만 말하고 얼마나 싼지는 말하지 않습니다. 기본 조건에서 월세만 ${won(1_020_833)}으로 낮추면 ${BASE.analysisYears}년 누적 차액이 ${won(low.difference)}이 되어 월세가 이깁니다. ` +
      `여기서 1원 올린 ${won(1_020_834)}에서는 차액이 ${won(high.difference)}으로 부호가 바뀌어 전세가 이깁니다. 두 화면 모두 같은 형식의 결론을 띄우지만 실제 격차는 기본값 월세에서의 ${won(b.difference)}을 ${num(b.difference / Math.abs(low.difference))}으로 나눈 크기입니다. ` +
      `손익분기 월세가 ${num(1_020_833 + 1 / 3, 3)}원이라는 소수라서 정수 원 단위 입력으로는 정확한 동률을 만들 수 없고, 계산기는 그 사이에 낀 1원을 판정이라는 이분법으로 증폭해 보여줍니다. ` +
      `결론 문장 옆의 금액을 함께 읽어야 하는 이유가 여기 있습니다. 부호만 보고 계약을 고르면 ${won(Math.abs(low.difference))}짜리 우열을 근거로 삼게 됩니다.`,
  };
}

function periodIsAMultiplier(): Finding {
  const rows = [1, 2, 5, 10].map((analysisYears) => ({ analysisYears, r: jw({ analysisYears }) }));
  const text = rows.map(({ analysisYears, r }) => `${analysisYears}년 ${won(r.difference)}`).join(", ");
  return {
    h2: `분석 기간을 1년에서 10년으로 늘려도 어느 쪽이 싼지는 바뀌지 않는다`,
    body:
      `분석 기간 칸은 결론을 바꾸지 않습니다. 누적 차액은 연간 차액에 기간을 곱한 값이라 기본 조건에서 ${text}으로 정확히 비례합니다. ` +
      `전세보증금·월세보증금·월세·금리를 폭넓게 조합한 240가지 입력을 만들어 기간만 1년부터 10년까지 바꿔 돌려도 판정이 달라진 경우는 한 건도 없었습니다. ` +
      `기간이 결론을 바꾸려면 해마다 조건이 달라져야 하는데 이 계산기는 첫해의 비용 구조를 그대로 반복하기 때문입니다. ` +
      `즉 이 칸은 차이를 키워 보여주는 확대경이지 방향을 정하는 스위치가 아닙니다. 다만 갱신을 염두에 두고 4년을 넣으면 ${won(jw({ analysisYears: 4 }).difference)}이라는 금액 감각을 얻을 수 있고, 이사비·중개보수처럼 이 계산기 밖에 있는 비용과 견주기에는 그 편이 유용합니다.`,
  };
}

function clampBreaksTheIdentity(): Finding {
  const b = jw();
  const odd = { jeonseDeposit: 100_000_000, wolseDeposit: 200_000_000, monthlyRent: 300_000 };
  const x = jw(odd);
  const naive = x.monthlyCostGap * 12 * BASE.analysisYears;
  return {
    h2: `월세보증금이 전세보증금보다 크면 월 격차 ${won(x.monthlyCostGap)}에 24개월을 곱해도 누적 차액 ${won(x.difference)}이 나오지 않는다`,
    body:
      `이 계산기는 같은 부등식을 세 가지 얼굴로 보여줍니다. 기본 조건에서 월 격차 ${won(b.monthlyCostGap)}에 12개월과 ${BASE.analysisYears}년을 곱하면 ${won(b.monthlyCostGap * 12 * BASE.analysisYears)}으로 누적 차액과 1원까지 같습니다. ` +
      `그런데 손익분기 월세에는 음수를 0으로 잘라내는 처리가 들어 있어, 월세보증금이 전세보증금보다 큰 입력에서는 이 곱셈이 성립하지 않습니다. ` +
      `전세보증금 ${manwon(odd.jeonseDeposit)}, 월세보증금 ${manwon(odd.wolseDeposit)}, 월세 ${manwon(odd.monthlyRent)}을 넣으면 손익분기 월세가 ${won(x.breakEvenMonthlyRent)}으로 표시되고 월 격차는 ${won(x.monthlyCostGap)}이 되는데, 실제 누적 차액은 ${won(x.difference)}으로 곱셈이 예상하는 ${won(naive)}의 두 배에 가깝습니다. ` +
      `월세 쪽 보증금이 더 큰 계약은 드물지만 반전세와 전세를 나란히 놓고 숫자를 뒤바꿔 넣으면 이 구간에 들어갑니다. 그때는 월 격차 대신 누적 차액과 연간 비용 두 줄을 읽어야 합니다.`,
  };
}

function tieRateEqualsConversionRate(): Finding {
  const rate = tieRate();
  const tie = jw({ annualOpportunityRate: rate });
  const preset = OPPORTUNITY_RATE_PRESETS.map((r) => `${pct(r, 1)} ${jw({ annualOpportunityRate: r }).cheaperOption === "jeonse" ? "전세" : "월세"}`).join(", ");
  return {
    h2: `기회비용 금리 ${pct(rate, 4)}가 이 매물의 전월세 전환율이자 판정이 뒤집히는 지점이다`,
    body:
      `기본 조건에서 금리를 올려 가면 연 ${pct(rate, 4)}에서 양쪽 연간 비용이 ${won(tie.jeonseAnnualCost)}으로 정확히 같아지고 판정이 '동일'로 바뀝니다. ` +
      `이 값은 월세 ${manwon(BASE.monthlyRent)}의 열두 달치를 보증금 차액 ${manwon(BASE.jeonseDeposit - BASE.wolseDeposit)}으로 나눈 수, 곧 이 매물이 이미 품고 있는 전월세 전환율과 같습니다. ` +
      `계산기가 주는 금리 프리셋으로 돌리면 ${preset}으로 갈립니다. 다섯 중 넷이 한쪽에 몰리는 것은 프리셋이 ${pct(rate, 4)}를 건너뛰고 ${pct(0.04, 1)}에서 ${pct(0.05, 1)}로 점프하기 때문이지 전세가 대체로 유리해서가 아닙니다. ` +
      `내 금리가 매물의 전환율보다 낮으면 전세, 높으면 월세라는 한 줄이 이 비교의 뼈대이고, 화면의 나머지 금액은 그 차이를 원 단위로 옮긴 것입니다.`,
  };
}

function depositForRentSwap(): Finding {
  const equivalent = (SWAP_DEPOSIT * BASE.annualOpportunityRate) / 12;
  const cut = swapPayoffCut(SWAP_DEPOSIT);
  const worse = jw({ wolseDeposit: BASE.wolseDeposit + SWAP_DEPOSIT, monthlyRent: BASE.monthlyRent - (cut - 1) });
  const better = jw({ wolseDeposit: BASE.wolseDeposit + SWAP_DEPOSIT, monthlyRent: BASE.monthlyRent - cut });
  const same = jw({ wolseDeposit: BASE.wolseDeposit + SWAP_DEPOSIT });
  return {
    h2: `월세보증금을 ${manwon(SWAP_DEPOSIT)} 올릴 때 월세를 ${won(cut)} 넘게 깎지 못하면 손해다`,
    body:
      `반전세 협상에서 보증금을 더 걸고 월세를 낮추는 맞바꿈은 금리로 환산됩니다. 기본 조건의 연 ${pct(BASE.annualOpportunityRate, 1)}에서 ${manwon(SWAP_DEPOSIT)}의 연간 기회비용은 ${won(SWAP_DEPOSIT * BASE.annualOpportunityRate)}, 달로 나누면 ${won(equivalent)}입니다. ` +
      `월세를 그대로 두고 보증금만 ${manwon(BASE.wolseDeposit + SWAP_DEPOSIT)}으로 올리면 누적 차액이 ${won(jw().difference)}에서 ${won(same.difference)}으로 벌어져 월세 쪽이 더 불리해집니다. ` +
      `월세를 ${won(cut - 1)} 깎아도 차액은 ${won(worse.difference)}으로 기준선보다 나쁘고, ${won(cut)}을 깎아야 ${won(better.difference)}으로 겨우 이득 쪽으로 넘어갑니다. ` +
      `임대인이 보증금 ${manwon(SWAP_DEPOSIT)}에 월세 ${manwon(140_000)} 인하를 제시한다면 이 계산에서는 ${won(cut - 140_000)}만큼 모자란 조건입니다. 보증금을 더 거는 쪽이 유리해 보이는 것은 월세라는 눈에 보이는 지출이 줄기 때문이지 총비용이 줄어서가 아닙니다.`,
  };
}

function offerRanking(): Finding {
  const at = (rate: number, offer: { wolseDeposit: number; monthlyRent: number }) =>
    jw({ ...offer, annualOpportunityRate: rate }).wolseAnnualCost;
  const low = 0.02;
  const high = 0.035;
  return {
    h2: `보증금 큰 월세와 보증금 작은 월세의 순위는 금리 ${pct(OFFER_TIE_RATE, 1)}에서 갈린다`,
    body:
      `월세 매물 두 개를 같은 계산기에 각각 넣으면 순위가 금리에 따라 뒤집힙니다. A안은 보증금 ${manwon(OFFER_A.wolseDeposit)}에 월세 ${manwon(OFFER_A.monthlyRent)}, B안은 보증금 ${manwon(OFFER_B.wolseDeposit)}에 월세 ${manwon(OFFER_B.monthlyRent)}입니다. ` +
      `금리 ${pct(low, 0)}에서는 A안의 연간 비용이 ${won(at(low, OFFER_A))}, B안이 ${won(at(low, OFFER_B))}으로 B안이 쌉니다. 금리 ${pct(high, 1)}에서는 A안 ${won(at(high, OFFER_A))}, B안 ${won(at(high, OFFER_B))}으로 순서가 반대가 됩니다. ` +
      `두 값이 ${won(at(OFFER_TIE_RATE, OFFER_A))}으로 정확히 같아지는 지점은 연 ${pct(OFFER_TIE_RATE, 1)}이고, 이는 월세 차이 ${manwon(OFFER_A.monthlyRent - OFFER_B.monthlyRent)}의 열두 달치를 보증금 차이 ${manwon(OFFER_B.wolseDeposit - OFFER_A.wolseDeposit)}으로 나눈 값입니다. ` +
      `보증금이 큰 매물은 저금리에서만 유리하고, 금리가 오르면 묶인 목돈이 그대로 비용이 됩니다. 두 매물을 비교할 때 필요한 것은 각 매물의 절대 금액이 아니라 두 매물 사이의 기울기입니다.`,
  };
}

function lowRateCeiling(): Finding {
  const rates = [BASE.annualOpportunityRate, 0.01, 0.005];
  const text = rates.map((r) => `${pct(r, 1)} ${won(jw({ annualOpportunityRate: r }).breakEvenJeonseDeposit)}`).join(", ");
  const bigRent = 2_100_000;
  const outOfRange = jw({ annualOpportunityRate: 0.005, monthlyRent: bigRent }).breakEvenJeonseDeposit;
  return {
    h2: `금리 ${pct(0.005, 1)}에서는 월세가 이기는 전세보증금이 ${manwon(3_170_000_000)}부터다`,
    body:
      `금리가 낮을수록 전세가 유리해지는데, 그 정도는 손익분기 전세보증금으로 잴 수 있습니다. 기본 월세 ${manwon(BASE.monthlyRent)} 조건에서 이 값은 금리별로 ${text}입니다. ` +
      `금리를 ${pct(0.035, 1)}에서 ${pct(0.005, 1)}로 7분의 1로 낮추면 손익분기 보증금은 ${times(3_170_000_000, jw().breakEvenJeonseDeposit, 1)}로 커집니다. ` +
      `월세가 ${manwon(bigRent)}이면 같은 금리에서 손익분기 보증금이 ${won(outOfRange)}이 되는데, 이 계산기의 전세보증금 입력 상한은 ${won(DEPOSIT_INPUT_CEILING)}입니다. 상한보다 높은 손익분기점은 입력할 수 없으므로 그 조건에서는 어떤 값을 넣어도 전세가 이깁니다. ` +
      `저금리 구간에서 나오는 '전세 유리'라는 결론은 비교를 통과한 결과라기보다, 입력 가능한 범위 안에 뒤집을 지점이 없다는 뜻에 가깝습니다.`,
  };
}

function negotiationExchangeRate(): Finding {
  const unit = 10_000_000;
  const monthly = (unit * BASE.annualOpportunityRate) / 12;
  const rentCut = 100_000;
  const depositEquivalent = (rentCut * 12) / BASE.annualOpportunityRate;
  const lowerDeposit = jw({ jeonseDeposit: BASE.jeonseDeposit - unit });
  const lowerRent = jw({ monthlyRent: BASE.monthlyRent - 10_000 });
  return {
    h2: `전세보증금 ${manwon(unit)}과 월세 ${won(monthly)}은 이 계산기에서 같은 값이다`,
    body:
      `협상 카드가 두 장일 때 어느 쪽이 큰지는 환산해 보면 정해집니다. 금리 연 ${pct(BASE.annualOpportunityRate, 1)}에서 전세보증금 ${manwon(unit)}의 연간 기회비용은 ${won(unit * BASE.annualOpportunityRate)}, 달로는 ${won(monthly)}입니다. ` +
      `방향을 바꿔 월세 ${manwon(rentCut)} 인하는 연 ${won(rentCut * 12)}이고 같은 금리에서 전세보증금 ${won(depositEquivalent)}에 해당합니다. ` +
      `실제로 기본 조건에서 전세보증금만 ${manwon(BASE.jeonseDeposit - unit)}으로 낮추면 누적 차액이 ${won(jw().difference)}에서 ${won(lowerDeposit.difference)}으로 움직이고, 월세만 ${manwon(BASE.monthlyRent - 10_000)}으로 낮추면 ${won(lowerRent.difference)}이 됩니다. ` +
      `임대인이 전세보증금 ${manwon(unit)} 인하와 월세 ${won(monthly)} 인하 중 하나만 준다면 이 계산에서 두 카드의 가치는 정확히 같습니다. 다만 금리가 ${pct(0.05, 1)}로 오르면 같은 ${manwon(unit)}이 월 ${won((unit * 0.05) / 12)}으로 커지므로, 어느 카드가 큰지는 매물이 아니라 내 금리가 정합니다.`,
  };
}

export const JEONSE_VS_WOLSE_DIGEST: Finding[] = [
  baseline(),
  oneWonFlip(),
  periodIsAMultiplier(),
  clampBreaksTheIdentity(),
  tieRateEqualsConversionRate(),
  depositForRentSwap(),
  offerRanking(),
  lowRateCeiling(),
  negotiationExchangeRate(),
];

export const JEONSE_VS_WOLSE_BASIS: Finding = {
  h2: "위 발견의 계산 기준",
  body:
    `이 문단들의 금액과 금리는 화면 위 계산기를 그대로 실행해 뽑은 값이고, 값을 밝히지 않은 칸은 처음 채워져 있는 상태 그대로입니다. 비교식 기준일은 ${JEONSE_WOLSE_DATA_UPDATED}입니다. ` +
    `기회비용 금리는 어디선가 수집해 온 통계가 아니라 사용자가 직접 고르는 가정값입니다. 등장한 보증금과 월세도 특정 지역의 실거래를 조사한 결과가 아니라 경계를 드러내려고 고른 조합이므로, 어떤 조건이 흔한지에 대해서는 아무것도 말하지 않습니다. ` +
    `빠져 있는 항목도 적어 둡니다. 관리비 차이, 전세자금대출의 보증료와 중도상환수수료, 이사비, 월세 세액공제와 전세대출 소득공제가 모두 계산 밖에 있습니다. 보증금을 돌려받지 못할 위험 역시 비용으로 잡히지 않으므로, 전세 쪽으로 기울었다면 깡통전세 위험 진단에서 부채비율을 따로 확인해야 합니다.`,
};
