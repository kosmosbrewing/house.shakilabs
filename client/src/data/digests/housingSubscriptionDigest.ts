// /housing-subscription digest. Three point ladders with different step sizes and
// different ceilings turn into exchange rates: what one dependant is worth in
// years, which totals are unreachable, and why the two time-based items stop on
// the same anniversary.

import { HOUSING_SUBSCRIPTION_UPDATED } from "../housingSubscription";
import { calculateHousingSubscriptionScore, type HousingSubscriptionInput } from "@/utils/housingCalculator";
import { type Finding, num, pct, years } from "./format";

// Written out again rather than imported from the screen default on purpose.
// 화면 기본값 객체를 그대로 쓰면 "기준 입력이 화면과 같다"는 대조가 자기 자신을 비교하게 된다.
// 값을 독립적으로 적어 두고 digests.test.ts가 DEFAULT_HOUSING_SUBSCRIPTION_INPUT과 맞대게 한다.
export const BASE: HousingSubscriptionInput = {
  homelessYears: 6,
  dependents: 1,
  accountYears: 4,
};

export const hs = (patch: Partial<HousingSubscriptionInput> = {}) =>
  calculateHousingSubscriptionScore({ ...BASE, ...patch });

export const HOMELESS_MAX_SCORE = 32;
export const DEPENDENT_MAX_SCORE = 35;
export const ACCOUNT_MAX_SCORE = 17;
export const HOMELESS_CAP_YEARS = 15;
export const ACCOUNT_CAP_YEARS = 15;
export const MAX_DEPENDENTS = 6;
export const MAX_INPUT_YEARS = 30;
/** Label thresholds the engine prints next to the total. */
export const HIGH_SCORE_LINE = 60;

/** Totals reachable with whole-year inputs — the account ladder has a half-year rung. */
export function reachableTotals(): Set<number> {
  const totals = new Set<number>();
  for (let h = 0; h <= MAX_INPUT_YEARS; h += 1) {
    for (let d = 0; d <= MAX_DEPENDENTS; d += 1) {
      for (let a = 0; a <= MAX_INPUT_YEARS; a += 1) {
        totals.add(hs({ homelessYears: h, dependents: d, accountYears: a }).totalScore);
      }
    }
  }
  return totals;
}

/** How many whole-year combinations sit on `total`, and how many can step to `total + 1`. */
export function stepCensus(total: number): { combinations: number; exact: number } {
  let combinations = 0;
  let exact = 0;
  for (let h = 0; h <= MAX_INPUT_YEARS; h += 1) {
    for (let d = 0; d <= MAX_DEPENDENTS; d += 1) {
      for (let a = 0; a <= MAX_INPUT_YEARS; a += 1) {
        if (hs({ homelessYears: h, dependents: d, accountYears: a }).totalScore !== total) continue;
        combinations += 1;
        const next = [
          h < MAX_INPUT_YEARS ? hs({ homelessYears: h + 1, dependents: d, accountYears: a }).totalScore : -1,
          d < MAX_DEPENDENTS ? hs({ homelessYears: h, dependents: d + 1, accountYears: a }).totalScore : -1,
          a < MAX_INPUT_YEARS ? hs({ homelessYears: h, dependents: d, accountYears: a + 1 }).totalScore : -1,
        ];
        if (next.includes(total + 1)) exact += 1;
      }
    }
  }
  return { combinations, exact };
}

