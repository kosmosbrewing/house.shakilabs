// /jeonse-risk digest. The auction rate is an assumption, not an observation, so
// the engine now reports a band. Running the band against the risk grades shows
// that the grade thresholds ARE auction-rate assumptions in disguise, that the
// HUG ceiling sits exactly on the worst grade, and that the region switch does
// nothing across a wide market-price range.

import {
  AUCTION_RATE_SCENARIOS,
  HUG_COLLATERAL_RATIO,
  HUG_LIMIT_METRO,
  HUG_LIMIT_OTHER,
  JEONSE_RISK_DATA_UPDATED,
  RISK_CAUTION_RATIO,
  RISK_DANGER_RATIO,
  RISK_SEVERE_RATIO,
} from "../jeonseRisk";
import { calculateJeonseRisk, type JeonseRiskInput } from "@/utils/jeonseRiskCalculator";
import { type Finding, manwon, num, pct, pp, times, won } from "./format";

// Independent literal by design — not a reference to the screen default object.
// 같은 객체를 양쪽에 쓰면 "기준 입력이 화면 기본값과 같다"는 대조가 자기 자신을 비교하게 되어
// 화면 기본값이 바뀌어도 red가 나지 않는다. digests.test.ts가 DEFAULT_JEONSE_RISK_INPUT과 맞댄다.
export const BASE: JeonseRiskInput = {
  marketPrice: 500_000_000,
  jeonseDeposit: 350_000_000,
  seniorDebt: 0,
  isMetropolitan: true,
};

export const rk = (patch: Partial<JeonseRiskInput> = {}) =>
  calculateJeonseRisk({ ...BASE, ...patch });

export const LOW_RATE = AUCTION_RATE_SCENARIOS[0];
export const MID_RATE = AUCTION_RATE_SCENARIOS[1];
export const HIGH_RATE = AUCTION_RATE_SCENARIOS[2];

/** Shortfall under one assumed auction rate, read off the engine's own rows. */
export function shortfallAt(rate: number, patch: Partial<JeonseRiskInput> = {}): number {
  return rk(patch).auctionScenarios.find((scenario) => scenario.rate === rate)!.shortfall;
}

/** Deposit band where the three assumptions disagree: (low break-even, high break-even]. */
export function disagreementBand(patch: Partial<JeonseRiskInput> = {}): { low: number; high: number } {
  const input = { ...BASE, ...patch };
  return {
    low: Math.round(input.marketPrice * LOW_RATE) - input.seniorDebt,
    high: Math.round(input.marketPrice * HIGH_RATE) - input.seniorDebt,
  };
}

/** Smallest market price at which the metropolitan and non-metropolitan caps differ. */
export function regionSplitPrice(): number {
  const start = Math.floor(HUG_LIMIT_OTHER / HUG_COLLATERAL_RATIO) - 20;
  for (let price = start; price <= start + 400; price += 1) {
    if (rk({ marketPrice: price }).hugMaxDeposit !== rk({ marketPrice: price, isMetropolitan: false }).hugMaxDeposit) {
      return price;
    }
  }
  return 0;
}

export const MARKET_PRICE_ERROR = 0.1;
export const HUG_BAND_SAMPLE = 420_000_000;
/** Deposit that puts the debt ratio exactly on the "danger" threshold. */
export const DANGER_DEPOSIT = Math.round(BASE.marketPrice * RISK_DANGER_RATIO);
/** Smallest market price at which the metropolitan limit, not the 90% collateral rule, sets the cap. */
export const METRO_CAP_BIND_PRICE = Math.ceil(HUG_LIMIT_METRO / HUG_COLLATERAL_RATIO);

