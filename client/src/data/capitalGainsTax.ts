// 양도소득세 관련 세율·공제·상수 (2026년 기준)

export const CAPITAL_GAINS_TAX_UPDATED = "2026-09-06";

// ── 1세대1주택 비과세 기준 (2022.1.1 이후 양도분) ──
export const ONE_HOUSE_EXEMPT_THRESHOLD = 1_200_000_000;

// ── 기본공제 (연 1회) ──
export const BASIC_DEDUCTION = 2_500_000;

// ── 보유기간별 단기양도 중과세율 ──
export const SHORT_TERM_RATES = {
  lessThan1Year: 0.7,
  lessThan2Years: 0.6,
} as const;

// ── 소득세 누진세율 (소득세법 제55조) ──
export interface IncomeTaxTier {
  min: number;
  max: number | null;
  rate: number;
  deduction: number;
  label: string;
}

export const INCOME_TAX_TIERS: IncomeTaxTier[] = [
  { min: 0, max: 14_000_000, rate: 0.06, deduction: 0, label: "1,400만원 이하" },
  { min: 14_000_000, max: 50_000_000, rate: 0.15, deduction: 1_260_000, label: "1,400만~5,000만원" },
  { min: 50_000_000, max: 88_000_000, rate: 0.24, deduction: 5_760_000, label: "5,000만~8,800만원" },
  { min: 88_000_000, max: 150_000_000, rate: 0.35, deduction: 15_440_000, label: "8,800만~1.5억원" },
  { min: 150_000_000, max: 300_000_000, rate: 0.38, deduction: 19_940_000, label: "1.5억~3억원" },
  { min: 300_000_000, max: 500_000_000, rate: 0.40, deduction: 25_940_000, label: "3억~5억원" },
  { min: 500_000_000, max: 1_000_000_000, rate: 0.42, deduction: 35_940_000, label: "5억~10억원" },
  { min: 1_000_000_000, max: null, rate: 0.45, deduction: 65_940_000, label: "10억원 초과" },
];

// ── 장기보유특별공제: 표 1 (소득세법 제95조② 본문) ──
// 보유 3년 이상 4년 미만 6%부터 15년 이상 30%까지 연 2%씩 — 표를 그대로 옮기면 연 2%·상한 30%다.
export const GENERAL_LONG_HOLD_RATE_PER_YEAR = 0.02;
export const GENERAL_LONG_HOLD_MAX = 0.3;
export const GENERAL_LONG_HOLD_MIN_YEARS = 3;

// ── 장기보유특별공제: 표 2 (소득세법 제95조② 단서, 1세대 1주택) ──
// 보유 3~4년 12%부터 10년 이상 40%까지 연 4%, 거주 2~3년 8%부터 10년 이상 40%까지 연 4%.
// 거주기간별 공제는 표 2에서도 "2년 이상 3년 미만"부터 시작하므로 거주 1년의 공제는 0이다.
export const ONE_HOUSE_HOLD_RATE_PER_YEAR = 0.04;
export const ONE_HOUSE_HOLD_MAX = 0.4;
export const ONE_HOUSE_RESIDE_RATE_PER_YEAR = 0.04;
export const ONE_HOUSE_RESIDE_MAX = 0.4;
export const ONE_HOUSE_LONG_HOLD_MIN_YEARS = 3;

/**
 * 표 2를 쓰려면 거주기간이 2년 이상이어야 한다 — 소득세법 시행령 제159조의4.
 *
 * 원문: "법 제95조제2항 표 외의 부분 단서 … 에서 "대통령령으로 정하는 1세대 1주택"이란
 *        각각 1세대가 양도일 … 현재 국내에 1주택 … 을 보유하고 보유기간 중 거주기간이
 *        2년 이상인 것을 말한다."
 *
 * 즉 1주택이라도 거주 2년을 못 채우면 표 2(최대 80%)가 아니라 표 1(최대 30%)이 적용된다.
 * 이 요건을 빠뜨리면 거주 없이 오래 보유한 사례에서 세금을 과소 추정하게 된다.
 */
export const ONE_HOUSE_TABLE2_MIN_RESIDENCE_YEARS = 2;

// ── 프리셋 ──
export const SELL_PRICE_PRESETS = [
  500_000_000,
  800_000_000,
  1_200_000_000,
  2_000_000_000,
] as const;

// ── 출처 ──
export const CAPITAL_GAINS_TAX_SOURCES = [
  {
    name: "소득세법 제94조~제118조의18",
    url: "https://www.law.go.kr/법령/소득세법",
    basis: "양도소득세 과세 대상, 세율, 장기보유특별공제",
  },
  {
    name: "소득세법 시행령 제159조의4",
    url: "https://www.law.go.kr/법령/소득세법 시행령/제159조의4",
    basis: "장기보유특별공제 표 2 적용 대상 1세대 1주택의 거주기간 2년 이상 요건",
  },
  {
    name: "국세청 양도소득세 안내",
    url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2312&cntntsId=7711",
    basis: "1세대1주택 비과세 요건, 장기보유특별공제율",
  },
] as const;

// ── FAQ ──
export const CAPITAL_GAINS_TAX_FAQS = [
  {
    q: "1세대 1주택 비과세란 무엇인가요?",
    a: "2년 이상 보유한 1세대 1주택을 양도할 때, 양도가 12억원 이하 부분은 비과세됩니다. 조정대상지역에서 취득한 경우 2년 거주 조건이 추가됩니다.",
  },
  {
    q: "장기보유특별공제는 어떻게 적용되나요?",
    a: "표 1(3년 이상 보유 시 연 2%, 최대 30%)이 원칙이고, 1세대 1주택이면서 보유기간 중 거주기간이 2년 이상이면 표 2(보유 연 4% 최대 40% + 거주 연 4% 최대 40% = 최대 80%)가 적용됩니다. 1주택이라도 거주 2년을 채우지 못하면 표 2가 아니라 표 1을 적용하므로 최대 30%에 그칩니다.",
  },
  {
    q: "2년 미만 보유하면 세율이 높아지나요?",
    a: "네. 1년 미만 보유 시 70%, 1~2년 미만 보유 시 60%의 단일세율이 적용됩니다. 2년 이상 보유하면 기본 누진세율(6~45%)이 적용되어 유리합니다.",
  },
  {
    q: "필요경비에는 무엇이 포함되나요?",
    a: "취득 시 취득세, 중개수수료, 법무사 비용과 보유 중 인테리어비, 시설 개량비 등이 포함됩니다. 증빙이 없으면 환산취득가액 또는 기준시가를 적용합니다.",
  },
  {
    q: "12억 초과 1주택은 어떻게 과세되나요?",
    a: "양도가 12억원 초과분에 해당하는 양도차익에만 과세됩니다. 예: 양도가 15억, 양도차익 3억이면 과세 양도차익은 3억 × (15억-12억)/15억 = 6,000만원입니다.",
  },
] as const;