function baseline(): Finding {
  const b = hs();
  const homelessRoom = HOMELESS_MAX_SCORE - b.homelessScore;
  const dependentRoom = DEPENDENT_MAX_SCORE - b.dependentScore;
  const accountRoom = ACCOUNT_MAX_SCORE - b.accountScore;
  return {
    h2: `기본 입력 ${num(b.totalScore)}점에서 남은 ${num(b.remainingToMax)}점 가운데 ${pct(dependentRoom / b.remainingToMax, 0)}는 기다려서 얻을 수 없다`,
    body:
      `계산기 기본값(무주택 ${years(BASE.homelessYears)}, 부양가족 ${num(BASE.dependents)}명, 통장 ${years(BASE.accountYears)})을 넣으면 무주택 ${num(b.homelessScore)}점, 부양가족 ${num(b.dependentScore)}점, 통장 ${num(b.accountScore)}점으로 합계 ${num(b.totalScore)}점, 만점까지 ${num(b.remainingToMax)}점이 남습니다. ` +
      `남은 점수를 항목별로 쪼개면 무주택 ${num(homelessRoom)}점, 부양가족 ${num(dependentRoom)}점, 통장 ${num(accountRoom)}점입니다. ` +
      `이 가운데 시간이 해결해 주는 것은 무주택과 통장의 ${num(homelessRoom + accountRoom)}점뿐이고, 그마저 무주택은 ${years(HOMELESS_CAP_YEARS - BASE.homelessYears)}, 통장은 ${years(ACCOUNT_CAP_YEARS - BASE.accountYears)}을 더 채워야 합니다. ` +
      `나머지 ${num(dependentRoom)}점은 세대 구성이 바뀌어야 생기는 점수라 기다림으로는 접근할 수 없습니다. ` +
      `'만점까지 ${num(b.remainingToMax)}점'이라는 한 줄이 실제로는 성격이 전혀 다른 두 덩어리라는 뜻이고, 청약 전략을 세울 때 먼저 갈라야 하는 것이 이 경계입니다.`,
  };
}

function exchangeRate(): Finding {
  const b = hs();
  const dependentPlus = hs({ dependents: BASE.dependents + 1 });
  const homelessTwo = hs({ homelessYears: BASE.homelessYears + 2 });
  const homelessThree = hs({ homelessYears: BASE.homelessYears + 3 });
  const accountFive = hs({ accountYears: BASE.accountYears + 5 });
  const lateAccount = hs({ accountYears: 13 });
  const lateAccountFive = hs({ accountYears: 18 });
  return {
    h2: `부양가족 1명은 통장 ${years(5)}과 정확히 같고 무주택 기간에는 맞아떨어지는 연수가 없다`,
    body:
      `세 항목의 계단 높이가 달라서 같은 점수를 사는 값이 항목마다 다릅니다. 기본값에서 부양가족을 ${num(BASE.dependents + 1)}명으로 늘리면 총점이 ${num(b.totalScore)}점에서 ${num(dependentPlus.totalScore)}점으로 ${num(dependentPlus.totalScore - b.totalScore)}점 오릅니다. ` +
      `같은 폭을 통장으로 사려면 ${years(5)}이 필요해 ${num(accountFive.totalScore)}점으로 정확히 맞습니다. 무주택으로는 ${years(2)}을 더해도 ${num(homelessTwo.totalScore)}점으로 모자라고 ${years(3)}을 더하면 ${num(homelessThree.totalScore)}점으로 넘어갑니다. ` +
      `무주택은 한 계단이 2점, 통장은 1점, 부양가족은 5점이라 5의 배수를 무주택 계단으로는 만들 수 없기 때문입니다. ` +
      `다만 이 환산은 상한에 닿기 전까지만 성립합니다. 통장이 ${years(13)}인 사람이 ${years(5)}을 더 채우면 총점은 ${num(lateAccount.totalScore)}점에서 ${num(lateAccountFive.totalScore)}점으로 ${num(lateAccountFive.totalScore - lateAccount.totalScore)}점만 오릅니다. 상한 앞에서는 같은 5년이 5점이 아니라 2점입니다.`,
  };
}