// "80% 가정에서 부족분이 있으면 등급은 반드시 위험 이상"이라는 단언은 스캔으로만 확인할 수 있다.
// 숫자를 산문에 손으로 적으면 엔진이 바뀌어도 문장이 그대로 남으므로 여기서 세어 쓴다.
export function impliesDangerScan(): { checked: number; counterexamples: number; converse: number } {
  let checked = 0;
  let counterexamples = 0;
  let converse = 0;
  for (const marketPrice of [300_000_000, 500_000_000, 900_000_000]) {
    for (const seniorDebt of [0, 80_000_000, 250_000_000]) {
      const step = Math.round(marketPrice / 50);
      for (let jeonseDeposit = 0; jeonseDeposit <= marketPrice; jeonseDeposit += step) {
        const result = rk({ marketPrice, seniorDebt, jeonseDeposit });
        const short = result.auctionScenarios[2]!.shortfall > 0;
        const dangerous = result.riskLevel === "danger" || result.riskLevel === "severe";
        checked += 1;
        if (short && !dangerous) counterexamples += 1;
        if (dangerous && !short) converse += 1;
      }
    }
  }
  return { checked, counterexamples, converse };
}

function baselineBand(): Finding {
  const b = rk();
  const rows = b.auctionScenarios
    .map((scenario) => `${pct(scenario.rate, 0)} ${won(scenario.proceeds)}`)
    .join(", ");
  const oneWonMore = rk({ jeonseDeposit: BASE.jeonseDeposit + 1 });
  return {
    h2: `기본 조건은 낙찰가율 ${pct(LOW_RATE, 0)} 가정의 경계에 정확히 서 있어 보증금 1원이 부족분을 만든다`,
    body:
      `계산기 기본값(시세 ${manwon(BASE.marketPrice)}, 보증금 ${manwon(BASE.jeonseDeposit)}, 선순위 ${won(BASE.seniorDebt)})으로 진단하면 전세가율과 부채비율이 모두 ${pct(b.jeonseRatio, 1)}이고 등급은 주의입니다. ` +
      `낙찰가율은 관측된 값이 아니라 이 계산기가 선언한 가정이므로 세 가지로 나눠 계산합니다. 낙찰 대금 추정은 ${rows}이고, 세 가정 모두 회수액이 ${won(b.auctionScenarios[0]!.recovery)}으로 보증금 전액에 닿아 부족분이 없습니다. ` +
      `그런데 가장 낮은 ${pct(LOW_RATE, 0)} 줄은 여유가 정확히 0입니다. 보증금을 1원 올려 ${won(BASE.jeonseDeposit + 1)}으로 두면 그 줄에만 ${won(shortfallAt(LOW_RATE, { jeonseDeposit: BASE.jeonseDeposit + 1 }))}의 부족분이 생기고 나머지 두 줄은 그대로 ${won(oneWonMore.auctionScenarios[2]!.shortfall)}입니다. ` +
      `'부족분 없음'이라는 결과가 조건에서 얼마나 떨어져 있는지는 화면에 적히지 않으므로, 세 줄이 동시에 0인지 아니면 한 줄이 가까스로 0인지를 함께 봐야 합니다.`,
  };
}

function bandWidthIsTenPercent(): Finding {
  const here = disagreementBand();
  const withDebt = disagreementBand({ seniorDebt: 100_000_000 });
  const bigger = disagreementBand({ marketPrice: 800_000_000 });
  return {
    h2: `세 가정이 서로 다른 답을 내는 보증금 구간의 폭은 언제나 시세의 ${pct(HIGH_RATE - LOW_RATE, 0)}다`,
    body:
      `가장 보수적인 ${pct(LOW_RATE, 0)} 가정과 가장 너그러운 ${pct(HIGH_RATE, 0)} 가정은 서로 다른 보증금에서 부족분을 내기 시작합니다. 기본 시세에서 앞쪽 경계가 ${won(here.low)}, 뒤쪽 경계가 ${won(here.high)}이므로 판정이 갈리는 구간은 그 사이 ${won(here.high - here.low)}입니다. ` +
      `선순위 채권 ${manwon(100_000_000)}을 넣으면 구간이 ${won(withDebt.low)}부터 ${won(withDebt.high)}으로 통째로 내려앉지만 폭은 ${won(withDebt.high - withDebt.low)}으로 같습니다. 선순위는 두 경계에서 똑같이 빠지기 때문입니다. ` +
      `시세를 ${manwon(800_000_000)}으로 키우면 구간이 ${won(bigger.low)}부터 ${won(bigger.high)}으로 넓어지고 폭은 ${won(bigger.high - bigger.low)}이 됩니다. ` +
      `세 경우 모두 폭이 시세의 ${pct(HIGH_RATE - LOW_RATE, 0)}인데, 두 경계의 차이가 시세에 ${pp(HIGH_RATE - LOW_RATE)}를 곱한 값이기 때문입니다. 내 보증금이 이 구간 안에 있다면 진단 결과는 계약 조건이 아니라 가정 선택에 달려 있는 상태입니다.`,
  };
}

