import {
  AUCTION_RATE_ASSUMPTION,
  AUCTION_RATE_SCENARIOS,
  HUG_COLLATERAL_RATIO,
  HUG_LIMIT_METRO,
  HUG_LIMIT_OTHER,
  RISK_CAUTION_RATIO,
  RISK_DANGER_RATIO,
  RISK_SEVERE_RATIO,
} from "@/data/jeonseRisk";

export type JeonseRiskLevel = "safe" | "caution" | "danger" | "severe";

/** 낙찰가율 한 가정에서의 회수 추정 — 세 시나리오를 나란히 보여주기 위한 행 */
export interface AuctionScenario {
  /** 가정한 낙찰가율 (소수) */
  rate: number;
  /** 낙찰 대금 추정 = 시세 × 가정 낙찰가율 */
  proceeds: number;
  /** 선순위 배당 후 임차인이 받을 수 있는 금액 */
  recovery: number;
  /** 보증금 대비 부족분 */
  shortfall: number;
}

export interface JeonseRiskInput {
  marketPrice: number;
  jeonseDeposit: number;
  seniorDebt: number;
  isMetropolitan: boolean;
}

export interface JeonseRiskResult {
  isSupported: boolean;
  jeonseRatio: number;
  debtRatio: number;
  riskLevel: JeonseRiskLevel;
  hugLimit: number;
  hugMaxDeposit: number;
  isHugEligible: boolean;
  auctionProceeds: number;
  auctionRecovery: number;
  auctionShortfall: number;
  /** 낙찰가율 가정별 회수 추정 (AUCTION_RATE_SCENARIOS 순서) */
  auctionScenarios: AuctionScenario[];
  safeDepositCap: number;
}

// 낙찰가율은 단일 상수로 못 박으면 가정이 사실처럼 읽힌다. 시나리오를 함수로 뽑아
// 대표값과 밴드가 같은 식을 쓰게 한다 — 둘이 갈라지면 화면과 산문이 어긋난다.
function auctionScenarioAt(rate: number, marketPrice: number, deposit: number, seniorDebt: number): AuctionScenario {
  const proceeds = Math.round(marketPrice * rate);
  const recovery = Math.min(deposit, Math.max(0, proceeds - seniorDebt));
  return { rate, proceeds, recovery, shortfall: deposit - recovery };
}

function riskLevelOf(debtRatio: number): JeonseRiskLevel {
  if (debtRatio >= RISK_SEVERE_RATIO) return "severe";
  if (debtRatio >= RISK_DANGER_RATIO) return "danger";
  if (debtRatio >= RISK_CAUTION_RATIO) return "caution";
  return "safe";
}

export function calculateJeonseRisk(input: JeonseRiskInput): JeonseRiskResult {
  const marketPrice = Math.max(0, input.marketPrice);
  const deposit = Math.max(0, input.jeonseDeposit);
  const seniorDebt = Math.max(0, input.seniorDebt);
  const hugLimit = input.isMetropolitan ? HUG_LIMIT_METRO : HUG_LIMIT_OTHER;

  if (marketPrice <= 0) {
    return {
      isSupported: false,
      jeonseRatio: 0,
      debtRatio: 0,
      riskLevel: "safe",
      hugLimit,
      hugMaxDeposit: 0,
      isHugEligible: false,
      auctionProceeds: 0,
      auctionRecovery: 0,
      auctionShortfall: deposit,
      auctionScenarios: AUCTION_RATE_SCENARIOS.map((rate) => ({
        rate,
        proceeds: 0,
        recovery: 0,
        shortfall: deposit,
      })),
      safeDepositCap: 0,
    };
  }

  const jeonseRatio = deposit / marketPrice;
  const debtRatio = (deposit + seniorDebt) / marketPrice;

  // HUG 가입 가능 상한 = 주택가격 × 담보인정비율(90%) − 선순위 채권, 지역 한도로 캡
  const collateralCap = Math.max(0, Math.round(marketPrice * HUG_COLLATERAL_RATIO) - seniorDebt);
  const hugMaxDeposit = Math.min(collateralCap, hugLimit);
  const isHugEligible = deposit > 0 && deposit <= hugMaxDeposit;

  // 낙찰가율 가정 회수 추정 — 낙찰 대금에서 선순위가 먼저 배당받는 구조의 단순화.
  // 하나의 낙찰가율만 보여주면 그 값이 관측된 사실처럼 읽히므로 밴드로 함께 낸다.
  const auctionScenarios = AUCTION_RATE_SCENARIOS.map((rate) =>
    auctionScenarioAt(rate, marketPrice, deposit, seniorDebt));
  const representative = auctionScenarioAt(AUCTION_RATE_ASSUMPTION, marketPrice, deposit, seniorDebt);
  const auctionProceeds = representative.proceeds;
  const auctionRecovery = representative.recovery;
  const auctionShortfall = representative.shortfall;

  // 부채비율 70% 이내가 되는 보증금 상한 제안
  const safeDepositCap = Math.max(0, Math.round(marketPrice * RISK_CAUTION_RATIO) - seniorDebt);

  return {
    isSupported: true,
    jeonseRatio,
    debtRatio,
    riskLevel: riskLevelOf(debtRatio),
    hugLimit,
    hugMaxDeposit,
    isHugEligible,
    auctionProceeds,
    auctionRecovery,
    auctionShortfall,
    auctionScenarios,
    safeDepositCap,
  };
}
