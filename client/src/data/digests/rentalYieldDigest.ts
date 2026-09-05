// /rental-yield digest. Three yield numbers on one screen hide the fact that
// they answer different questions; running the engine across loan size, loan
// rate, vacancy, deposit and price shows where leverage stops helping, what a
// vacancy month is worth in interest-rate terms, and how the deposit amplifies
// whatever sign the net income already has.

import { RENTAL_YIELD_UPDATED } from "../rentalYield";
import { DEFAULT_RENTAL_YIELD_INPUT } from "@/lib/housingValidators";
import { calculateRentalYield, type RentalYieldInput } from "@/utils/housingCalculator";
import { type Finding, manwon, pct, pp, times, won } from "./format";

export const ry = (patch: Partial<RentalYieldInput>) =>
  calculateRentalYield({ ...DEFAULT_RENTAL_YIELD_INPUT, ...patch });

export const BASE = DEFAULT_RENTAL_YIELD_INPUT;
export const HIGH_RENT = 1_500_000;
export const RATE_STEP = 0.0001;

/** Lowest whole-won rent at which the default setup stops losing money. */
export function breakEvenRent(): number {
  for (let rent = BASE.monthlyRent; rent <= BASE.monthlyRent + 100_000; rent += 1) {
    if (ry({ monthlyRent: rent }).annualNetIncome >= 0) return rent;
  }
  return 0;
}

/** Highest 0.01%p loan rate at which borrowing still beats paying cash (by ROE). */
export function leverageBreakEvenRate(): number {
  const cash = ry({ loanAmount: 0 }).roe;
  let best = 0;
  for (let rate = 0; rate <= 0.08; rate += RATE_STEP) {
    if (ry({ loanRate: rate }).roe >= cash) best = rate;
  }
  return Number(best.toFixed(4));
}

/** Loan rate at which a given loan size drives annual net income to zero. */
export function zeroNetRate(loanAmount: number): number {
  for (let rate = 0; rate <= 0.15; rate += RATE_STEP) {
    if (ry({ loanAmount, loanRate: rate }).annualNetIncome < 0) return Number((rate - RATE_STEP).toFixed(4));
  }
  return 0;
}

function breakEvenRentFinding(): Finding {
  const base = ry({});
  const rent = breakEvenRent();
  const even = ry({ monthlyRent: rent });
  return {
    h2: `기본 입력값은 손익분기 월세보다 ${won(rent - BASE.monthlyRent)} 낮다`,
    body:
      `계산기 기본값(매매가 ${manwon(BASE.purchasePrice)}, 보증금 ${manwon(BASE.deposit)}, 월세 ${manwon(BASE.monthlyRent)}, 대출 ${manwon(BASE.loanAmount)}·연 ${pct(BASE.loanRate, 1)}, 관리비 월 ${manwon(BASE.monthlyExpense)}, 공실률 ${pct(BASE.vacancyRate, 0)})으로 계산하면 연 순수익이 ${won(base.annualNetIncome)}, 월로는 ${won(base.monthlyNetIncome)}입니다. ` +
      `월세를 1원 단위로 올려 보면 ${won(rent)}에서 순수익이 ${won(even.annualNetIncome)}으로 처음 0을 넘습니다. ` +
      `기본값의 월세가 이 손익분기점보다 ${won(rent - BASE.monthlyRent)} 낮다는 뜻이고, 연 임대수입 ${won(base.annualRentGross)} 가운데 공실 ${won(base.vacancyLoss)}, 대출이자 ${won(base.annualLoanInterest)}, 관리비 ${won(base.annualExpense)}을 빼면 남는 것이 없다는 계산입니다. ` +
      `총수익률 ${pct(base.grossYield)}만 보면 수익이 나는 것처럼 보이지만 순수익률은 ${pct(base.netYield)}입니다. 이 페이지에서 총수익률과 순수익률을 나눠 보여주는 이유가 이 간격에 있습니다.`,
  };
}