function gradesAreAssumptions(): Finding {
  const b = rk();
  const atDanger = rk({ jeonseDeposit: DANGER_DEPOSIT });
  return {
    h2: `위험 등급의 세 문턱 ${pct(RISK_CAUTION_RATIO, 0)}·${pct(RISK_DANGER_RATIO, 0)}·${pct(RISK_SEVERE_RATIO, 0)}는 같은 낙찰가율을 가정한 손익분기와 같은 식이다`,
    body:
      `부채비율 문턱과 낙찰가율 가정은 서로 다른 개념처럼 보이지만 같은 부등식입니다. 보증금이 0보다 클 때 낙찰가율 ${pct(LOW_RATE, 0)} 가정에서 부족분이 생기는 조건은 '보증금과 선순위의 합이 시세의 ${pct(LOW_RATE, 0)}를 넘는다'이고, 이는 부채비율이 ${pct(RISK_CAUTION_RATIO, 0)}를 넘는다는 주의 등급의 조건과 글자 그대로 같습니다. ` +
      `화면의 안전 보증금 제안도 같은 자리에 있습니다. 기본 조건에서 그 값은 ${won(b.safeDepositCap)}인데, 시세에 ${pct(LOW_RATE, 0)}를 곱한 ${won(Math.round(BASE.marketPrice * LOW_RATE))}과 정확히 일치합니다. ` +
      `보증금을 ${won(DANGER_DEPOSIT)}으로 올려 부채비율을 ${pct(atDanger.debtRatio, 0)}에 맞추면 등급이 위험으로 바뀌고, 같은 순간 ${pct(MID_RATE, 0)} 가정 줄에 ${won(shortfallAt(MID_RATE, { jeonseDeposit: DANGER_DEPOSIT }))}의 부족분이 나타납니다. ` +
      `등급 이름을 낙찰가율로 번역하면 '주의'는 ${pct(LOW_RATE, 0)}에 팔려도 못 받는다는 뜻이고 '매우 위험'은 ${pct(RISK_SEVERE_RATIO, 0)}에 팔려도 못 받는다는 뜻입니다.`,
  };
}

function hugCeilingIsWorstGrade(): Finding {
  const b = rk();
  const atCeiling = rk({ jeonseDeposit: b.hugMaxDeposit });
  const shortfalls = atCeiling.auctionScenarios
    .map((scenario) => `${pct(scenario.rate, 0)} ${won(scenario.shortfall)}`)
    .join(", ");
  return {
    h2: `HUG 가입 가능 보증금의 상한 ${manwon(450_000_000)}은 그대로 "매우 위험" 등급이 시작되는 지점이다`,
    body:
      `보증 가입 상한은 주택가격의 ${pct(HUG_COLLATERAL_RATIO, 0)}에서 선순위를 뺀 금액이고, 등급의 최악 구간도 부채비율 ${pct(RISK_SEVERE_RATIO, 0)}부터입니다. 두 기준의 비율이 같으므로 지역 한도가 걸리지 않는 시세에서는 가입 상한이 곧 최악 등급의 시작점이 됩니다. ` +
      `기본 조건의 가입 상한은 ${won(b.hugMaxDeposit)}인데, 보증금을 정확히 그 금액으로 넣으면 판정은 '가입 가능'이면서 등급은 '매우 위험'이 됩니다. 부채비율이 ${pct(atCeiling.debtRatio, 1)}이기 때문입니다. ` +
      `같은 조건의 낙찰가율 가정별 부족분은 ${shortfalls}으로 세 줄 모두 비어 있지 않습니다. ` +
      `보증에 가입할 수 있다는 사실이 위험이 낮다는 뜻은 아니라는 것이 이 일치의 요지입니다. 보증은 사고가 났을 때 돈을 대신 받아 주는 장치이고, 등급은 사고가 났을 때 얼마가 비는지를 재는 장치라 서로 다른 질문에 답합니다.`,
  };
}

