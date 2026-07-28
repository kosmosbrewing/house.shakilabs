// 파라미터 프리셋 페이지 전용 SEO 가이드 빌더
// 프리셋 축 증량 시 "숫자만 바꾼 페이지 양산" 게이트를 지키기 위해,
// 파라미터마다 실제 계산 결과로 본문·FAQ를 생성해 페이지별 고유 해석을 보장한다.
// vite-ssg 빌드 시점에 실행되는 순수 함수라 SSR 안전.
import type { GuideData } from "@/data/seoGuides";
import {
  CIVIL_DELAY_INTEREST_RATE,
  LITIGATION_DELAY_INTEREST_RATE,
} from "@/data/delayInterest";
import { DEFAULT_PROPERTY_TAX_INPUT } from "@/lib/housingValidators";
import { calculateDelayInterest, calculatePropertyTax } from "@/utils/housingCalculator";
import { formatManWon, formatWon } from "@/lib/utils";

const DELAY_PERIODS = [30, 90, 180, 365] as const;

const PARAM_DISCLAIMER =
  "※ 본 페이지의 수치는 입력 전제(단순 이율 계산·1세대 1주택 단독소유 등)에 따른 참고용 추정입니다. 실제 적용 이율·세액은 계약 내용, 소송 경과, 법령 개정, 지자체 조례에 따라 달라질 수 있으므로 관계기관 또는 전문가에게 확인하시기 바랍니다.";

function delayInterestByPeriods(depositWon: number, annualRate: number): string[] {
  return DELAY_PERIODS.map((days) =>
    formatWon(
      Math.round(
        calculateDelayInterest({ depositAmount: depositWon, overdueDays: days, annualRate })
          .totalInterest,
      ),
    ),
  );
}