function leverageThreshold(): Finding {
  const cash = ry({ loanAmount: 0 });
  const threshold = leverageBreakEvenRate();
  const at = ry({ loanRate: threshold });
  const above = ry({ loanRate: threshold + 0.005 });
  return {
    h2: `대출이 자기자본수익률을 끌어올리는 금리 상한은 연 ${pct(threshold)}이다`,
    body:
      `대출을 끼면 자기자본이 줄어 수익률이 올라간다는 설명은 조건부입니다. 대출 없이 사면 자기자본 ${won(cash.equity)}에 연 순수익 ${won(cash.annualNetIncome)}으로 ROE가 ${pct(cash.roe)}인데, 이 값이 곧 레버리지의 손익분기 금리입니다. ` +
      `대출 ${manwon(BASE.loanAmount)}을 넣고 금리를 ${pct(RATE_STEP)} 단위로 올리며 돌리면, 연 ${pct(threshold)}까지는 ROE가 ${pct(at.roe)}로 무대출과 같거나 높지만 그 위로는 역전됩니다. ` +
      `연 ${pct(threshold + 0.005)}이면 ROE가 ${pct(above.roe)}로 떨어지고, 기본값 금리 연 ${pct(BASE.loanRate, 1)}에서는 ${pct(ry({}).roe)}입니다. ` +
      `임대수입에서 경비를 뺀 뒤의 수익률이 대출금리보다 낮으면 빌릴수록 손해라는 뜻이고, 이 조건에서는 손익분기 금리가 시중 주택담보대출 금리보다 한참 아래라 레버리지가 ROE를 낮추는 쪽으로만 작동합니다.`,
  };
}

function moreDebtHigherRoe(): Finding {
  const two = ry({ monthlyRent: HIGH_RENT, loanAmount: 200_000_000, loanRate: 0.06 });
  const three = ry({ monthlyRent: HIGH_RENT, loanAmount: 300_000_000, loanRate: 0.045 });
  const cash = ry({ monthlyRent: HIGH_RENT, loanAmount: 0 });
  return {
    h2: `더 많이 빌리고 이자도 더 내는 쪽의 ROE가 ${pp(three.roe - two.roe)} 높게 나온다`,
    body:
      `월세를 ${manwon(HIGH_RENT)}으로 올린 조건(매매가·보증금·관리비·공실률은 기본값)에서는 무대출 ROE가 ${pct(cash.roe)}로 양수가 됩니다. 여기서 대출 두 가지를 비교하면 순서가 직관과 어긋납니다. ` +
      `대출 ${manwon(200_000_000)}에 금리 연 ${pct(0.06, 1)} 조건은 이자 ${won(two.annualLoanInterest)}, 순수익 ${won(two.annualNetIncome)}, 자기자본 ${won(two.equity)}이어서 ROE가 ${pct(two.roe)}입니다. ` +
      `대출 ${manwon(300_000_000)}에 금리 연 ${pct(0.045, 1)} 조건은 이자가 ${won(three.annualLoanInterest)}으로 더 크고 순수익도 ${won(three.annualNetIncome)}으로 더 적지만, 자기자본이 ${won(three.equity)}까지 줄어 ROE는 ${pct(three.roe)}입니다. ` +
      `더 많이 빌리고 더 많은 이자를 내는 쪽이 ${pp(three.roe - two.roe)} 높게 나오는 것입니다. ROE는 분자(순수익)와 분모(자기자본)가 함께 움직이는 지표라, 두 조건의 금리가 다르면 대출 규모만으로 우열을 말할 수 없습니다. 실제 현금흐름은 순수익 ${won(three.annualNetIncome)} 쪽이 ${won(two.annualNetIncome - three.annualNetIncome)} 적습니다.`,
  };
}

