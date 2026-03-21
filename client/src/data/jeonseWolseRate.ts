/** 전월세 전환율 계산기 상수 (2026-03-20 기준) */

export const JEONSE_WOLSE_RATE_UPDATED = "2026-03-20";

/** 한국은행 기준금리 (2026.03 기준 2.5%) */
export const BOK_BASE_RATE = 0.025;

/** 법정 전환율 상한 가산 금리 (주택임대차보호법 시행령 §9) */
export const LEGAL_RATE_SPREAD = 0.02;

/** 법정 전환율 상한 = 기준금리 + 가산금리 */
export const LEGAL_CONVERSION_RATE_CAP = BOK_BASE_RATE + LEGAL_RATE_SPREAD; // 0.045 (4.5%)

/** 전세보증금 프리셋 (원) */
export const JEONSE_DEPOSIT_PRESETS = [
  { label: "1억", value: 100_000_000 },
  { label: "2억", value: 200_000_000 },
  { label: "3억", value: 300_000_000 },
  { label: "5억", value: 500_000_000 },
] as const;

/** 보증금 조정 시뮬레이션 단위 (원) */
export const DEPOSIT_ADJUST_STEPS = [
  10_000_000, 30_000_000, 50_000_000, 100_000_000,
] as const;

export const JEONSE_WOLSE_RATE_FAQS: readonly { q: string; a: string }[] = [
  {
    q: "전월세 전환율이란 무엇인가요?",
    a: "전월세 전환율은 전세 보증금과 월세 보증금의 차액 대비 연간 월세 비율입니다. 전세에서 월세로, 또는 월세에서 전세로 전환할 때 적정 금액을 판단하는 기준이 됩니다.",
  },
  {
    q: "법정 전환율 상한은 어떻게 정해지나요?",
    a: "주택임대차보호법 시행령 제9조에 따라 한국은행 기준금리 + 2%p로 정해집니다. 2026년 3월 기준 기준금리 2.5%이므로 법정 상한은 4.5%입니다.",
  },
  {
    q: "전환율이 법정 상한을 초과하면 어떻게 되나요?",
    a: "법정 상한 전환율을 초과하는 부분은 무효이며, 세입자는 초과분의 반환을 청구할 수 있습니다. 다만 이는 임대인이 직접 전환하는 경우에 적용되며, 새 계약 시 자유롭게 정할 수 있습니다.",
  },
  {
    q: "적정 월세는 어떻게 계산하나요?",
    a: "적정 월세 = (전세 보증금 - 월세 보증금) x 법정 전환율 / 12 로 계산합니다. 법정 전환율 상한 이내의 월세가 적정한 수준입니다.",
  },
] as const;

export const JEONSE_WOLSE_RATE_SOURCES = [
  {
    name: "한국은행",
    url: "https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643",
    basis: "기준금리 2.5% (2026.03)",
  },
  {
    name: "법제처 국가법령정보센터",
    url: "https://www.law.go.kr/",
    basis: "주택임대차보호법 시행령 §9 (전환율 상한)",
  },
] as const;
