// /jeonse-wolse-rate digest. The verdict runs on a +/-0.1%p tolerance band while
// the "fair rent" line runs on the exact cap, so the two disagree inside a
// window the engine never names. Running the deposit simulation across its own
// filter also shows rows appearing and vanishing on an exact deposit boundary.

import {
  BOK_BASE_RATE,
  DEPOSIT_ADJUST_STEPS,
  JEONSE_WOLSE_RATE_UPDATED,
  LEGAL_CONVERSION_RATE_CAP,
  LEGAL_RATE_SPREAD,
} from "../jeonseWolseRate";
import { calculateJeonseVsWolse, calculateJeonseWolseRate, type JeonseWolseRateInput } from "@/utils/housingCalculator";
import { type Finding, manwon, num, pct, pp, times, won } from "./format";

// Independent literal, deliberately not a reference to the screen default.
// 같은 객체를 참조해 비교하면 그 대조는 언제나 통과한다. digests.test.ts가
// DEFAULT_JEONSE_WOLSE_RATE_INPUT과 이 리터럴을 맞대 보게 하려면 값을 따로 적어야 한다.
export const BASE: JeonseWolseRateInput = {
  jeonseDeposit: 300_000_000,
  wolseDeposit: 50_000_000,
  monthlyRent: 1_200_000,
  legalRateCap: 0.045,
};

export const jr = (patch: Partial<JeonseWolseRateInput> = {}) =>
  calculateJeonseWolseRate({ ...BASE, ...patch });

/** The engine treats anything within this many points of the cap as "appropriate". */
export const JUDGMENT_TOLERANCE = 0.001;

/** Highest whole-won rent that still earns the "appropriate" label. */
export function bandTop(input: JeonseWolseRateInput = BASE): number {
  const ceiling = Math.ceil(((input.legalRateCap + JUDGMENT_TOLERANCE) * (input.jeonseDeposit - input.wolseDeposit)) / 12);
  for (let rent = ceiling; rent > 0; rent -= 1) {
    if (jr({ ...input, monthlyRent: rent }).judgment !== "excessive") return rent;
  }
  return 0;
}

/** Lowest whole-won rent that still earns the "appropriate" label. */
export function bandBottom(input: JeonseWolseRateInput = BASE): number {
  const floor = Math.floor(((input.legalRateCap - JUDGMENT_TOLERANCE) * (input.jeonseDeposit - input.wolseDeposit)) / 12);
  for (let rent = floor; rent < floor + 100; rent += 1) {
    if (jr({ ...input, monthlyRent: rent }).judgment !== "below") return rent;
  }
  return 0;
}

export const SMALL_GAP = 50_000_000;
export const LARGE_GAP = 500_000_000;
export const BASE_RATE_CUT = 0.0025;

function baseline(): Finding {
  const b = jr();
  return {
    h2: `기본 조건의 전환율 ${pct(b.actualConversionRate)}는 상한을 ${pp(b.actualConversionRate - b.legalRateCap)} 넘고 그 차이가 연 ${won(b.annualExcessBurden)}이다`,
    body:
      `계산기 기본값(전세보증금 ${manwon(BASE.jeonseDeposit)}, 월세보증금 ${manwon(BASE.wolseDeposit)}, 월세 ${manwon(BASE.monthlyRent)})으로 돌리면 보증금 차액 ${won(b.depositDifference)}에 대한 실제 전환율이 ${pct(b.actualConversionRate)}로 나옵니다. ` +
      `법정 상한 ${pct(b.legalRateCap, 1)}과의 간격은 ${pp(b.actualConversionRate - b.legalRateCap)}인데, 이 비율 차이를 금액으로 옮기면 월 ${won(b.monthlyRentGap)}, 연 ${won(b.annualExcessBurden)}입니다. ` +
      `상한 기준 적정 월세는 ${won(b.fairMonthlyRent)}이므로 지금 월세는 그보다 ${times(BASE.monthlyRent, b.fairMonthlyRent, 2)} 수준입니다. ` +
      `비율로 보면 ${pp(b.actualConversionRate - b.legalRateCap)}라는 작은 숫자지만 2년 계약 기간으로 환산하면 ${won(b.annualExcessBurden * 2)}이 됩니다. 협상 자리에서 상대를 움직이는 것은 앞의 비율이 아니라 뒤의 금액입니다.`,
  };
}