function vacancyAsRate(): Finding {
  const none = ry({ vacancyRate: 0 });
  const base = ry({});
  const heavy = ry({ vacancyRate: 0.2 });
  const perPoint = (base.vacancyLoss - none.vacancyLoss) / BASE.loanAmount;
  return {
    h2: `공실률 ${pct(BASE.vacancyRate, 0)}는 대출 ${manwon(BASE.loanAmount)}에 금리 ${pp(perPoint)}를 얹은 것과 같다`,
    body:
      `공실은 임대수입에서 먼저 빠지므로 금리처럼 매년 고정으로 나가는 비용과 직접 비교할 수 있습니다. 기본 조건에서 공실률 ${pct(BASE.vacancyRate, 0)}는 연 ${won(base.vacancyLoss)}의 손실이고, 이는 대출 ${manwon(BASE.loanAmount)} 기준 금리 ${pp(perPoint)}에 해당합니다. ` +
      `공실률을 ${pct(0.2, 0)}로 올리면 손실이 ${won(heavy.vacancyLoss)}으로 커져 금리로는 ${pp(heavy.vacancyLoss / BASE.loanAmount)}, 순수익은 ${won(base.annualNetIncome)}에서 ${won(heavy.annualNetIncome)}으로 내려갑니다. ` +
      `공실 없이 채운다면 순수익이 ${won(none.annualNetIncome)}, 순수익률 ${pct(none.netYield)}로 부호가 바뀝니다. ` +
      `연 단위로 보면 공실률 ${pct(0.2, 0)}는 열두 달 중 약 두 달 반이 비는 상태인데, 그 두 달 반이 대출금리 협상 ${pp(heavy.vacancyLoss / BASE.loanAmount)}보다 크게 작용합니다. 금리를 깎으려 애쓰는 시간의 일부를 공실을 줄이는 데 쓰는 편이 금액으로는 더 큰 셈입니다.`,
  };
}

function expenseAsYield(): Finding {
  const none = ry({ monthlyExpense: 0 });
  const base = ry({});
  const double = ry({ monthlyExpense: BASE.monthlyExpense * 2 });
  return {
    h2: `관리비 월 ${manwon(BASE.monthlyExpense)}이 순수익률을 ${pp(none.netYield - base.netYield)} 깎는다`,
    body:
      `월 단위로는 작아 보이는 관리비·수선비가 수익률에서는 고정 비율로 나타납니다. 매매가 ${manwon(BASE.purchasePrice)} 기준으로 월 ${manwon(BASE.monthlyExpense)}은 연 ${won(base.annualExpense)}이고, 순수익률로는 ${pp(none.netYield - base.netYield)}입니다. ` +
      `관리비를 0으로 두면 순수익이 ${won(none.annualNetIncome)}, 순수익률 ${pct(none.netYield)}가 되고, 월 ${manwon(BASE.monthlyExpense * 2)}으로 올리면 ${won(double.annualNetIncome)}, ${pct(double.netYield)}가 됩니다. ` +
      `자기자본수익률로 환산하면 같은 변화가 ${pct(none.roe)}에서 ${pct(double.roe)}까지 ${pp(none.roe - double.roe)} 폭으로 움직입니다. 자기자본 ${won(base.equity)}이 매매가보다 작아 같은 비용이 ROE에서는 더 크게 보이기 때문입니다. ` +
      `수선 주기가 긴 항목(도배·보일러·누수)은 발생한 해에 몰리므로, 이 칸에는 월 평균으로 환산한 금액을 넣어야 연 단위 수익률이 흔들리지 않습니다.`,
  };
}