function regionSwitchDoesNothing(): Finding {
  const split = regionSplitPrice();
  const below = rk({ marketPrice: split - 1 });
  const belowOther = rk({ marketPrice: split - 1, isMetropolitan: false });
  const at = rk({ marketPrice: split });
  const atOther = rk({ marketPrice: split, isMetropolitan: false });
  return {
    h2: `선순위가 없다면 시세 ${won(split - 1)}까지는 수도권과 그 외 지역을 바꿔도 결과가 1원도 달라지지 않는다`,
    body:
      `지역 선택은 보증 한도(수도권 ${manwon(HUG_LIMIT_METRO)}, 그 외 ${manwon(HUG_LIMIT_OTHER)})를 고르는 스위치인데, 한도는 주택가격의 ${pct(HUG_COLLATERAL_RATIO, 0)}보다 클 때만 실제로 작동합니다. ` +
      `선순위가 없는 조건에서 시세 ${won(split - 1)}이면 양쪽 모두 가입 상한이 ${won(below.hugMaxDeposit)}으로 같고, 1원 올린 ${won(split)}에서 비로소 ${won(at.hugMaxDeposit)}과 ${won(atOther.hugMaxDeposit)}으로 갈라집니다. ` +
      `가입 상한이 갈리기 시작하는 이 지점 아래에서는 두 선택지의 전세가율·부채비율·등급·회수 추정이 모두 같은 값을 냅니다. ${won(belowOther.hugMaxDeposit)}이라는 같은 숫자가 두 번 나오는 셈입니다. ` +
      `수도권 한도가 실제로 상한을 정하기 시작하는 시세는 ${won(METRO_CAP_BIND_PRICE)}부터입니다. 그 아래 구간에서 지역 칸을 두고 고민하는 것은 결과에 영향을 주지 않으며, 선순위 채권이 있으면 두 경계 모두 그만큼 위로 밀립니다.`,
  };
}

function ratioBlindToSeniorDebt(): Finding {
  const debt = 100_000_000;
  const withDebt = rk({ seniorDebt: debt });
  const rows = withDebt.auctionScenarios
    .map((scenario) => `${pct(scenario.rate, 0)} ${won(scenario.shortfall)}`)
    .join(", ");
  return {
    h2: `전세가율은 선순위를 보지 못해 ${pct(rk().jeonseRatio, 1)} 그대로인데 부채비율만 ${pct(withDebt.debtRatio, 1)}로 뛴다`,
    body:
      `전세가율은 보증금을 시세로 나눈 값이라 등기부에 무엇이 잡혀 있든 반응하지 않습니다. 기본 조건에 선순위 채권 ${manwon(debt)}만 얹으면 전세가율은 ${pct(withDebt.jeonseRatio, 1)}로 그대로인데 부채비율은 ${pct(withDebt.debtRatio, 1)}가 되고 등급은 주의에서 매우 위험으로 두 칸 내려갑니다. ` +
      `회수 추정에서도 선순위는 낙찰 대금에서 먼저 빠집니다. 낙찰가율 가정별 부족분이 ${rows}으로, 선순위가 없을 때의 0원과 달리 세 줄 모두 금액이 찍힙니다. ` +
      `보증 가입 상한도 ${won(rk().hugMaxDeposit)}에서 ${won(withDebt.hugMaxDeposit)}으로 선순위만큼 정확히 줄어, 지금 보증금 ${manwon(BASE.jeonseDeposit)}이 상한과 같아지는 자리에 겨우 걸칩니다. ` +
      `선순위 1원은 부채비율과 가입 상한에서 보증금 1원과 정확히 같은 크기로 작동합니다. 다만 부족분에서는 낙찰 대금이 보증금을 넘던 여유가 먼저 상쇄되므로, 여유가 없던 ${pct(LOW_RATE, 0)} 줄에서만 선순위 ${manwon(debt)}이 그대로 ${won(withDebt.auctionScenarios[0]!.shortfall)}으로 나타나고 나머지 두 줄은 그보다 적게 반응합니다. 세 지표 가운데 선순위를 아예 보지 못하는 것은 전세가율 하나뿐이고, 전세가율만 보고 안심하는 계약이 위험해지는 경로가 여기입니다.`,
  };
}