function timeAloneStops(): Finding {
  const timeOnly = hs({ homelessYears: HOMELESS_CAP_YEARS, accountYears: ACCOUNT_CAP_YEARS, dependents: 0 });
  const one = hs({ homelessYears: HOMELESS_CAP_YEARS, accountYears: ACCOUNT_CAP_YEARS, dependents: 1 });
  const two = hs({ homelessYears: HOMELESS_CAP_YEARS, accountYears: ACCOUNT_CAP_YEARS, dependents: 2 });
  return {
    h2: `무주택 ${years(HOMELESS_CAP_YEARS)}과 통장 ${years(ACCOUNT_CAP_YEARS)}을 다 채워도 부양가족이 1명 이하면 ${num(HIGH_SCORE_LINE)}점을 넘지 못한다`,
    body:
      `시간으로 얻을 수 있는 점수에는 천장이 있습니다. 무주택 만점 ${num(HOMELESS_MAX_SCORE)}점과 통장 만점 ${num(ACCOUNT_MAX_SCORE)}점을 더해도 ${num(HOMELESS_MAX_SCORE + ACCOUNT_MAX_SCORE)}점이고, 여기에 부양가족 0명의 기본 ${num(hs({ dependents: 0 }).dependentScore)}점을 얹으면 ${num(timeOnly.totalScore)}점입니다. ` +
      `계산기는 이 조합에 '${timeOnly.competitivenessLabel}'을 붙입니다. 부양가족 1명이면 ${num(one.totalScore)}점으로 여전히 같은 구간이고, 2명이 되어야 ${num(two.totalScore)}점으로 '${two.competitivenessLabel}' 구간에 올라섭니다. ` +
      `${years(HOMELESS_CAP_YEARS)}을 기다린 1인 가구와 ${years(4)}을 기다린 4인 가구 사이에서 앞쪽이 이기지 못하는 구조라는 뜻입니다. ` +
      `가점제 경쟁을 시간 싸움으로 보는 통념과 어긋나는 지점이고, 부양가족을 늘릴 수 없는 세대가 가점제 대신 추첨제나 특별공급을 함께 봐야 하는 계산상의 이유이기도 합니다.`,
  };
}

function twoCeilingsSameYear(): Finding {
  const atCap = hs({ homelessYears: HOMELESS_CAP_YEARS, accountYears: ACCOUNT_CAP_YEARS });
  const doubled = hs({ homelessYears: MAX_INPUT_YEARS, accountYears: MAX_INPUT_YEARS });
  const justUnder = hs({ homelessYears: HOMELESS_CAP_YEARS - 0.01, accountYears: ACCOUNT_CAP_YEARS - 0.01 });
  return {
    h2: `무주택과 통장은 같은 ${years(HOMELESS_CAP_YEARS)}째에 함께 멈추고 그 뒤로는 ${years(MAX_INPUT_YEARS)}을 채워도 점수가 같다`,
    body:
      `두 시간 항목은 상한 연차가 같습니다. ${years(HOMELESS_CAP_YEARS)}에서 무주택 ${num(atCap.homelessScore)}점, 통장 ${num(atCap.accountScore)}점으로 둘 다 최고점에 닿고, 입력 상한인 ${years(MAX_INPUT_YEARS)}을 넣어도 ${num(doubled.homelessScore)}점과 ${num(doubled.accountScore)}점 그대로입니다. ` +
      `직전 해와 비교하면 차이가 분명합니다. 두 값을 각각 ${years(HOMELESS_CAP_YEARS - 0.01)}로 두면 ${num(justUnder.homelessScore)}점과 ${num(justUnder.accountScore)}점이라 합계가 ${num(atCap.totalScore - justUnder.totalScore)}점 낮습니다. ` +
      `같은 ${years(HOMELESS_CAP_YEARS)}을 견뎠는데 무주택은 ${num(atCap.homelessScore)}점, 통장은 ${num(atCap.accountScore)}점으로 보상이 ${num(atCap.homelessScore / atCap.accountScore, 2)}배 차이 나는 것도 이 항목들의 비대칭입니다. ` +
      `${years(HOMELESS_CAP_YEARS)}을 넘긴 사람에게 시간은 더 이상 점수를 주지 않으므로, 그 시점 이후의 전략은 세대 구성이나 청약 유형 선택으로 옮겨 가야 합니다.`,
  };
}