function depositAmplifies(): Finding {
  const none = ry({ deposit: 0 });
  const base = ry({});
  const heavy = ry({ deposit: 290_000_000 });
  return {
    h2: `보증금은 순수익을 1원도 바꾸지 않고 ROE 절댓값만 ${times(heavy.roe, none.roe, 1)} 키운다`,
    body:
      `이 계산기에서 보증금은 임대수입에도, 이자에도, 경비에도 들어가지 않습니다. 자기자본(매매가 − 대출 − 보증금)에서만 빠집니다. ` +
      `그래서 보증금을 0, ${manwon(BASE.deposit)}, ${manwon(290_000_000)}으로 바꿔도 연 순수익은 ${won(base.annualNetIncome)}으로 고정이고, 자기자본만 ${won(none.equity)} → ${won(base.equity)} → ${won(heavy.equity)}으로 줄어듭니다. ` +
      `그 결과 ROE는 ${pct(none.roe)} → ${pct(base.roe)} → ${pct(heavy.roe)}로 벌어집니다. 기본값처럼 순수익이 음수인 조건에서는 손실률이 커지는 방향으로 증폭되고, 순수익이 양수였다면 같은 배율로 수익률이 커집니다. ` +
      `총수익률 ${pct(base.grossYield)}와 순수익률 ${pct(base.netYield)}가 보증금에 전혀 반응하지 않는 것과 대조적입니다. 보증금을 키워 ROE를 높이는 방식은 분모를 줄이는 것이지 수익을 늘리는 것이 아니며, 계약 종료 시 돌려줘야 할 돈이라는 점은 이 지표에 나타나지 않습니다.`,
  };
}

function netSignFlip(): Finding {
  const loan = 300_000_000;
  const flip = zeroNetRate(loan);
  const at = ry({ loanAmount: loan, loanRate: flip });
  const market = ry({ loanAmount: loan, loanRate: 0.055 });
  return {
    h2: `대출을 ${manwon(loan)}으로 늘리면 금리 ${pct(flip)}부터 순수익이 마이너스로 돌아선다`,
    body:
      `대출 규모가 커지면 손익분기 금리가 내려갑니다. 대출 ${manwon(loan)}·기본 월세 조건에서 금리를 ${pct(RATE_STEP)} 단위로 올리며 돌리면 연 ${pct(flip)}까지는 순수익이 ${won(at.annualNetIncome)}으로 버티다가 그 위에서 음수가 됩니다. ` +
      `연 ${pct(0.055, 1)}이면 순수익이 ${won(market.annualNetIncome)}, 월 ${won(market.monthlyNetIncome)}으로 매달 현금이 빠져나가고, ROE는 ${pct(market.roe)}입니다. ` +
      `대출 ${manwon(BASE.loanAmount)}일 때의 손익분기 금리 ${pct(zeroNetRate(BASE.loanAmount))}와 비교하면, 대출을 ${manwon(loan - BASE.loanAmount)} 더 받는 대가로 견딜 수 있는 금리가 ${pp(zeroNetRate(BASE.loanAmount) - flip)} 낮아진 셈입니다. ` +
      `변동금리 상품이라면 이 수치가 곧 버틸 수 있는 금리 상단이고, 그 위에서는 임대수입이 아니라 다른 소득으로 이자를 메워야 합니다.`,
  };
}

function priceLadder(): Finding {
  const rungs = [BASE.purchasePrice, 700_000_000, 1_000_000_000, 1_500_000_000].map((purchasePrice) => ({
    purchasePrice,
    r: ry({ purchasePrice }),
  }));
  const [low, , , high] = rungs;
  const text = rungs
    .map(({ purchasePrice, r }) => `${manwon(purchasePrice)} ${pct(r.grossYield)}`)
    .join(", ");
  return {
    h2: `같은 월세라면 매매가가 ${times(high.purchasePrice, low.purchasePrice, 0)}일 때 총수익률은 ${times(low.r.grossYield, high.r.grossYield, 0)} 차이가 난다`,
    body:
      `월세 ${manwon(BASE.monthlyRent)}과 보증금 ${manwon(BASE.deposit)}을 고정하고 매매가만 바꾸면 총수익률은 ${text}입니다. 총수익률은 연 임대수입 ${won(low.r.annualRentGross)}을 매매가로 나눈 값이라 매매가에 정확히 반비례합니다. ` +
      `순수익률은 그렇게 단순하지 않습니다. 같은 조건에서 ${manwon(low.purchasePrice)}이면 ${pct(low.r.netYield)}, ${manwon(high.purchasePrice)}이면 ${pct(high.r.netYield)}인데, 대출·관리비·공실이 매매가와 무관하게 고정이라 분모만 커지기 때문입니다. ` +
      `자기자본은 ${won(low.r.equity)}에서 ${won(high.r.equity)}으로 늘어, 같은 순수익이 ROE에서 차지하는 비중도 ${pct(low.r.roe)}에서 ${pct(high.r.roe)}로 옅어집니다. ` +
      `"수익률이 높은 물건"을 찾는 일이 결국 매매가 대비 월세 비율을 찾는 일과 같다는 뜻이고, 같은 임대 조건이라면 싼 물건이 무조건 유리하게 나옵니다. 이 계산기가 다루지 않는 시세 상승분은 반대 방향으로 작용합니다.`,
  };
}

