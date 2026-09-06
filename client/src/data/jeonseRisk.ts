// 깡통전세 위험 진단 상수 (2026년 기준)
// 검증일: 2026-07-28 — HUG 전세보증금반환보증 공식 안내 기준
export const JEONSE_RISK_DATA_UPDATED = "2026-07-28";

// HUG 담보인정비율 — 보증금이 주택가격의 90% 이내여야 가입 가능 (2023-05 이후 유지)
export const HUG_COLLATERAL_RATIO = 0.9;
// HUG 보증금 한도
export const HUG_LIMIT_METRO = 700_000_000;
export const HUG_LIMIT_OTHER = 500_000_000;
// 경매 회수 추정에 쓰는 낙찰가율 — 관측값이 아니라 이 계산기가 선언한 가정값이다.
// 하나의 숫자로 못 박으면 그 값이 사실처럼 읽히므로 밴드로 제시한다. 낮은 쪽 0.7은
// 위험 등급의 "주의" 문턱(RISK_CAUTION_RATIO)과, 가운데 0.75는 화면의 대표 시나리오와,
// 높은 쪽 0.8은 "위험" 문턱(RISK_DANGER_RATIO)과 같은 부등식을 만든다.
export const AUCTION_RATE_SCENARIOS = [0.7, 0.75, 0.8] as const;
// 요약 배너처럼 한 줄만 쓸 수 있는 자리에서 쓰는 가운데 시나리오
export const AUCTION_RATE_ASSUMPTION = AUCTION_RATE_SCENARIOS[1];
// 부채비율((선순위+보증금)/시세) 위험 구간 — 80% 이상 깡통전세 위험 통용, 90% 이상 매우 위험
export const RISK_CAUTION_RATIO = 0.7;
export const RISK_DANGER_RATIO = 0.8;
export const RISK_SEVERE_RATIO = 0.9;

export const JEONSE_RISK_SOURCES = [
  {
    name: "HUG 주택도시보증공사 — 전세보증금반환보증",
    url: "https://www.khug.or.kr/hug/web/ig/dr/igdr000001.jsp",
    basis: "담보인정비율 90%·보증 한도(수도권 7억, 그 외 5억)",
  },
] as const;

export const JEONSE_RISK_FAQS = [
  {
    q: "전세가율이 몇 %면 깡통전세인가요?",
    a: "통상 전세가율(보증금÷매매 시세)이 80%를 넘으면 깡통전세 위험이 크다고 보고, 90% 이상이면 매우 위험으로 봅니다. 이 계산기는 낙찰가율을 70%·75%·80% 세 가정으로 나눠 회수 추정을 보여주는데, 전세가율이 그 가정보다 높으면 해당 시나리오에서 보증금 전액 회수가 어려워지는 구조이기 때문입니다. 세 값은 관측된 낙찰 통계가 아니라 이 계산기가 선언한 가정입니다.",
  },
  {
    q: "선순위 근저당이 있으면 왜 더 위험한가요?",
    a: "경매 배당에서 선순위 채권(근저당 등)이 임차인보다 먼저 회수해 갑니다. 그래서 보증금만이 아니라 (선순위 채권+보증금)을 시세로 나눈 부채비율로 판단해야 하며, 이 계산기도 부채비율을 기준으로 위험 등급을 매깁니다.",
  },
  {
    q: "HUG 전세보증금반환보증은 언제 가입하지 못하나요?",
    a: "보증금이 주택가격의 90%(담보인정비율)에서 선순위 채권을 뺀 금액을 넘거나, 보증금이 수도권 7억원·그 외 지역 5억원 한도를 초과하면 가입할 수 없습니다. 계약 전에 가입 가능 여부를 먼저 확인하는 것이 안전합니다.",
  },
] as const;