// 보증금 프리셋(/delay-interest/:deposit) — 보증금별 기간×이율단계 조견 + 규모별 실무 해석
export function buildDelayDepositGuide(depositWon: number): GuideData {
  const label = formatManWon(depositWon / 10000);
  const civil = delayInterestByPeriods(depositWon, CIVIL_DELAY_INTEREST_RATE);
  const litigation = delayInterestByPeriods(depositWon, LITIGATION_DELAY_INTEREST_RATE);
  const dailyCivil = formatWon(Math.round((depositWon * CIVIL_DELAY_INTEREST_RATE) / 365));
  const dailyLitigation = formatWon(Math.round((depositWon * LITIGATION_DELAY_INTEREST_RATE) / 365));
  const monthlyLitigation = formatWon(Math.round((depositWon * LITIGATION_DELAY_INTEREST_RATE) / 12));
  const isLargeDeposit = depositWon >= 100_000_000;

  return {
    title: `보증금 ${label}원 반환 지연이자 가이드 (2026년)`,
    intro: `계약이 끝났는데 보증금 ${label}원을 돌려받지 못하고 있다면, 지연 기간에 따라 법정이자를 청구할 수 있습니다. 이 페이지는 보증금 ${label}원 기준으로 약정이 없을 때의 민법상 연 5%와, 소장 등이 송달된 다음 날부터 적용되는 소송촉진법상 연 12%를 기간별로 계산한 결과입니다.`,
    sections: [
      {
        h2: `보증금 ${label}원의 기간별 예상 지연이자`,
        body: `민법상 연 5% 기준으로 30일 지연 시 ${civil[0]}, 90일 ${civil[1]}, 180일 ${civil[2]}, 1년 ${civil[3]}입니다. 소송촉진법상 연 12%가 적용되는 구간에서는 30일 ${litigation[0]}, 90일 ${litigation[1]}, 180일 ${litigation[2]}, 1년이면 ${litigation[3]}까지 늘어납니다. 하루 단위로는 5% 기준 약 ${dailyCivil}, 12% 기준 약 ${dailyLitigation}씩 이자가 쌓입니다.`,
      },
      {
        h2: "월세로 환산해 본 실질 손해",
        body: `보증금 ${label}원이 묶여 있는 동안 연 12% 기준 월 환산 이자는 약 ${monthlyLitigation}입니다. 반환이 늦어질수록 이 금액만큼의 기회비용이 매달 발생하는 셈이므로, 임대인과 협의할 때 "지연이자까지 청구할 수 있다"는 점을 근거로 제시하면 반환 협상에 실질적인 압박이 됩니다.`,
      },
      {
        h2: `이 금액대의 실무 대응 순서`,
        body: isLargeDeposit
          ? `보증금 ${label}원 규모라면 이사해야 할 때 임차권등기명령을 먼저 신청해 대항력·우선변제권을 유지하는 것이 최우선입니다. 이후 내용증명으로 반환과 지연이자 청구 의사를 밝히고, 응하지 않으면 지급명령 또는 보증금반환소송으로 진행합니다. 이 규모에서는 소송비용을 감안해도 연 12% 지연이자의 실익이 충분한 편이지만, 임대인의 자력(재산) 확인이 병행되어야 합니다.`
          : `보증금 ${label}원 규모라면 소송보다 내용증명과 지급명령 절차가 비용 대비 효율적입니다. 지급명령은 인지대·송달료 부담이 적고, 임대인이 2주 내 이의하지 않으면 확정판결과 같은 효력이 생깁니다. 이사가 필요하다면 임차권등기명령으로 우선변제권을 유지한 뒤 절차를 진행하는 것이 안전합니다.`,
      },
    ],
    faqs: [
      {
        q: `보증금 ${label}원을 6개월(180일) 동안 못 받으면 이자가 얼마인가요?`,
        a: `약정이 없을 때 민법상 연 5% 기준 약 ${civil[2]}, 소장 등이 송달된 다음 날부터 적용되는 소송촉진법상 연 12% 기준 약 ${litigation[2]}입니다. 실제 적용 이율은 청구 단계에 따라 달라집니다.`,
      },
      {
        q: `보증금 ${label}원 기준, 연 12% 이자는 언제부터 붙나요?`,
        a: `소송촉진법상 연 12%는 계약 종료일이 아니라 소장 또는 이에 준하는 서면이 임대인에게 송달된 다음 날부터 적용됩니다. 그 전 구간은 약정 이율, 약정이 없으면 민법상 연 5%(하루 약 ${dailyCivil})로 계산하는 것이 원칙입니다.`,
      },
    ],
    disclaimer: PARAM_DISCLAIMER,
  };
}