function toleranceWindow(): Finding {
  const b = jr();
  const top = bandTop();
  const bottom = bandBottom();
  const atTop = jr({ monthlyRent: top });
  const justOver = jr({ monthlyRent: top + 1 });
  return {
    h2: `"적정" 판정이 붙는 월세 구간은 ${won(bottom)}부터 ${won(top)}까지 ${won(top - bottom)} 폭이다`,
    body:
      `판정은 전환율이 상한에서 ${pp(JUDGMENT_TOLERANCE)} 안쪽이면 적정으로 봅니다. 기본 조건에서 이 관용 구간을 월세로 되돌리면 ${won(bottom)}에서 ${won(top)}까지, 폭 ${won(top - bottom)}입니다. ` +
      `${won(top)}은 적정으로 표시되지만 같은 화면의 적정 월세는 ${won(b.fairMonthlyRent)}이고 초과액 칸에는 월 ${won(atTop.monthlyRentGap)}, 연 ${won(atTop.annualExcessBurden)}이 함께 찍힙니다. ` +
      `1원만 더 올린 ${won(top + 1)}에서는 라벨이 초과로 바뀌지만 금액은 겨우 ${won(justOver.annualExcessBurden - atTop.annualExcessBurden)} 늘어납니다. ` +
      `라벨이 바뀌는 지점과 초과액이 0이 되는 지점이 ${won(top - b.fairMonthlyRent)} 어긋나 있다는 뜻입니다. 감액을 요구할 때는 라벨이 아니라 적정 월세 ${won(b.fairMonthlyRent)}을 기준선으로 잡아야 근거가 흔들리지 않습니다.`,
  };
}

function windowScalesWithGap(): Finding {
  const half = (gap: number) => (JUDGMENT_TOLERANCE * gap) / 12;
  const smallInput = { ...BASE, jeonseDeposit: BASE.wolseDeposit + SMALL_GAP, monthlyRent: 240_000 };
  const smallTop = bandTop(smallInput);
  const smallBottom = bandBottom(smallInput);
  return {
    h2: `같은 ${pp(JUDGMENT_TOLERANCE)} 관용이 보증금 차액 ${manwon(SMALL_GAP)}에서는 ${won(half(SMALL_GAP))}, ${manwon(LARGE_GAP)}에서는 ${won(half(LARGE_GAP))}을 봐준다`,
    body:
      `관용 폭은 비율로 고정돼 있어서 금액으로 바꾸면 계약 규모에 그대로 비례합니다. ${pp(JUDGMENT_TOLERANCE)}를 월 금액으로 환산하면 보증금 차액 ${manwon(SMALL_GAP)}에서 ${won(half(SMALL_GAP))}, ${manwon(BASE.jeonseDeposit - BASE.wolseDeposit)}에서 ${won(half(BASE.jeonseDeposit - BASE.wolseDeposit))}, ${manwon(LARGE_GAP)}에서 ${won(half(LARGE_GAP))}입니다. ` +
      `차액 ${manwon(SMALL_GAP)}짜리 계약의 적정 판정 구간은 ${won(smallBottom)}에서 ${won(smallTop)}까지 폭 ${won(smallTop - smallBottom)}에 불과해, 월세를 만원 단위로 조정하면 그 한 번에 라벨이 두 칸을 건너뜁니다. ` +
      `반대로 차액 ${manwon(LARGE_GAP)}짜리 계약에서는 폭이 ${won(half(LARGE_GAP) * 2)}이라 월세를 ${manwon(80_000)} 가까이 움직여도 라벨이 그대로입니다. ` +
      `작은 계약일수록 라벨이 예민하고 큰 계약일수록 둔감한 셈이니, 계약 규모가 클수록 라벨보다 금액 칸을 먼저 봐야 합니다.`,
  };
}

