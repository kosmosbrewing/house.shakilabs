// 주택 취득세 관련 세율·상수 (2026년 기준)

export const ACQUISITION_TAX_UPDATED = "2026-03-19";

// ── 기본 취득세율 (지방세법 제11조) ──
// 6억 이하 1%, 6~9억 점진 1~3%, 9억 초과 3%
export const BASE_RATE_THRESHOLDS = {
  low: 600_000_000,
  high: 900_000_000,
  lowRate: 0.01,
  highRate: 0.03,
} as const;

// ── 다주택 중과세율 ──
export const MULTI_HOME_RATES = {
  // 조정대상지역
  regulated2: 0.08,
  regulated3: 0.12,
  // 비조정대상지역
  nonRegulated2: -1, // 기본세율 적용 (중과 없음)
  nonRegulated3: 0.08,
} as const;

// ── 지방교육세: 기본세율분 × 10% ──
export const LOCAL_EDUCATION_RATE = 0.1;

// ── 농어촌특별세: 85㎡ 초과 시 세율분 × 10%, 중과 시 중과분 × 20% ──
export const RURAL_TAX_AREA_THRESHOLD = 85;
export const RURAL_TAX_BASE_RATE = 0.1;
export const RURAL_TAX_SURCHARGE_RATE = 0.2;

export type HomeCount = 1 | 2 | 3;

// ── 프리셋 ──
export const PURCHASE_PRICE_PRESETS = [
  300_000_000,
  600_000_000,
  900_000_000,
  1_500_000_000,
] as const;

// ── 출처 ──
export const ACQUISITION_TAX_SOURCES = [
  {
    name: "지방세법 제11조, 제13조의2",
    url: "https://www.law.go.kr/법령/지방세법",
    basis: "취득세 세율, 다주택자 중과세율",
  },
  {
    name: "위택스 취득세 안내",
    url: "https://www.wetax.go.kr/main/?cmd=LPTIIA0R0",
    basis: "취득세 신고·납부 안내, 세율표",
  },
] as const;

// ── FAQ ──
export const ACQUISITION_TAX_FAQS = [
  {
    q: "6억~9억 사이 취득세율은 어떻게 계산하나요?",
    a: "6억~9억원 구간은 점진적으로 세율이 증가합니다. 공식: (매매가/1억 × 2/3 - 3) / 100. 예를 들어 7.5억은 약 2% 세율이 적용됩니다.",
  },
  {
    q: "다주택자 중과세율은 언제 적용되나요?",
    a: "조정대상지역에서 2주택자는 8%, 3주택 이상은 12% 세율이 적용됩니다. 비조정지역은 2주택까지 기본세율, 3주택 이상부터 8%가 적용됩니다.",
  },
  {
    q: "농어촌특별세는 언제 부과되나요?",
    a: "전용면적 85㎡(약 25.7평)를 초과하는 주택에 부과됩니다. 85㎡ 이하 주택은 농어촌특별세가 면제됩니다.",
  },
  {
    q: "지방교육세는 중과세율에도 동일하게 부과되나요?",
    a: "지방교육세는 기본세율분에 대해서만 10%가 적용됩니다. 중과세율이 적용되더라도 지방교육세는 기본세율(1~3%) 기준으로 계산됩니다.",
  },
] as const;
