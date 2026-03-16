<script setup lang="ts">
import { computed } from "vue";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import SummaryBanner from "@/components/common/SummaryBanner.vue";
import JeonseVsWolseFAQ from "@/components/house/JeonseVsWolseFAQ.vue";
import JeonseVsWolseInput from "@/components/house/JeonseVsWolseInput.vue";
import JeonseVsWolseResult from "@/components/house/JeonseVsWolseResult.vue";
import { JEONSE_WOLSE_DATA_UPDATED, JEONSE_WOLSE_FAQS, JEONSE_WOLSE_SOURCES } from "@/data/jeonseWolse";
import { useJeonseVsWolse } from "@/composables/useJeonseVsWolse";
import { useResultShare } from "@/composables/useResultShare";
import { formatWon } from "@/lib/utils";

const seoTitle = "전세 vs 월세 비교 계산기 — 손익분기 월세";
const seoDescription = "전세 보증금의 기회비용까지 반영해 전세와 월세 중 어느 쪽이 유리한지 계산합니다.";

const { form, result, shareQuery } = useJeonseVsWolse();
const share = useResultShare({
  title: computed(() => result.value.cheaperOption === "jeonse" ? "전세가 더 유리합니다" : "월세가 더 유리합니다"),
  description: seoDescription,
  summaryText: computed(() => `손익분기 월세 ${formatWon(result.value.breakEvenMonthlyRent)}, 현재 월세 ${formatWon(form.value.monthlyRent)}`),
  path: "/jeonse-vs-wolse",
  query: shareQuery,
});

const facts = computed(() => [
  { label: "전세 연간", value: formatWon(result.value.jeonseAnnualCost) },
  { label: "월세 연간", value: formatWon(result.value.wolseAnnualCost) },
  { label: "손익분기 월세", value: formatWon(result.value.breakEvenMonthlyRent) },
]);
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" />
  <div class="container space-y-5 py-5">
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">전세 vs 월세 비교 계산기</h1>
        <FreshBadge :message="`${JEONSE_WOLSE_DATA_UPDATED} 기준`" />
      </div>
      <div class="retro-panel-content">
        <JeonseVsWolseInput v-model="form" />
      </div>
    </div>

    <SummaryBanner
      title="보증금 기회비용과 월세 현금지출만 비교합니다."
      leader-label="손익분기 월세"
      :leader-value="formatWon(result.breakEvenMonthlyRent)"
      delta-label="현재 선택"
      :delta-value="result.cheaperOption === 'jeonse' ? '전세 유리' : result.cheaperOption === 'wolse' ? '월세 유리' : '비슷함'"
      :facts="facts"
      show-share
      @share="share.openShare"
    />

    <JeonseVsWolseResult :form="form" :result="result" />
    <CompareSourceFooter :sources="[...JEONSE_WOLSE_SOURCES]" :updated-at="JEONSE_WOLSE_DATA_UPDATED" />
    <JeonseVsWolseFAQ :faqs="JEONSE_WOLSE_FAQS" />

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