function oneSlopeFourTimes(): Finding {
  const b = jr();
  const rows = b.simulations.map((s) => `${manwon(s.adjustAmount)} ${won(b.fairMonthlyRent - s.newFairMonthlyRent)}`).join(", ");
  const perUnit = (10_000_000 * BASE.legalRateCap) / 12;
  const perUnitActual = (10_000_000 * b.actualConversionRate) / 12;
  return {
    h2: `보증금 조정 네 줄은 ${manwon(10_000_000)}당 ${won(perUnit)}이라는 한 기울기를 네 번 적은 것이다`,
    body:
      `시뮬레이션 표는 보증금을 ${DEPOSIT_ADJUST_STEPS.map((s) => manwon(s)).join("·")} 올렸을 때의 적정 월세를 보여주는데, 내려간 폭을 보면 ${rows}으로 정확히 비례합니다. ` +
      `네 줄 모두 상한 ${pct(BASE.legalRateCap, 1)}를 12로 나눈 하나의 기울기, 곧 ${manwon(10_000_000)}당 ${won(perUnit)}에서 나옵니다. ` +
      `주의할 점은 이 기울기가 법정 상한만 반영한다는 것입니다. 지금 계약의 실제 전환율 ${pct(b.actualConversionRate)}로 환산하면 같은 ${manwon(10_000_000)}이 월 ${won(perUnitActual)}이어서 ${won(perUnitActual - perUnit)} 차이가 납니다. ` +
      `임대인이 현재 조건의 비율로 맞바꿈을 제안하면 표보다 유리해 보이지만, 그 비율 자체가 상한을 넘고 있다는 사실은 표에 나타나지 않습니다. 표는 '이렇게 될 것'이 아니라 '상한대로라면 이래야 한다'는 선입니다.`,
  };
}

function depositOnlyMakesItWorse(): Finding {
  const b = jr();
  const raised = jr({ wolseDeposit: BASE.wolseDeposit + 50_000_000 });
  return {
    h2: `월세를 그대로 두고 보증금만 ${manwon(50_000_000)} 올리면 전환율은 ${pct(b.actualConversionRate)}에서 ${pct(raised.actualConversionRate)}로 나빠진다`,
    body:
      `시뮬레이션 표를 '보증금을 올리면 조건이 좋아진다'로 읽으면 방향이 반대가 됩니다. 전환율의 분모는 보증금 차액이라, 월세보증금을 올리면 분모가 줄어 비율이 커집니다. ` +
      `기본 조건에서 월세보증금만 ${manwon(BASE.wolseDeposit + 50_000_000)}으로 올리면 차액이 ${won(raised.depositDifference)}으로 줄고 전환율은 ${pct(raised.actualConversionRate)}가 됩니다. ` +
      `적정 월세는 ${won(b.fairMonthlyRent)}에서 ${won(raised.fairMonthlyRent)}으로 내려가는데 월세는 그대로이므로 초과액은 월 ${won(b.monthlyRentGap)}에서 ${won(raised.monthlyRentGap)}, 연간으로는 ${won(b.annualExcessBurden)}에서 ${won(raised.annualExcessBurden)}으로 ${times(raised.annualExcessBurden, b.annualExcessBurden, 2)} 커집니다. ` +
      `표의 각 줄은 '보증금을 올리는 동시에 월세를 그 줄의 금액까지 내린다'는 한 쌍의 조건입니다. 보증금만 먼저 넣고 월세 인하는 다음에 논의하기로 하면 그 사이 기간은 조건이 더 나빠진 상태로 지나갑니다.`,
  };
}