function oneDayTwoPoints(): Finding {
  const before = hs({ homelessYears: 6.99 });
  const after = hs({ homelessYears: 7 });
  const halfBefore = hs({ accountYears: 0.49 });
  const halfAfter = hs({ accountYears: 0.5 });
  const firstYear = hs({ accountYears: 1 });
  return {
    h2: `무주택 ${years(6.99)}과 ${years(7)}은 ${num(after.homelessScore - before.homelessScore)}점 차이고 그 사이 11개월 29일은 0점이다`,
    body:
      `두 시간 항목은 소수점 이하를 버리고 계단으로 끊습니다. 무주택 ${years(6)}과 ${years(6.99)}은 똑같이 ${num(before.homelessScore)}점이고, ${years(7)}이 되는 순간 ${num(after.homelessScore)}점으로 뜁니다. ` +
      `기산일 하루 차이가 ${num(after.homelessScore - before.homelessScore)}점을 가르고, 그 앞의 열한 달 스물아흐레는 점수에 아무 영향을 주지 않습니다. ` +
      `통장 쪽은 첫 두 계단만 규칙이 다릅니다. ${years(0.49)}은 ${num(halfBefore.accountScore)}점, ${years(0.5)}은 ${num(halfAfter.accountScore)}점, ${years(1)}은 ${num(firstYear.accountScore)}점으로 6개월과 1년에 각각 한 계단이 있어 첫해에만 계단이 두 번 놓입니다. ` +
      `모집공고 접수일이 계단을 넘긴 뒤인지 앞인지에 따라 총점이 달라지므로, 기산일을 달 단위로만 세어 두면 실제 점수를 놓칠 수 있습니다.`,
  };
}

function landingOnSixty(): Finding {
  const census = stepCensus(HIGH_SCORE_LINE - 1);
  const capped = hs({ homelessYears: HOMELESS_CAP_YEARS, accountYears: ACCOUNT_CAP_YEARS, dependents: 1 });
  const cappedPlus = hs({ homelessYears: HOMELESS_CAP_YEARS + 1, accountYears: ACCOUNT_CAP_YEARS, dependents: 1 });
  const cappedDependent = hs({ homelessYears: HOMELESS_CAP_YEARS, accountYears: ACCOUNT_CAP_YEARS, dependents: 2 });
  return {
    h2: `${num(HIGH_SCORE_LINE - 1)}점짜리 조합 ${num(census.combinations)}가지 중 ${num(census.combinations - census.exact)}가지는 한 걸음에 ${num(HIGH_SCORE_LINE)}점을 밟지 못한다`,
    body:
      `정수 연차로 만들 수 있는 ${num(HIGH_SCORE_LINE - 1)}점 조합은 ${num(census.combinations)}가지입니다. 여기서 무주택 1년, 부양가족 1명, 통장 1년 중 하나를 더했을 때 정확히 ${num(HIGH_SCORE_LINE)}점이 되는 조합은 ${num(census.exact)}가지뿐입니다. ` +
      `1점을 파는 계단이 통장에만 있기 때문이고, 통장이 이미 상한에 닿았다면 살 수 있는 최소 단위가 무주택 2점 아니면 부양가족 5점으로 뜁니다. ` +
      `무주택 ${years(HOMELESS_CAP_YEARS)}·통장 ${years(ACCOUNT_CAP_YEARS)}·부양가족 1명인 사람은 ${num(capped.totalScore)}점인데, 무주택을 ${years(HOMELESS_CAP_YEARS + 1)}로 늘려도 ${num(cappedPlus.totalScore)}점 그대로이고 부양가족을 늘리면 ${num(cappedDependent.totalScore)}점으로 ${num(HIGH_SCORE_LINE)}점을 건너뜁니다. ` +
      `당첨선이 ${num(HIGH_SCORE_LINE)}점으로 발표됐을 때 '1점만 더'라는 표현이 성립하지 않는 자리가 이렇게 많습니다. 목표 점수는 선이 아니라 내 계단이 실제로 닿는 값으로 잡아야 합니다.`,
  };
}

