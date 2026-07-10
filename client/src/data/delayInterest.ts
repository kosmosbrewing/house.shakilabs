export const HOUSE_DATA_UPDATED = "2026-03-15";
export const HOUSE_DATA_VERIFIED = "2026-03-15";

export const CIVIL_DELAY_INTEREST_RATE = 0.05;
export const LITIGATION_DELAY_INTEREST_RATE = 0.12;
export const DEFAULT_DELAY_INTEREST_RATE = CIVIL_DELAY_INTEREST_RATE;
export const DELAY_INTEREST_DATA_UPDATED = "2026-07-10";

export const DEPOSIT_PRESETS = [
  100_000_000,
  300_000_000,
  500_000_000,
  1_000_000_000,
] as const;

export const OVERDUE_DAY_PRESETS = [30, 60, 90, 180] as const;

export const DELAY_INTEREST_SOURCES = [
  {
    name: "민법 제379조",
    url: "https://law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1019616903",
    basis: "약정이나 다른 법률이 없을 때 민사 법정이율 연 5%",
  },
  {
    name: "소송촉진법 제3조",
    url: "https://law.go.kr/LSW/lsInfoP.do?ancYnChk=0&lsId=001215",
    basis: "금전 지급 판결 시 소장 등이 송달된 다음 날부터 적용하는 특례",
  },
  {
    name: "소송촉진법 법정이율 규정",
    url: "https://law.go.kr/LSW/lsInfoP.do?chrClsCd=010202&efYd=20190601&lsiSeq=208701",
    basis: "소송촉진법상 이율 연 12%",
  },
  {
    name: "대법원 98다6497 판결",
    url: "https://www.law.go.kr/LSW/precInfoP.do?precSeq=117855",
    basis: "보증금 반환과 임차목적물 반환의 동시이행 관계",
  },
] as const;

export const DELAY_INTEREST_FAQS = [
  {
    q: "5%와 12% 중 무엇을 선택하나요?",
    a: "지연손해금 약정이 있으면 약정 내용을 먼저 확인합니다. 약정이나 다른 특별 규정이 없는 민사 금전채무는 연 5%를 검토하고, 연 12%는 금전 지급을 명하는 판결에서 소장 등이 송달된 다음 날 이후 적용되는 소송촉진법상 특례입니다.",
  },
  {
    q: "계약 종료일 다음날부터 바로 12%가 적용되나요?",
    a: "아닙니다. 계약의 종료와 보증금 반환채무의 이행기, 임차목적물 반환 또는 이행제공 여부, 약정과 소송 진행 상태에 따라 시작일이 달라질 수 있습니다. 연 12%도 계약 종료일에 자동 적용되는 값이 아닙니다.",
  },
  {
    q: "대출이자나 이사비도 함께 청구할 수 있나요?",
    a: "가능 여부는 별도 손해 입증과 인과관계에 따라 달라집니다. 이 계산기는 법정 지연이자만 계산합니다.",
  },
  {
    q: "집을 아직 인도하지 않았다면 지연이자가 생기나요?",
    a: "보증금 반환과 목적물 반환은 원칙적으로 동시이행 관계이므로, 인도 또는 적법한 이행제공 여부가 지체 책임에 영향을 줄 수 있습니다. 임차권등기, 열쇠 인도, 점유 상태 등 개별 사실관계는 법률 전문가에게 확인하세요.",
  },
] as const;
