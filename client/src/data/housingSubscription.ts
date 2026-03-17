export const HOUSING_SUBSCRIPTION_UPDATED = "2026-03-17";

export const HOUSING_SUBSCRIPTION_SOURCES = [
  {
    name: "주택도시기금",
    url: "https://nhuf.molit.go.kr/FP/FP07/FP0702/FP070207.jsp",
    basis: "청약가점제 안내",
  },
  {
    name: "주택도시기금",
    url: "https://nhuf.molit.go.kr/FP/FP07/FP0702/FP07020701.jsp",
    basis: "청약가점 빠른계산기",
  },
] as const;

export const HOUSING_SUBSCRIPTION_FAQS = [
  {
    q: "청약 가점은 총 몇 점 만점인가요?",
    a: "무주택기간 32점, 부양가족수 35점, 청약통장 가입기간 17점을 합산해 총 84점 만점으로 계산합니다.",
  },
  {
    q: "무주택기간은 15년이 넘으면 더 올라가나요?",
    a: "아니요. 무주택기간 점수는 15년 이상부터 32점으로 고정됩니다.",
  },
  {
    q: "이 계산기에 감점항목도 반영되나요?",
    a: "이번 계산기는 핵심 3개 가점항목 중심의 빠른 계산기입니다. 실제 청약 전에는 소유주택수 등 세부 감점 여부를 청약 공고문으로 다시 확인해야 합니다.",
  },
] as const;
