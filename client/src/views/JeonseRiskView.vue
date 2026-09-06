<script setup lang="ts">
import { computed, ref } from "vue";
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import AdSlot from "@/components/common/AdSlot.vue";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import PopularCalculators from "@/components/house/PopularCalculators.vue";
import { ShPresetGroup, ShSummaryBanner as SummaryBanner } from "@shakilabs/ui";
import {
  AUCTION_RATE_SCENARIOS,
  JEONSE_RISK_DATA_UPDATED,
  JEONSE_RISK_FAQS,
  JEONSE_RISK_SOURCES,
} from "@/data/jeonseRisk";
import { HOUSE_JEONSE_RISK_GUIDE } from "@/data/seoGuides";
import { DEFAULT_JEONSE_RISK_INPUT } from "@/lib/housingValidators";
import { calculateJeonseRisk, type JeonseRiskLevel } from "@/utils/jeonseRiskCalculator";
import { formatNumber, formatPercent, formatWon, parseNumericInput } from "@/lib/utils";
import { mergeFaqs } from "@/lib/faqMerge";

const seoTitle = "깡통전세 위험 진단 계산기 — 전세가율·HUG 가입 판정";
const seoDescription =
  "매매 시세와 보증금, 선순위 근저당을 입력하면 전세가율·부채비율 위험 등급, 낙찰가율 70·75·80% 세 가정별 회수 추정, HUG 전세보증금반환보증 가입 가능 여부를 진단합니다.";

const marketPrice = ref(DEFAULT_JEONSE_RISK_INPUT.marketPrice);
const jeonseDeposit = ref(DEFAULT_JEONSE_RISK_INPUT.jeonseDeposit);
const seniorDebt = ref(DEFAULT_JEONSE_RISK_INPUT.seniorDebt);
const region = ref<"metro" | "other">(DEFAULT_JEONSE_RISK_INPUT.isMetropolitan ? "metro" : "other");
const isMetropolitan = computed(() => region.value === "metro");

const pricePresets = [300_000_000, 500_000_000, 700_000_000, 1_000_000_000].map((value) => ({
  label: `${formatNumber(value / 100_000_000)}억`,
  value,
}));
const depositPresets = [200_000_000, 300_000_000, 400_000_000, 500_000_000].map((value) => ({
  label: `${formatNumber(value / 100_000_000)}억`,
  value,
}));
const regionOptions = [
  { label: "수도권 (한도 7억)", value: "metro" },
  { label: "그 외 지역 (한도 5억)", value: "other" },
];

const result = computed(() =>
  calculateJeonseRisk({
    marketPrice: marketPrice.value,
    jeonseDeposit: jeonseDeposit.value,
    seniorDebt: seniorDebt.value,
    isMetropolitan: isMetropolitan.value,
  }),
);

const RISK_LABELS: Record<JeonseRiskLevel, string> = {
  safe: "비교적 안전",
  caution: "주의",
  danger: "위험",
  severe: "매우 위험",
};

const riskLabel = computed(() => RISK_LABELS[result.value.riskLevel]);
const bannerTitle = computed(() =>
  result.value.isSupported
    ? `부채비율 ${formatPercent(result.value.debtRatio, 1)} 기준 진단 결과입니다. 통상 80% 이상이면 깡통전세 위험으로 봅니다.`
    : "매매 시세를 입력하면 위험 진단이 시작됩니다.",
);

// 낙찰가율 밴드를 한 줄로 요약할 때는 "가정"이라는 말을 붙여 관측값으로 읽히지 않게 한다
const scenarioRateLabel = AUCTION_RATE_SCENARIOS.map((rate) => formatPercent(rate, 0)).join("·");
const shortfallRange = computed(() => {
  const values = result.value.auctionScenarios.map((scenario) => scenario.shortfall);
  const worst = Math.max(...values);
  const best = Math.min(...values);
  if (worst <= 0) return "세 가정 모두 없음";
  return best === worst ? formatWon(worst) : `${formatWon(best)} ~ ${formatWon(worst)}`;
});