function assumptionBeatsPriceError(): Finding {
  const b = rk();
  const lowerPrice = Math.round(BASE.marketPrice * (1 - MARKET_PRICE_ERROR));
  const lower = rk({ marketPrice: lowerPrice });
  const priceEffect = b.auctionProceeds - lower.auctionProceeds;
  const rateEffect = b.auctionScenarios[2]!.proceeds - b.auctionScenarios[0]!.proceeds;
  return {
    h2: `시세를 ${pct(MARKET_PRICE_ERROR, 0)} 낮춰 잡는 것보다 낙찰가율 가정을 ${pp(HIGH_RATE - LOW_RATE)} 낮추는 쪽이 크게 움직인다`,
    body:
      `시세도 낙찰가율도 정확히 알 수 없는 값이라 어느 쪽 불확실성이 큰지 비교해 둘 필요가 있습니다. 기본 조건의 대표 낙찰 대금은 ${won(b.auctionProceeds)}입니다. ` +
      `시세를 ${pct(MARKET_PRICE_ERROR, 0)} 낮춰 ${manwon(lowerPrice)}으로 잡으면 낙찰 대금 추정이 ${won(lower.auctionProceeds)}으로 ${won(priceEffect)} 줄고, 부채비율은 ${pct(b.debtRatio, 1)}에서 ${pct(lower.debtRatio, 1)}로 올라갑니다. ` +
      `반면 같은 시세에서 낙찰가율 가정만 ${pct(HIGH_RATE, 0)}에서 ${pct(LOW_RATE, 0)}으로 옮기면 낙찰 대금이 ${won(b.auctionScenarios[2]!.proceeds)}에서 ${won(b.auctionScenarios[0]!.proceeds)}으로 ${won(rateEffect)} 움직입니다. ` +
      `가정 폭이 만드는 흔들림이 시세 오차 ${pct(MARKET_PRICE_ERROR, 0)}가 만드는 흔들림보다 ${times(rateEffect, priceEffect, 2)} 큽니다. 빌라 시세를 보수적으로 잡는 것도 중요하지만, 그것만으로 낙찰가율 가정이 만드는 폭까지 덮이지는 않습니다.`,
  };
}

function eligibleButShort(): Finding {
  const b = rk();
  const band = disagreementBand();
  const sample = rk({ jeonseDeposit: HUG_BAND_SAMPLE });
  const rows = sample.auctionScenarios
    .map((scenario) => `${pct(scenario.rate, 0)} ${won(scenario.shortfall)}`)
    .join(", ");
  return {
    h2: `보증 가입이 가능한 보증금의 마지막 ${won(b.hugMaxDeposit - band.high)} 구간은 세 가정 모두에서 부족분이 남는다`,
    body:
      `가입 가능 여부와 회수 추정은 서로 다른 비율을 쓰기 때문에 둘 사이에 겹치지 않는 띠가 생깁니다. 기본 조건에서 가입 상한은 ${won(b.hugMaxDeposit)}이고 가장 너그러운 ${pct(HIGH_RATE, 0)} 가정의 손익분기는 ${won(band.high)}입니다. ` +
      `그 사이 ${won(b.hugMaxDeposit - band.high)}은 '가입 가능'과 '세 가정 모두 부족'이 동시에 성립하는 구간입니다. ` +
      `구간 한가운데인 보증금 ${manwon(HUG_BAND_SAMPLE)}으로 진단하면 가입 판정은 가능, 등급은 위험이고 낙찰가율 가정별 부족분은 ${rows}입니다. ` +
      `보증에 가입할 수 있으니 괜찮다고 읽으면 이 띠를 통째로 놓칩니다. 이 구간의 계약은 보증이 실제로 발동되어야만 원금을 지킬 수 있는 상태이고, 보증료와 심사 결과가 계약의 전제 조건이 됩니다.`,
  };
}

