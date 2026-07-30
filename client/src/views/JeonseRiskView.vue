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
  HOUSE_JEONSE_RISK_GUIDE,
  JEONSE_RISK_DATA_UPDATED,
  JEONSE_RISK_FAQS,
  JEONSE_RISK_SOURCES,
} from "@/data/jeonseRisk";
import { calculateJeonseRisk, type JeonseRiskLevel } from "@/utils/jeonseRiskCalculator";
import { formatNumber, formatPercent, formatWon, parseNumericInput } from "@/lib/utils";
import { mergeFaqs } from "@/lib/faqMerge";

const seoTitle = "깡통전세 위험 진단 계산기 — 전세가율·HUG 가입 판정";
const seoDescription =
  "매매 시세와 보증금, 선순위 근저당을 입력하면 전세가율·부채비율 위험 등급, 낙찰가율 75% 가정 회수 추정, HUG 전세보증금반환보증 가입 가능 여부를 진단합니다.";

const marketPrice = ref(500_000_000);
const jeonseDeposit = ref(350_000_000);
const seniorDebt = ref(0);
const region = ref<"metro" | "other">("metro");
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
      delta-label="낙찰가율 75% 가정 부족분"
      :delta-value="result.auctionShortfall > 0 ? formatWon(result.auctionShortfall) : '없음'"
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
          낙찰가율 75% 가정 시 낙찰 대금 {{ formatWon(result.auctionProceeds) }}에서 선순위 {{ formatWon(seniorDebt) }}를 뺀
          <strong class="text-foreground">{{ formatWon(result.auctionRecovery) }}</strong>까지 회수 가능하고,
          <template v-if="result.auctionShortfall > 0">
            보증금 대비 <strong class="text-status-danger">{{ formatWon(result.auctionShortfall) }} 부족</strong>합니다.
          </template>
          <template v-else>보증금 전액 회수가 가능한 구조입니다.</template>
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
      :disclaimer="HOUSE_JEONSE_RISK_GUIDE.disclaimer"
    />
  </div>
</template>