const facts = computed(() => [
  { label: "전세가율", value: formatPercent(result.value.jeonseRatio, 1) },
  { label: "부채비율", value: formatPercent(result.value.debtRatio, 1) },
  { label: "HUG 가입", value: result.value.isHugEligible ? "가능" : "불가" },
]);

// 화면에 실제 렌더되는 병합 FAQ와 구조화 데이터를 일치시킨다 (스키마 규칙)
const mergedFaqs = mergeFaqs(JEONSE_RISK_FAQS, HOUSE_JEONSE_RISK_GUIDE.faqs);

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: mergedFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="faqJsonLd" />
  <div class="container space-y-5 py-5">
    <CalculatorPageHeader title="깡통전세 위험 진단" />

    <section class="retro-panel overflow-hidden" aria-labelledby="jeonse-risk-input-title">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 id="jeonse-risk-input-title" class="retro-title">진단 조건 입력</h2>
      </div>
      <div class="retro-panel-content">
        <CalculatorInteractionTracker
          calculator-id="jeonse_risk"
          page-path="/house/jeonse-risk"
          :can-view-result="result.isSupported"
        >
          <div class="space-y-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-3">
                <label for="risk-price" class="text-caption font-semibold text-foreground">매매 시세</label>
                <span class="retro-kbd">현재 {{ formatNumber(marketPrice) }}원</span>
              </div>
              <input
                id="risk-price"
                type="text"
                inputmode="numeric"
                class="retro-input"
                :value="marketPrice.toLocaleString('ko-KR')"
                @input="marketPrice = parseNumericInput(($event.target as HTMLInputElement).value)"
              />
              <ShPresetGroup v-model="marketPrice" :options="pricePresets" label="매매 시세 빠른 선택" />
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between gap-3">
                <label for="risk-deposit" class="text-caption font-semibold text-foreground">전세 보증금</label>
                <span class="retro-kbd">현재 {{ formatNumber(jeonseDeposit) }}원</span>
              </div>
              <input
                id="risk-deposit"
                type="text"
                inputmode="numeric"
                class="retro-input"
                :value="jeonseDeposit.toLocaleString('ko-KR')"
                @input="jeonseDeposit = parseNumericInput(($event.target as HTMLInputElement).value)"
              />
              <ShPresetGroup v-model="jeonseDeposit" :options="depositPresets" label="보증금 빠른 선택" />
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between gap-3">
                <label for="risk-debt" class="text-caption font-semibold text-foreground">선순위 채권 (근저당 채권최고액)</label>
                <span class="retro-kbd">현재 {{ formatNumber(seniorDebt) }}원</span>
              </div>
              <input
                id="risk-debt"
                type="text"
                inputmode="numeric"
                class="retro-input"
                :value="seniorDebt.toLocaleString('ko-KR')"
                @input="seniorDebt = parseNumericInput(($event.target as HTMLInputElement).value)"
              />
              <p class="text-caption leading-relaxed text-muted-foreground">
                등기부등본 을구의 근저당 채권최고액을 입력하세요. 없으면 0원.
              </p>
            </div>

            <div class="space-y-1.5">
              <span class="text-caption font-semibold text-foreground">지역 (HUG 보증 한도)</span>
              <ShPresetGroup v-model="region" :options="regionOptions" label="지역 선택" />
            </div>
          </div>
        </CalculatorInteractionTracker>
      </div>
    </section>

    <SummaryBanner
      v-if="result.isSupported"
      :title="bannerTitle"
      leader-label="위험 등급"
      :leader-value="riskLabel"
      :delta-label="`낙찰가율 ${scenarioRateLabel} 가정 부족분`"
      :delta-value="shortfallRange"
      :facts="facts"
    />

    <AdSlot slot="120006" label="광고 · top" />

    <section v-if="result.isSupported" class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">진단 상세</h2>
      </div>
      <div class="retro-panel-content space-y-2 text-caption leading-relaxed text-muted-foreground">
        <p>
          <strong class="text-foreground">경매 회수 추정:</strong>
          낙찰가율은 이 계산기가 선언한 <strong class="text-foreground">가정값</strong>이며 관측된 낙찰 통계가 아닙니다.
          하나로 못 박지 않고 {{ scenarioRateLabel }} 세 가정으로 나눠, 낙찰 대금에서 선순위 {{ formatWon(seniorDebt) }}를 먼저 뺀 회수액을 보여줍니다.
        </p>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[22rem] border-collapse text-caption">
            <caption class="sr-only">낙찰가율 가정별 회수 추정</caption>
            <thead>
              <tr class="border-b border-border/60 text-left text-foreground">
                <th scope="col" class="py-1 pr-3 font-semibold">낙찰가율 가정</th>
                <th scope="col" class="py-1 pr-3 text-right font-semibold">낙찰 대금</th>
                <th scope="col" class="py-1 pr-3 text-right font-semibold">회수 추정</th>
                <th scope="col" class="py-1 text-right font-semibold">부족분</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="scenario in result.auctionScenarios"
                :key="scenario.rate"
                class="border-b border-border/30 last:border-0"
              >
                <th scope="row" class="py-1 pr-3 text-left font-normal">{{ formatPercent(scenario.rate, 0) }}</th>
                <td class="py-1 pr-3 text-right tabular-nums">{{ formatWon(scenario.proceeds) }}</td>
                <td class="py-1 pr-3 text-right tabular-nums">{{ formatWon(scenario.recovery) }}</td>
                <td class="py-1 text-right tabular-nums">
                  <strong v-if="scenario.shortfall > 0" class="text-status-danger">{{ formatWon(scenario.shortfall) }}</strong>
                  <template v-else>없음</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          세 줄의 판정이 갈린다면 그 계약은 가정 하나에 결과가 좌우되는 구간에 있다는 뜻이므로,
          가장 보수적인 {{ formatPercent(AUCTION_RATE_SCENARIOS[0], 0) }} 줄을 기준으로 판단하는 편이 안전합니다.
        </p>
        <p>
          <strong class="text-foreground">HUG 보증 가입:</strong>
          이 집의 가입 가능 보증금 상한은 <strong class="text-foreground">{{ formatWon(result.hugMaxDeposit) }}</strong>
          (주택가격의 90% − 선순위, 지역 한도 {{ formatWon(result.hugLimit) }} 적용)이며, 현재 보증금 기준
          <strong :class="result.isHugEligible ? 'text-status-success' : 'text-status-danger'">
            {{ result.isHugEligible ? "가입 가능" : "가입 불가" }}</strong>로 판정됩니다.
        </p>
        <p>
          <strong class="text-foreground">안전 보증금 제안:</strong>
          부채비율 70% 이내가 되려면 보증금이 {{ formatWon(result.safeDepositCap) }} 이하여야 합니다.
          초과분은 감액 협상 또는 월세 전환을 검토해 보세요.
        </p>
        <p>
          <strong class="text-foreground">미반영:</strong>
          소액임차인 최우선변제, 배당 순위 세부(당해세 등), 감정가와 시세의 차이는 반영하지 않는 단순 추정입니다.
        </p>
      </div>
    </section>

    <CompareSourceFooter :sources="[...JEONSE_RISK_SOURCES]" :updated-at="JEONSE_RISK_DATA_UPDATED" />
    <FaqAccordionPanel :items="mergedFaqs" />
    <PopularCalculators />

    <SeoRichGuide
      :title="HOUSE_JEONSE_RISK_GUIDE.title"
      :intro="HOUSE_JEONSE_RISK_GUIDE.intro"
      :sections="HOUSE_JEONSE_RISK_GUIDE.sections"
      :sources="HOUSE_JEONSE_RISK_GUIDE.sources"
      :disclaimer="HOUSE_JEONSE_RISK_GUIDE.disclaimer"
    />
  </div>
</template>
