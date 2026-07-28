import {
  AUCTION_RATE_ASSUMPTION,
  HUG_COLLATERAL_RATIO,
  HUG_LIMIT_METRO,
  HUG_LIMIT_OTHER,
  RISK_CAUTION_RATIO,
  RISK_DANGER_RATIO,
  RISK_SEVERE_RATIO,
} from "@/data/jeonseRisk";

export type JeonseRiskLevel = "safe" | "caution" | "danger" | "severe";

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
  safeDepositCap: number;
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
      safeDepositCap: 0,
    };
  }

  const jeonseRatio = deposit / marketPrice;
  const debtRatio = (deposit + seniorDebt) / marketPrice;

  // HUG 가입 가능 상한 = 주택가격 × 담보인정비율(90%) − 선순위 채권, 지역 한도로 캡
  const collateralCap = Math.max(0, Math.round(marketPrice * HUG_COLLATERAL_RATIO) - seniorDebt);
  const hugMaxDeposit = Math.min(collateralCap, hugLimit);
  const isHugEligible = deposit > 0 && deposit <= hugMaxDeposit;

  // 낙찰가율 가정 회수 추정 — 낙찰 대금에서 선순위가 먼저 배당받는 구조의 단순화
  const auctionProceeds = Math.round(marketPrice * AUCTION_RATE_ASSUMPTION);
  const auctionRecovery = Math.min(deposit, Math.max(0, auctionProceeds - seniorDebt));
  const auctionShortfall = deposit - auctionRecovery;

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
    safeDepositCap,
  };
}
