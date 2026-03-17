export const FIRST_HOME_UPDATED = "2026-03-17";

export const FIRST_HOME_SOURCES = [
  {
    name: "행정안전부 고시",
    url: "https://www.law.go.kr/conAdmrulByLsPop.do?lsiSeq=238819",
    basis: "생애최초 주택 구입에 대한 취득세 감면 운영기준",
  },
  {
    name: "주택도시기금",
    url: "https://nhuf.molit.go.kr/FP/FP05/FP0503/FP05030104.jsp",
    basis: "내집마련 디딤돌대출 유한책임대출 안내",
  },
] as const;

export const FIRST_HOME_FAQS = [
  {
    q: "취득세 감면은 얼마까지 반영하나요?",
    a: "생애최초 구입이면서 주택가액 12억원 이하인 경우를 전제로 취득세 산출세액 중 최대 200만원 감면을 참고 계산합니다.",
  },
  {
    q: "디딤돌 한도는 왜 소득 7천만원 기준인가요?",
    a: "주택도시기금 안내 기준상 생애최초 일반구입자는 부부합산 연소득 7천만원 이하 조건을 충족해야 하므로 해당 기준을 기본 전제로 반영했습니다.",
  },
  {
    q: "규제지역을 켜면 왜 한도가 줄어드나요?",
    a: "생애최초라도 수도권·규제지역은 LTV 70%를 적용하는 경우가 있어 비규제지역 기본값 80%보다 보수적으로 계산합니다.",
  },
] as const;