// 시가 프리셋(/property-tax/:price) — 가액별 과표·세액 분해 + 종부세 대상 여부 해석
export function buildPropertyTaxGuide(priceWon: number): GuideData {
  const label = formatManWon(priceWon / 10000);
  const result = calculatePropertyTax({
    ...DEFAULT_PROPERTY_TAX_INPUT,
    marketPrice: priceWon,
  });
  const officialLabel = formatWon(result.officialPrice);
  const realizationPct = `${Math.round(result.realizationRate * 100)}%`;
  const fairMarketPct = `${(result.fairMarketRatio * 100).toFixed(0)}%`;

  const compSection = result.isCompTaxSubject
    ? `시가 ${label}원의 추정 공시가격 ${officialLabel}은 종합부동산세 기본공제 12억원을 초과하므로 종부세 과세 대상입니다. 재산세 합계 ${formatWon(result.propertyTaxTotal)}에 종부세(농어촌특별세 포함) ${formatWon(result.compTaxTotal)}이 더해져 연간 보유세는 총 ${formatWon(result.annualTotal)}으로 추정됩니다. 종부세 계산에는 재산세 중복분 공제와 고령자·장기보유 세액공제가 반영됩니다.`
    : `시가 ${label}원의 추정 공시가격 ${officialLabel}은 종합부동산세 기본공제 12억원 이하이므로, 1세대 1주택 단독소유 기준 종부세는 0원입니다. 따라서 연간 보유세는 재산세 계열(재산세·도시지역분·지방교육세)만으로 ${formatWon(result.annualTotal)} 수준입니다.`;

  const rateSection = result.isSpecialRate
    ? `추정 공시가격 ${officialLabel}은 1세대 1주택 특례세율 구간(공시가격 9억원 이하)에 해당해 표준세율보다 낮은 세율(${result.propertyTaxRateLabel})이 적용됩니다. 과세표준은 공시가격에 공정시장가액비율 ${fairMarketPct}를 곱한 ${formatWon(result.propertyTaxBase)}입니다.`
    : `추정 공시가격 ${officialLabel}은 1세대 1주택 특례세율 구간(공시가격 9억원 이하)을 초과해 표준세율(${result.propertyTaxRateLabel})이 적용됩니다. 과세표준은 공시가격에 공정시장가액비율 ${fairMarketPct}를 곱한 ${formatWon(result.propertyTaxBase)}입니다.`;

  return {
    title: `시가 ${label}원 아파트 보유세 상세 가이드 (2026년)`,
    intro: `시가 ${label}원 아파트를 1세대 1주택 단독명의로 보유할 때의 재산세·종합부동산세 추정 결과를 단계별로 풀어놓은 페이지입니다. 공시가격을 직접 입력하면 추정 정확도가 더 높아집니다.`,
    sections: [
      {
        h2: `시가 ${label}원의 공시가격·과세표준 추정`,
        body: `공동주택 현실화율(공시가격/시세 비율)을 약 ${realizationPct}로 가정하면 시가 ${label}원의 추정 공시가격은 ${officialLabel}입니다. ${rateSection}`,
      },
      {
        h2: "재산세와 종합부동산세 분해",
        body: `재산세 본세는 ${formatWon(result.propertyTax)}이고, 도시지역분 ${formatWon(result.urbanAreaTax)}과 지방교육세 ${formatWon(result.localEducationTax)}이 함께 고지되어 재산세 계열 합계는 ${formatWon(result.propertyTaxTotal)}입니다. ${compSection}`,
      },
      {
        h2: "월 환산 부담으로 본 해석",
        body: `연간 보유세 ${formatWon(result.annualTotal)}을 12개월로 나누면 월 ${formatWon(result.monthlyEquivalent)} 수준입니다. 재산세는 7월과 9월에 절반씩 나뉘어 고지되므로, 이 금액대를 보유 중이라면 해당 월의 현금 흐름에 각각 ${formatWon(Math.round(result.propertyTaxTotal / 2))} 안팎의 지출을 미리 반영해 두는 것이 안전합니다.`,
      },
    ],
    faqs: [
      {
        q: `시가 ${label}원 아파트의 연간 보유세는 얼마인가요?`,
        a: `1세대 1주택 단독소유·공시가격 추정(현실화율 약 ${realizationPct}) 기준으로 연간 약 ${formatWon(result.annualTotal)}(월 환산 ${formatWon(result.monthlyEquivalent)})입니다. 실제 공시가격과 세부담 상한 적용 여부에 따라 달라질 수 있습니다.`,
      },
      {
        q: `시가 ${label}원이면 종합부동산세 대상인가요?`,
        a: result.isCompTaxSubject
          ? `추정 공시가격 ${officialLabel}이 기본공제 12억원을 초과해 종부세 대상입니다. 이 페이지 기준 종부세(농특세 포함)는 약 ${formatWon(result.compTaxTotal)}으로 추정됩니다.`
          : `추정 공시가격 ${officialLabel}이 기본공제 12억원 이하라 1세대 1주택 단독소유 기준으로는 종부세가 부과되지 않습니다.`,
      },
    ],
    disclaimer: PARAM_DISCLAIMER,
  };
}