function tiedByDifferentRoutes(): Finding {
  const patient = hs({ homelessYears: 14, dependents: 0, accountYears: 14 });
  const crowded = hs({ homelessYears: 4, dependents: MAX_DEPENDENTS, accountYears: 4 });
  return {
    h2: `무주택·통장 ${years(14)}에 부양가족 0명과, 무주택·통장 ${years(4)}에 부양가족 ${num(MAX_DEPENDENTS)}명이 나란히 ${num(patient.totalScore)}점이다`,
    body:
      `배점 구조 때문에 전혀 다른 두 이력이 같은 점수에서 만납니다. 무주택 ${years(14)}·통장 ${years(14)}·부양가족 0명은 ${num(patient.homelessScore)}+${num(patient.accountScore)}+${num(patient.dependentScore)}으로 ${num(patient.totalScore)}점입니다. ` +
      `무주택 ${years(4)}·통장 ${years(4)}·부양가족 ${num(MAX_DEPENDENTS)}명은 ${num(crowded.homelessScore)}+${num(crowded.accountScore)}+${num(crowded.dependentScore)}으로 역시 ${num(crowded.totalScore)}점입니다. ` +
      `두 사람이 기다린 시간은 ${years(14)}과 ${years(4)}으로 ${num(10)}년이 차이 나는데 총점은 같고, 계산기가 붙이는 라벨도 '${patient.competitivenessLabel}'로 같습니다. ` +
      `부양가족 ${num(MAX_DEPENDENTS)}명이 무주택 ${num(10)}년과 통장 ${num(10)}년을 한꺼번에 상쇄한다는 뜻입니다. ` +
      `동점자 처리가 별도 기준으로 넘어가는 이유이기도 하고, 내 점수의 절대값만큼이나 그 점수를 어떤 항목으로 채웠는지가 경쟁 상대를 가늠하는 데 필요한 이유이기도 합니다.`,
  };
}

function unreachableNine(): Finding {
  const reachable = reachableTotals();
  const floor = hs({ homelessYears: 0, dependents: 0, accountYears: 0 });
  const half = hs({ homelessYears: 0, dependents: 0, accountYears: 0.5 });
  const one = hs({ homelessYears: 0, dependents: 0, accountYears: 1 });
  const missing = [];
  for (let total = floor.totalScore; total <= 84; total += 1) if (!reachable.has(total)) missing.push(total);
  return {
    h2: `정수 연차만 넣으면 총점 ${num(floor.totalScore)}점 다음이 ${num(one.totalScore)}점이고 ${num(missing[0]!)}점은 만들 수 없다`,
    body:
      `세 항목의 최저 점수를 모두 고르면 무주택 ${num(floor.homelessScore)}점, 부양가족 ${num(floor.dependentScore)}점, 통장 ${num(floor.accountScore)}점으로 총점 ${num(floor.totalScore)}점이 바닥입니다. ` +
      `여기서 연차를 정수로만 움직이면 다음에 닿는 값이 ${num(one.totalScore)}점입니다. 무주택 ${num(0)}년과 ${num(1)}년 사이가 2점, 통장 ${num(0)}년과 ${num(1)}년 사이가 2점이라 1점짜리 이동이 없기 때문입니다. ` +
      `${num(missing[0]!)}점은 통장 가입기간을 ${years(0.5)}처럼 6개월대로 넣었을 때만 나오고, 실제로 그 값을 넣으면 총점이 ${num(half.totalScore)}점이 됩니다. ` +
      `${num(floor.totalScore)}점부터 만점까지 통틀어 정수 연차로 못 만드는 총점은 ${num(missing[0]!)}점 하나뿐입니다. 계산기에 연 단위로만 입력하는 습관이 있다면 이 한 칸이 조용히 비어 있다는 사실을 알아 두는 편이 낫습니다.`,
  };
}

