// 계산기별 법령·조례 확인일.
//
// 하나의 날짜로 묶으면 그 자체가 거짓말이 된다. 재산세·생애최초·양도세·중개보수 조례는
// 각각 다른 날 확인했고, 다이제스트의 "계산 기준" 문단은 이미 계산기별 날짜를 적고 있다.
// 푸터와 /about이 단일 날짜 하나를 "법령·조례 확인일"이라고 공표하면 나머지가 전부 거짓이 된다.
//
// travel이 "요금 점검일"과 "환율 기준일"을 나눠 적고, seller가 "요율 개정일·요율 확인일·
// 정산주기 확인일"을 나눠 적는 것과 같은 원칙이다.
//
// 날짜는 각 계산기 데이터 파일의 상수를 그대로 가져온다 — 여기서 손으로 적으면 또 어긋난다.

import { ACQUISITION_TAX_UPDATED } from "./acquisitionTax";
import { BROKERAGE_DATA_UPDATED } from "./brokerageRates";
import { CAPITAL_GAINS_TAX_UPDATED } from "./capitalGainsTax";
import { DELAY_INTEREST_DATA_UPDATED } from "./delayInterest";
import { FIRST_HOME_UPDATED } from "./firstHome";
import { HOUSING_SUBSCRIPTION_UPDATED } from "./housingSubscription";
import { JEONSE_RISK_DATA_UPDATED } from "./jeonseRisk";
import { JEONSE_WOLSE_DATA_UPDATED } from "./jeonseWolse";
import { JEONSE_WOLSE_RATE_UPDATED } from "./jeonseWolseRate";
import { PROPERTY_TAX_UPDATED } from "./propertyTax";
import { RENTAL_YIELD_UPDATED } from "./rentalYield";

export interface VerificationDate {
  /** 날짜를 선언한 상수 이름 — 새 계산기의 확인일이 목록에서 빠지면 테스트가 이 이름으로 잡는다 */
  constant: string;
  /** 화면에 적는 주제 이름 — 계산기 이름이 아니라 "무엇의 기준값인가"로 쓴다 */
  topic: string;
  /** 근거 문서 */
  basis: string;
  date: string;
}

export const VERIFICATION_DATES: readonly VerificationDate[] = [
  { topic: "양도소득세", basis: "소득세법 제94~104조·시행령 제159조의4", date: CAPITAL_GAINS_TAX_UPDATED, constant: "CAPITAL_GAINS_TAX_UPDATED" },
  { topic: "생애최초 취득세 감면·디딤돌 한도", basis: "행정안전부 고시·주택도시기금 안내", date: FIRST_HOME_UPDATED, constant: "FIRST_HOME_UPDATED" },
  { topic: "전세보증금 위험도", basis: "주택도시보증공사 전세보증 심사 기준", date: JEONSE_RISK_DATA_UPDATED, constant: "JEONSE_RISK_DATA_UPDATED" },
  { topic: "재산세·종합부동산세", basis: "지방세법·종합부동산세법·공정시장가액비율 고시", date: PROPERTY_TAX_UPDATED, constant: "PROPERTY_TAX_UPDATED" },
  { topic: "전월세 전환율", basis: "주택임대차보호법 시행령 제9조", date: JEONSE_WOLSE_RATE_UPDATED, constant: "JEONSE_WOLSE_RATE_UPDATED" },
  { topic: "보증금 지연이자", basis: "민법 제379조·소송촉진 등에 관한 특례법", date: DELAY_INTEREST_DATA_UPDATED, constant: "DELAY_INTEREST_DATA_UPDATED" },
  { topic: "임대수익률", basis: "총수익률·순수익률·ROE 계산식", date: RENTAL_YIELD_UPDATED, constant: "RENTAL_YIELD_UPDATED" },
  { topic: "취득세", basis: "지방세법 제11조·다주택 중과세율", date: ACQUISITION_TAX_UPDATED, constant: "ACQUISITION_TAX_UPDATED" },
  { topic: "청약 가점", basis: "주택공급에 관한 규칙 별표1", date: HOUSING_SUBSCRIPTION_UPDATED, constant: "HOUSING_SUBSCRIPTION_UPDATED" },
  { topic: "중개보수", basis: "서울특별시 주택 중개보수 등에 관한 조례", date: BROKERAGE_DATA_UPDATED, constant: "BROKERAGE_DATA_UPDATED" },
  { topic: "전세 vs 월세 기회비용", basis: "기회비용 금리 입력 기반 비교식", date: JEONSE_WOLSE_DATA_UPDATED, constant: "JEONSE_WOLSE_DATA_UPDATED" },
] as const;

const sorted = [...VERIFICATION_DATES].map((entry) => entry.date).sort();

/** 푸터처럼 한 줄만 쓸 수 있는 자리에는 단일 날짜 대신 범위를 적는다. */
export const VERIFICATION_DATE_RANGE = {
  earliest: sorted[0]!,
  latest: sorted[sorted.length - 1]!,
} as const;
