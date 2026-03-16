export type BrokerageDealType = "sale" | "jeonse" | "monthly";

export interface BrokerageTier {
  min: number;
  max: number | null;
  rate: number;
  cap: number | null;
  label: string;
}

export const BROKERAGE_DATA_UPDATED = "2026-03-15";

export const BROKERAGE_SOURCES = [
  {
    name: "서울시 부동산중개업정보",
    url: "https://land.seoul.go.kr/land/broker/brokerageCommission.do",
    basis: "주택 중개보수 요율표 및 월세 환산 규정 확인",
  },
] as const;

export const SALE_PRICE_PRESETS = [
  400_000_000,
  650_000_000,
  900_000_000,
  1_200_000_000,
] as const;

export const RENT_DEPOSIT_PRESETS = [
  30_000_000,
  50_000_000,
  100_000_000,
  300_000_000,
] as const;

export const MONTHLY_RENT_PRESETS = [500_000, 800_000, 1_200_000, 2_000_000] as const;

export const SALE_BROKERAGE_TIERS: BrokerageTier[] = [
  { min: 0, max: 50_000_000, rate: 0.006, cap: 250_000, label: "5천만원 미만" },
  { min: 50_000_000, max: 200_000_000, rate: 0.005, cap: 800_000, label: "5천만원 이상~2억원 미만" },
  { min: 200_000_000, max: 900_000_000, rate: 0.004, cap: null, label: "2억원 이상~9억원 미만" },
  { min: 900_000_000, max: 1_200_000_000, rate: 0.005, cap: null, label: "9억원 이상~12억원 미만" },
  { min: 1_200_000_000, max: 1_500_000_000, rate: 0.006, cap: null, label: "12억원 이상~15억원 미만" },
  { min: 1_500_000_000, max: null, rate: 0.007, cap: null, label: "15억원 이상" },
] as const;

export const RENT_BROKERAGE_TIERS: BrokerageTier[] = [
  { min: 0, max: 50_000_000, rate: 0.005, cap: 200_000, label: "5천만원 미만" },
  { min: 50_000_000, max: 100_000_000, rate: 0.004, cap: 300_000, label: "5천만원 이상~1억원 미만" },
  { min: 100_000_000, max: 600_000_000, rate: 0.003, cap: null, label: "1억원 이상~6억원 미만" },
  { min: 600_000_000, max: 1_200_000_000, rate: 0.004, cap: null, label: "6억원 이상~12억원 미만" },
  { min: 1_200_000_000, max: 1_500_000_000, rate: 0.005, cap: null, label: "12억원 이상~15억원 미만" },
  { min: 1_500_000_000, max: null, rate: 0.006, cap: null, label: "15억원 이상" },
] as const;

export const BROKERAGE_FAQS = [
  {
    q: "월세 거래금액은 어떻게 계산하나요?",
    a: "서울시 안내 기준에 따라 보증금 + 월세×100으로 환산하고, 합산액이 5천만원 미만이면 보증금 + 월세×70을 사용합니다.",
  },
  {
    q: "표시된 금액이 실제 내가 내는 확정 수수료인가요?",
    a: "아니요. 거래금액×상한요율 이내에서 의뢰인과 중개사가 협의해 결정하며, 이 계산기는 의뢰인 1인 기준 최대 상한만 보여줍니다.",
  },
  {
    q: "지역마다 요율이 같나요?",
    a: "이 계산기는 2026년 3월 15일 확인한 서울시 주택 중개보수 표를 기준으로 합니다. 타 지자체는 해당 조례를 함께 확인하세요.",
  },
] as const;