function yieldGapDecomposition(): Finding {
  const base = ry({});
  const gap = base.grossYield - base.netYield;
  return {
    h2: `총수익률과 순수익률의 간격 ${pp(gap)}는 세 항목으로 정확히 나뉜다`,
    body:
      `기본 조건에서 총수익률은 ${pct(base.grossYield)}, 순수익률은 ${pct(base.netYield)}입니다. 두 값의 간격 ${pp(gap)}를 매매가 ${manwon(BASE.purchasePrice)} 기준으로 항목별로 쪼개면 대출이자 ${won(base.annualLoanInterest)}이 ${pp(base.annualLoanInterest / BASE.purchasePrice)}, 관리비 ${won(base.annualExpense)}이 ${pp(base.annualExpense / BASE.purchasePrice)}, 공실 손실 ${won(base.vacancyLoss)}이 ${pp(base.vacancyLoss / BASE.purchasePrice)}입니다. ` +
      `세 항목의 합이 간격과 일치하므로, 순수익률을 올리려면 이 셋 중 하나를 줄이는 수밖에 없습니다. 가장 큰 몫은 대출이자로 간격의 ${pct(base.annualLoanInterest / (base.annualLoanInterest + base.annualExpense + base.vacancyLoss))}를 차지합니다. ` +
      `총수익률만 광고하는 매물 정보가 실제 수익과 멀어지는 이유도 이 분해에 있습니다. 같은 물건이라도 대출을 얼마나 끼느냐에 따라 순수익률은 ${pct(ry({ loanAmount: 0 }).netYield)}에서 ${pct(ry({ loanAmount: 300_000_000 }).netYield)}까지 움직입니다. ` +
      `한편 총수익률은 대출과 무관하게 ${pct(base.grossYield)}로 고정입니다.`,
  };
}

export const RENTAL_YIELD_DIGEST: Finding[] = [
  breakEvenRentFinding(),
  leverageThreshold(),
  moreDebtHigherRoe(),
  vacancyAsRate(),
  expenseAsYield(),
  depositAmplifies(),
  netSignFlip(),
  priceLadder(),
  yieldGapDecomposition(),
];

export const RENTAL_YIELD_BASIS: Finding = {
  h2: "위 발견의 계산 기준",
  body:
    `위 수치는 전부 이 페이지의 임대수익률 계산기에 값을 넣어 실행한 결과이며, 따로 적지 않은 항목은 계산기 기본값을 그대로 씁니다. 계산식 기준일은 ${RENTAL_YIELD_UPDATED}입니다. ` +
    `매매가·월세·금리·공실률은 사실이 아니라 사용자가 고르는 가정값입니다. 위 비교는 특정 지역의 시세나 실제 대출 조건을 근거로 한 것이 아니라, 한 축만 바꿨을 때 결과가 어떻게 움직이는지를 보여주기 위한 것입니다. ` +
    `이 계산기는 시세 상승·하락, 취득세와 중개보수 같은 초기 비용, 재산세·종합부동산세 같은 보유 비용, 임대소득세를 반영하지 않습니다. 보유세는 이 사이트의 재산세·보유세 계산기에서, 초기 비용은 취득세 계산기에서 따로 확인해야 실제 수익률에 가까워집니다.`,
};
