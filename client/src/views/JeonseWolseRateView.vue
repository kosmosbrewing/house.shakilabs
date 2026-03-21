<script setup lang="ts">
import { computed } from "vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import SummaryBanner from "@/components/common/SummaryBanner.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import JeonseWolseRateCalculator from "@/components/house/JeonseWolseRateCalculator.vue";
import { JEONSE_WOLSE_RATE_FAQS, JEONSE_WOLSE_RATE_UPDATED } from "@/data/jeonseWolseRate";
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
    <!-- 입력 + 결과 -->
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">전월세 전환율 계산기</h1>
        <FreshBadge :message="`${JEONSE_WOLSE_RATE_UPDATED} 기준`" />
      </div>
      <div class="retro-panel-content">
        <JeonseWolseRateCalculator v-model="form" :result="result" />
      </div>
    </div>

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

    <!-- FAQ -->
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">자주 묻는 질문</h2>
      </div>
      <div class="retro-panel-content space-y-3">
        <details
          v-for="faq in JEONSE_WOLSE_RATE_FAQS"
          :key="faq.q"
          class="retro-panel-muted p-4"
        >
          <summary class="cursor-pointer list-none text-body font-semibold text-foreground">
            {{ faq.q }}
          </summary>
          <p class="mt-2 text-caption leading-relaxed text-muted-foreground">
            {{ faq.a }}
          </p>
        </details>
      </div>
    </div>

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