function vanishingRow(): Finding {
  const biggest = DEPOSIT_ADJUST_STEPS[DEPOSIT_ADJUST_STEPS.length - 1]!;
  const exact = jr({ jeonseDeposit: 300_000_000, wolseDeposit: 200_000_000 });
  const oneMore = jr({ jeonseDeposit: 300_000_001, wolseDeposit: 200_000_000 });
  const lastRow = oneMore.simulations[oneMore.simulations.length - 1]!;
  return {
    h2: `보증금 차액이 정확히 ${manwon(biggest)}이면 조정표 마지막 줄이 사라지고 1원만 더 크면 적정 월세 0원짜리 줄이 생긴다`,
    body:
      `시뮬레이션은 조정 후 월세보증금이 전세보증금보다 작을 때만 줄을 만듭니다. 이 조건이 등호를 포함하지 않아 경계에서 줄 수가 계단처럼 변합니다. ` +
      `전세보증금 ${manwon(300_000_000)}, 월세보증금 ${manwon(200_000_000)}이면 차액이 ${won(100_000_000)}이라 ${manwon(biggest)} 줄이 빠지고 표가 ${exact.simulations.length}줄로 줄어듭니다. ` +
      `전세보증금을 1원 올려 ${won(300_000_001)}으로 두면 줄이 ${oneMore.simulations.length}개로 돌아오는데, 새로 생긴 줄의 조정 후 차액은 1원이어서 적정 월세가 ${won(lastRow.newFairMonthlyRent)}으로 표시됩니다. ` +
      `반올림 때문에 1원의 ${pct(BASE.legalRateCap, 1)}를 12로 나눈 값이 0으로 접히기 때문입니다. 차액이 조정 단위에 가까운 계약에서는 표의 줄 수 자체가 정보이며, 마지막 줄이 0원이면 그 줄은 협상안이 아니라 경계 표시로 읽어야 합니다.`,
  };
}

function labelIgnoresSize(): Finding {
  const small = jr({ jeonseDeposit: BASE.wolseDeposit + SMALL_GAP, monthlyRent: 240_000 });
  const large = jr({ jeonseDeposit: BASE.wolseDeposit + LARGE_GAP, monthlyRent: 2_400_000 });
  const b = jr();
  return {
    h2: `보증금 차액 ${manwon(SMALL_GAP)}과 ${manwon(LARGE_GAP)}이 같은 판정을 받고 부담은 ${won(small.annualExcessBurden)}과 ${won(large.annualExcessBurden)}으로 갈린다`,
    body:
      `판정은 전환율만 보고 계약의 크기는 보지 않습니다. 보증금 차액 ${manwon(SMALL_GAP)}에 월세 ${manwon(240_000)}, 그리고 차액 ${manwon(LARGE_GAP)}에 월세 ${manwon(2_400_000)}은 둘 다 전환율이 ${pct(small.actualConversionRate)}로 같아 나란히 초과로 표시됩니다. ` +
      `그러나 적정 월세는 ${won(small.fairMonthlyRent)}과 ${won(large.fairMonthlyRent)}으로 열 배 차이이고, 연간 초과 부담도 ${won(small.annualExcessBurden)}과 ${won(large.annualExcessBurden)}으로 열 배 벌어집니다. ` +
      `기본 조건의 ${won(b.annualExcessBurden)}은 그 사이에 놓입니다. 세 계약 모두 '상한을 ${pp(b.actualConversionRate - b.legalRateCap)} 넘겼다'는 같은 문장으로 요약되지만, 조정을 요구할 실익은 금액 쪽에서만 드러납니다. ` +
      `조정 신청이나 협의에 드는 노력이 계약 크기와 무관하다면, 같은 비율 초과라도 큰 계약에서 먼저 움직이는 편이 합리적입니다.`,
  };
}