function fifteenYearsBuysFortyNine(): Finding {
  const full = hs({ homelessYears: HOMELESS_CAP_YEARS, dependents: MAX_DEPENDENTS, accountYears: ACCOUNT_CAP_YEARS });
  const timeOnly = hs({ homelessYears: HOMELESS_CAP_YEARS, dependents: 0, accountYears: ACCOUNT_CAP_YEARS });
  return {
    h2: `만점 ${num(full.totalScore)}점의 시간 비용은 ${years(30)}이 아니라 ${years(HOMELESS_CAP_YEARS)}이다`,
    body:
      `무주택 기간과 통장 가입기간은 순서대로 쌓는 것이 아니라 같은 시간 위에서 나란히 자랍니다. 무주택 상태로 ${years(HOMELESS_CAP_YEARS)}을 보내면서 그 기간 내내 통장을 유지하면 두 항목이 동시에 상한에 닿아 ${num(timeOnly.homelessScore)}점과 ${num(timeOnly.accountScore)}점, 합계 ${num(timeOnly.homelessScore + timeOnly.accountScore)}점이 됩니다. ` +
      `두 항목을 더한 상한이 ${num(HOMELESS_MAX_SCORE + ACCOUNT_MAX_SCORE)}점이므로 만점 ${num(full.totalScore)}점의 절반을 조금 넘는 몫이 ${years(HOMELESS_CAP_YEARS)}에 묶여 있는 셈입니다. ` +
      `나머지 ${num(full.totalScore - timeOnly.homelessScore - timeOnly.accountScore)}점은 부양가족 ${num(MAX_DEPENDENTS)}명에서 나오고 이쪽에는 기간 요건이 없습니다. ` +
      `그래서 통장을 늦게 만든 사람이 잃는 것은 대체로 통장 점수 자체가 아니라 무주택 계단과 통장 계단이 어긋난 만큼입니다. 두 기산일을 맞춰 두면 같은 ${years(HOMELESS_CAP_YEARS)}이 ${num(timeOnly.homelessScore + timeOnly.accountScore)}점을 온전히 만들어 냅니다.`,
  };
}

export const HOUSING_SUBSCRIPTION_DIGEST: Finding[] = [
  baseline(),
  exchangeRate(),
  timeAloneStops(),
  twoCeilingsSameYear(),
  oneDayTwoPoints(),
  landingOnSixty(),
  tiedByDifferentRoutes(),
  unreachableNine(),
  fifteenYearsBuysFortyNine(),
];

export const HOUSING_SUBSCRIPTION_BASIS: Finding = {
  h2: "위 발견의 계산 기준",
  body:
    `위 점수는 모두 이 페이지의 청약 가점 계산기에 값을 넣어 실행한 결과이며, 적지 않은 항목은 화면 기본값을 씁니다. 가점표 확인일은 ${HOUSING_SUBSCRIPTION_UPDATED}입니다. ` +
    `이 계산기는 무주택 기간·부양가족수·청약통장 가입기간 세 항목만 합산합니다. 소유 주택 수에 따른 감점, 특별공급 자격, 국민주택의 납입 횟수와 저축총액은 들어 있지 않으므로 실제 청약 자격과는 다를 수 있습니다. ` +
    `무주택 기간의 기산일이 만 30세인지 혼인신고일인지, 부양가족의 등본 등재 기간을 채웠는지 같은 판단은 계산기가 대신해 주지 않습니다. 위 경계와 환산은 입력한 숫자가 정확하다는 전제에서만 성립하며, 잘못 입력한 가점으로 당첨되면 부적격 처리 대상이 됩니다. 접수 전에는 청약홈의 세대 정보 기반 가점과 모집공고문을 함께 대조해야 합니다.`,
};
