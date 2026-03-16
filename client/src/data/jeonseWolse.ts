export const JEONSE_WOLSE_DATA_UPDATED = "2026-03-15";

export const OPPORTUNITY_RATE_PRESETS = [0.02, 0.03, 0.035, 0.04, 0.05] as const;

export const JEONSE_WOLSE_SOURCES = [
  {
    name: "한국은행 경제통계시스템",
    url: "https://ecos.bok.or.kr/",
    basis: "기회비용 금리 참고 (예금금리·대출금리)",
  },
] as const;

export const JEONSE_WOLSE_FAQS = [
  {
    q: "전세와 월세를 무엇으로 비교하나요?",
    a: "전세는 보증금을 다른 곳에 두지 못하는 기회비용, 월세는 월 임대료와 보증금 기회비용을 합산해서 비교합니다.",
  },
  {
    q: "기회비용 금리는 무엇을 넣어야 하나요?",
    a: "내 실제 대출금리, 예적금 기대수익률, 또는 보수적으로 잡은 목표수익률을 넣으면 됩니다. 값이 높을수록 전세의 부담이 커집니다.",
  },
  {
    q: "이 계산기로 이사비나 관리비까지 판단할 수 있나요?",
    a: "아니요. 이 계산기는 순수한 보증금과 월세 흐름만 비교합니다. 관리비, 대출 수수료, 이사비는 별도로 판단하세요.",
  },
] as const;