function baseRateSensitivity(): Finding {
  const b = jr();
  const cut = jr({ legalRateCap: BASE.legalRateCap - BASE_RATE_CUT });
  const needed = Math.ceil((b.actualConversionRate - JUDGMENT_TOLERANCE) * 10_000) / 10_000;
  return {
    h2: `기준금리가 ${pp(BASE_RATE_CUT)} 내리면 적정 월세는 ${won(b.fairMonthlyRent - cut.fairMonthlyRent)} 내려간다`,
    body:
      `상한은 한국은행 기준금리에 ${pp(LEGAL_RATE_SPREAD)}를 더한 값이라 기준금리가 움직이면 적정 월세도 함께 움직입니다. ` +
      `${JEONSE_WOLSE_RATE_UPDATED} 확인 기준 기준금리는 ${pct(BOK_BASE_RATE, 1)}이고 상한은 ${pct(LEGAL_CONVERSION_RATE_CAP, 1)}입니다. 상한을 ${pct(BASE.legalRateCap - BASE_RATE_CUT, 2)}로 낮춰 돌리면 기본 조건의 적정 월세가 ${won(b.fairMonthlyRent)}에서 ${won(cut.fairMonthlyRent)}으로 ${won(b.fairMonthlyRent - cut.fairMonthlyRent)} 내려가고 연간 초과 부담은 ${won(b.annualExcessBurden)}에서 ${won(cut.annualExcessBurden)}으로 늘어납니다. ` +
      `반대로 지금 월세 ${manwon(BASE.monthlyRent)}이 적정 판정을 받으려면 상한이 ${pct(needed, 2)} 이상이어야 하고, 이는 기준금리 ${pct(needed - LEGAL_RATE_SPREAD, 2)}에 해당합니다. ` +
      `확인 시점 기준금리보다 ${pp(needed - LEGAL_RATE_SPREAD - BOK_BASE_RATE)} 높은 값이니, 이 계약은 금리가 오르기를 기다려 적정이 되는 종류가 아닙니다. 상한 값을 직접 바꿔 보는 것은 미래를 예측하기 위해서가 아니라 판정이 상한에 얼마나 민감한지를 재기 위한 것입니다.`,
  };
}

function capAsOpportunityRate(): Finding {
  const b = jr();
  const matched = calculateJeonseVsWolse({
    jeonseDeposit: BASE.jeonseDeposit,
    wolseDeposit: BASE.wolseDeposit,
    monthlyRent: BASE.monthlyRent,
    annualOpportunityRate: BASE.legalRateCap,
    analysisYears: 2,
  });
  const other = jr({ jeonseDeposit: 400_000_000 });
  const otherMatched = calculateJeonseVsWolse({
    jeonseDeposit: 400_000_000,
    wolseDeposit: BASE.wolseDeposit,
    monthlyRent: BASE.monthlyRent,
    annualOpportunityRate: BASE.legalRateCap,
    analysisYears: 2,
  });
  return {
    h2: `법정 상한을 기회비용 금리로 놓으면 적정 월세와 전세·월세 손익분기 월세가 1원까지 같아진다`,
    body:
      `이 페이지의 적정 월세와 전세·월세 비교 계산기의 손익분기 월세는 같은 식입니다. 둘 다 보증금 차액에 어떤 연이율을 곱해 12로 나눈 값이고, 이율의 출처만 법정 상한이냐 내 기회비용이냐로 갈립니다. ` +
      `기본 조건의 적정 월세 ${won(b.fairMonthlyRent)}은 같은 보증금으로 기회비용 금리 ${pct(BASE.legalRateCap, 1)}를 넣었을 때의 손익분기 월세 ${won(matched.breakEvenMonthlyRent)}과 일치합니다. 전세보증금을 ${manwon(400_000_000)}으로 바꿔도 ${won(other.fairMonthlyRent)}과 ${won(otherMatched.breakEvenMonthlyRent)}으로 같습니다. ` +
      `달리 말하면 법이 그은 상한선은 기회비용 금리가 ${pct(BASE.legalRateCap, 1)}인 임차인에게 딱 중립인 지점입니다. ` +
      `전세자금대출 금리가 ${pct(BASE.legalRateCap, 1)}보다 낮은 사람에게는 상한선의 월세도 여전히 손해이고, 그보다 높은 사람에게는 상한선의 월세가 오히려 이득입니다. 같은 '적정' 판정이 사람마다 다른 의미를 갖는 이유입니다.`,
  };
}

