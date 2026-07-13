<script setup lang="ts">
import { computed } from "vue";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";
import { ShSummaryBanner as SummaryBanner } from "@shakilabs/ui";
import ShareModal from "@/components/share/ShareModal.vue";
import JeonseWolseRateCalculator from "@/components/house/JeonseWolseRateCalculator.vue";
import PopularCalculators from "@/components/house/PopularCalculators.vue";
import { JEONSE_WOLSE_RATE_FAQS } from "@/data/jeonseWolseRate";
import { useJeonseWolseRate } from "@/composables/useJeonseWolseRate";
import { useResultShare } from "@/composables/useResultShare";
import { formatManWon, formatPercent, formatWon } from "@/lib/utils";

const props = defineProps<{ initialDeposit?: number }>();
const depositLabel = computed(() => props.initialDeposit ? formatManWon(props.initialDeposit / 10000) : null);

const seoTitle = computed(() =>
  depositLabel.value
    ? `전세 ${depositLabel.value} 전월세 전환율 계산기 | 법정 상한 판정`
    : "전월세 전환율 계산기 — 법정 상한 전환율 판정·적정 월세",
);
const seoDescription = computed(() =>
  depositLabel.value
    ? `전세 보증금 ${depositLabel.value}원 기준 전월세 전환율과 법정 상한 대비 적정 월세를 계산합니다.`
    : "전세 보증금과 월세를 입력하면 실제 전환율, 법정 상한(기준금리+2%) 대비 판정, 적정 월세를 계산합니다.",
);

const override = props.initialDeposit ? { jeonseDeposit: props.initialDeposit } : undefined;
const { form, result, shareQuery } = useJeonseWolseRate(override);

const judgmentText = computed(() => {
  switch (result.value.judgment) {
    case "excessive":
      return "법정 상한 초과";
    case "below":
      return "적정 범위";
    case "appropriate":
      return "법정 상한 근접";
  }
});

const share = useResultShare({
  title: computed(() => `전환율 ${formatPercent(result.value.actualConversionRate, 2)} — ${judgmentText.value}`),
  description: seoDescription,
  summaryText: computed(
    () =>
      `전환율 ${formatPercent(result.value.actualConversionRate, 2)}, 적정 월세 ${formatWon(result.value.fairMonthlyRent)}`
  ),
  path: "/jeonse-wolse-rate",
  query: shareQuery,
});

const facts = computed(() => [
  { label: "실제 전환율", value: formatPercent(result.value.actualConversionRate, 2) },
  { label: "법정 상한", value: formatPercent(result.value.legalRateCap, 1) },
  { label: "월세 차이", value: formatWon(result.value.monthlyRentGap) },
]);

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: JEONSE_WOLSE_RATE_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="faqJsonLd" />
  <div class="container space-y-5 py-5">
    <CalculatorPageHeader title="전월세 전환율 계산기" />

    <section class="retro-panel overflow-hidden" aria-labelledby="jeonse-wolse-rate-input-title">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 id="jeonse-wolse-rate-input-title" class="retro-title">전월세 조건 입력</h2>
      </div>
      <div class="retro-panel-content">
        <JeonseWolseRateCalculator v-model="form" :result="result" />
      </div>
    </section>

    <!-- 요약 배너 -->
    <SummaryBanner
      title="전세 보증금과 월세 조건을 기준으로 전환율을 분석한 결과입니다."
      leader-label="적정 월세"
      :leader-value="formatWon(result.fairMonthlyRent)"
      delta-label="판정"
      :delta-value="judgmentText"
      :facts="facts"
      show-share
      @share="share.openShare"
    />

    <FaqAccordionPanel :items="JEONSE_WOLSE_RATE_FAQS" />

    <PopularCalculators />

    <!-- 공유 모달 -->
    <ShareModal
      :show="share.showShareModal.value"
      :kakao-busy="share.kakaoBusy.value"
      :summary-text="share.shareSummary.value"
      @close="share.closeShare"
      @share-kakao="share.shareKakao"
      @copy-link="share.copyLink"
    />
  </div>
</template>
