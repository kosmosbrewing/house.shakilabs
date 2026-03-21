/** 임대수익률 계산기 상수 (2026-03-20 기준) */

export const RENTAL_YIELD_UPDATED = "2026-03-20";

/** 매매가 프리셋 (원) */
export const PURCHASE_PRICE_PRESETS = [
  { label: "3억", value: 300_000_000 },
  { label: "5억", value: 500_000_000 },
  { label: "7억", value: 700_000_000 },
  { label: "10억", value: 1_000_000_000 },
  { label: "15억", value: 1_500_000_000 },
] as const;

/** 대출금리 프리셋 */
export const LOAN_RATE_PRESETS = [
  { label: "3.5%", value: 0.035 },
  { label: "4.0%", value: 0.04 },
  { label: "4.5%", value: 0.045 },
  { label: "5.0%", value: 0.05 },
] as const;

/** 공실률 프리셋 */
export const VACANCY_RATE_PRESETS = [
  { label: "없음", value: 0 },
  { label: "5%", value: 0.05 },
  { label: "10%", value: 0.1 },
  { label: "20%", value: 0.2 },
] as const;

export const RENTAL_YIELD_FAQS: readonly { q: string; a: string }[] = [
  {
    q: "임대수익률이란 무엇인가요?",
    a: "임대수익률은 부동산 투자 시 매입가 대비 연간 임대수입 비율입니다. 총수익률(gross)은 경비를 빼지 않은 것이고, 순수익률(net)은 관리비·공실손실·대출이자 등 모든 비용을 차감한 실질 수익률입니다.",
  },
  {
    q: "자기자본수익률(ROE)은 무엇인가요?",
    a: "자기자본수익률(ROE, Return on Equity)은 실제 투입한 자기자본 대비 순수익 비율입니다. 대출을 활용하면 총투자금 대비 수익률보다 ROE가 높아질 수 있는데, 이를 레버리지 효과라 합니다.",
  },
  {
    q: "적정 임대수익률은 얼마인가요?",
    a: "서울 아파트 기준 순수익률 2~3%, 지방·오피스텔은 4~6% 수준이 일반적입니다. 은행 예금금리(3~4%)를 상회해야 투자 의미가 있고, 공실·수리비 등 리스크 프리미엄을 고려하면 예금금리 + 2%p 이상이 권장됩니다.",
  },
  {
    q: "보증금(전세금)은 수익률에 어떻게 반영되나요?",
    a: "보증금은 임차인에게 받는 목돈으로 실질적으로 투자금을 줄이는 효과가 있습니다. 이 계산기에서는 보증금을 총투자금에서 차감하여 자기자본수익률(ROE) 계산에 반영합니다.",
  },
] as const;

export const RENTAL_YIELD_SOURCES = [
  {
    name: "국토교통부",
    url: "https://www.molit.go.kr/",
    basis: "부동산 시장 정보",
  },
  {
    name: "한국부동산원",
    url: "https://www.reb.or.kr/",
    basis: "임대시장 동향 통계",
  },
] as const;
