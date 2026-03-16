export const HOUSE_DATA_UPDATED = "2026-03-15";
export const HOUSE_DATA_VERIFIED = "2026-03-15";

export const LEGAL_DELAY_INTEREST_RATE = 0.12;
export const DELAY_INTEREST_DATA_UPDATED = "2026-03-15";

export const DEPOSIT_PRESETS = [
  100_000_000,
  300_000_000,
  500_000_000,
  1_000_000_000,
] as const;

export const OVERDUE_DAY_PRESETS = [30, 60, 90, 180] as const;

export const DELAY_INTEREST_SOURCES = [
  {
    name: "국가법령정보센터",
    url: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=114845",
    basis: "소송촉진 등에 관한 특례법상 법정이율 연 12%",
  },
] as const;

export const DELAY_INTEREST_FAQS = [
  {
    q: "왜 연 12%로 계산하나요?",
    a: "소송촉진 등에 관한 특례법 제3조제1항 본문의 법정이율 규정은 대통령령으로 정하는 이율을 연 12%로 둡니다. 이 계산기는 그 기준을 가정한 참고용 계산기입니다.",
  },
  {
    q: "계약 종료일 다음날부터 바로 12%가 적용되나요?",
    a: "사안에 따라 적용 시작 시점이 다를 수 있습니다. 실무에서는 소송 제기 또는 지급명령 송달 이후 12% 지연손해금을 청구하는 경우가 많으므로, 반드시 본인 사건 기준일을 확인해야 합니다.",
  },
  {
    q: "대출이자나 이사비도 함께 청구할 수 있나요?",
    a: "가능 여부는 별도 손해 입증과 인과관계에 따라 달라집니다. 이 계산기는 법정 지연이자만 계산합니다.",
  },
] as const;