function undefinedDomain(): Finding {
  const zero = jr({ jeonseDeposit: 100_000_000, wolseDeposit: 100_000_000 });
  const negative = jr({ jeonseDeposit: 100_000_000, wolseDeposit: 150_000_000 });
  return {
    h2: `월세보증금이 전세보증금 이상이면 전환율이 ${pct(zero.actualConversionRate, 1)}로 정의되지 않아 판정을 근거로 쓸 수 없다`,
    body:
      `전환율은 보증금 차액을 분모로 쓰므로 차액이 0 이하이면 정의되지 않습니다. 계산기는 이 구간에서 전환율과 적정 월세를 ${num(0)}으로 두고 넘어갑니다. ` +
      `전세보증금과 월세보증금을 모두 ${manwon(100_000_000)}으로 넣으면 차액 ${won(zero.depositDifference)}, 전환율 ${pct(zero.actualConversionRate, 1)}, 적정 월세 ${won(zero.fairMonthlyRent)}이 나오는데, 같은 화면의 초과 부담 칸에는 월세 전액인 월 ${won(zero.monthlyRentGap)}과 연 ${won(zero.annualExcessBurden)}이 찍힙니다. ` +
      `월세보증금을 ${manwon(150_000_000)}으로 더 키워 차액이 ${won(negative.depositDifference)}이 되어도 판정과 금액이 그대로입니다. 판정 칸과 금액 칸이 서로 다른 이야기를 하는 것이므로 이 구간에서는 둘 다 협상 근거로 쓸 수 없습니다. ` +
      `애초에 전세를 월세로 돌리는 상황이 아니어서 전환율이라는 개념이 성립하지 않는 입력입니다. 전세보증금 칸에는 전환 전 금액을, 월세보증금 칸에는 전환 후 금액을 넣어야 하며, 두 값이 뒤바뀌면 이 구간에 들어갑니다.`,
  };
}

export const JEONSE_WOLSE_RATE_DIGEST: Finding[] = [
  baseline(),
  toleranceWindow(),
  windowScalesWithGap(),
  oneSlopeFourTimes(),
  depositOnlyMakesItWorse(),
  vanishingRow(),
  labelIgnoresSize(),
  baseRateSensitivity(),
  capAsOpportunityRate(),
  undefinedDomain(),
];

export const JEONSE_WOLSE_RATE_BASIS: Finding = {
  h2: "위 발견의 계산 기준",
  body:
    `위 수치는 전부 이 페이지의 전월세 전환율 계산기를 실행해 얻은 값이며, 언급하지 않은 항목은 화면 기본값을 씁니다. 상한 산식과 기준금리 확인일은 ${JEONSE_WOLSE_RATE_UPDATED}입니다. ` +
    `상한을 ${pct(LEGAL_CONVERSION_RATE_CAP, 1)}로 두는 것은 확인일의 기준금리 ${pct(BOK_BASE_RATE, 1)}에 시행령이 정한 ${pp(LEGAL_RATE_SPREAD)}를 더한 결과이고, 기준금리가 바뀌면 이 페이지의 모든 적정 월세가 함께 움직입니다. 위 문단에서 상한을 다른 값으로 바꿔 돌린 부분은 예측이 아니라 민감도 확인입니다. ` +
    `또한 이 상한은 기존 계약의 전세를 월세로 돌리는 경우에 적용되며 신규 계약의 월세에는 적용되지 않습니다. 이 계산기는 관리비·중개보수·보증보험료를 다루지 않으므로, 전세와 월세 중 무엇이 실제로 싼지는 기회비용 금리를 넣는 전세 vs 월세 계산기에서 따로 확인해야 합니다.`,
};