function oneWayImplication(): Finding {
  const atDanger = rk({ jeonseDeposit: DANGER_DEPOSIT });
  const justOver = rk({ jeonseDeposit: DANGER_DEPOSIT + 1 });
  const scan = impliesDangerScan();
  return {
    h2: `${pct(HIGH_RATE, 0)} 가정에서 부족분이 나오면 등급은 반드시 위험 이상이지만 그 역은 성립하지 않는다`,
    body:
      `두 지표의 관계는 한 방향으로만 성립합니다. 시세·선순위·보증금을 폭넓게 조합한 ${num(scan.checked)}가지 입력을 돌려 보면, 가장 너그러운 ${pct(HIGH_RATE, 0)} 가정에서 부족분이 있는데 등급이 주의 이하인 경우는 ${num(scan.counterexamples)}건입니다. ` +
      `반대 방향에는 예외가 ${num(scan.converse)}건 있습니다. 보증금 ${manwon(DANGER_DEPOSIT)}이면 부채비율 ${pct(atDanger.debtRatio, 1)}로 등급이 위험인데도 ${pct(HIGH_RATE, 0)} 줄의 부족분은 ${won(atDanger.auctionScenarios[2]!.shortfall)}이고, 1원을 더한 ${won(DANGER_DEPOSIT + 1)}에서야 ${won(justOver.auctionScenarios[2]!.shortfall)}이 나타납니다. ` +
      `같은 보증금에서 ${pct(LOW_RATE, 0)} 줄은 이미 ${won(atDanger.auctionScenarios[0]!.shortfall)}, ${pct(MID_RATE, 0)} 줄은 ${won(atDanger.auctionScenarios[1]!.shortfall)}을 가리킵니다. ` +
      `그래서 등급이 위험이라고 해서 모든 가정에서 손실이 확정되는 것은 아니고, 반대로 가장 너그러운 가정에서까지 부족분이 보인다면 등급을 따로 확인할 필요도 없습니다. 두 지표 중 먼저 붉어지는 쪽은 언제나 등급입니다.`,
  };
}

export const JEONSE_RISK_DIGEST: Finding[] = [
  baselineBand(),
  bandWidthIsTenPercent(),
  gradesAreAssumptions(),
  hugCeilingIsWorstGrade(),
  regionSwitchDoesNothing(),
  ratioBlindToSeniorDebt(),
  assumptionBeatsPriceError(),
  eligibleButShort(),
  oneWayImplication(),
];

export const JEONSE_RISK_BASIS: Finding = {
  h2: "위 발견의 계산 기준",
  body:
    `위 수치는 모두 이 페이지의 깡통전세 위험 진단에 값을 넣어 실행한 결과이고, 적지 않은 항목은 화면 기본값을 씁니다. 보증 심사 기준 확인일은 ${JEONSE_RISK_DATA_UPDATED}입니다. ` +
    `낙찰가율 ${AUCTION_RATE_SCENARIOS.map((rate) => pct(rate, 0)).join("·")} 세 값은 관측한 낙찰 통계가 아니라 이 계산기가 선언한 가정값입니다. 특정 지역·시점의 실제 낙찰가율을 수집한 적이 없으므로 위 회수 추정은 '이 가정이 맞다면'이라는 조건 아래에서만 성립합니다. 시세 역시 사용자가 입력한 값이고 감정가와 다를 수 있습니다. ` +
    `이 진단은 소액임차인 최우선변제, 당해세 같은 배당 순위 세부, 다가구의 선순위 임차인 보증금, 경매 비용을 반영하지 않습니다. 실제 배당은 이보다 불리해질 수 있으므로, 계약 전에는 등기부등본 을구와 전입세대 열람으로 선순위를 직접 확인해야 합니다.`,
};
