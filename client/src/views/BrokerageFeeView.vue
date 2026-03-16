<script setup lang="ts">
import { computed } from "vue";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import SummaryBanner from "@/components/common/SummaryBanner.vue";
import BrokerageFeeFAQ from "@/components/house/BrokerageFeeFAQ.vue";
import BrokerageFeeInput from "@/components/house/BrokerageFeeInput.vue";
import BrokerageFeeResult from "@/components/house/BrokerageFeeResult.vue";
import { BROKERAGE_DATA_UPDATED, BROKERAGE_FAQS, BROKERAGE_SOURCES } from "@/data/brokerageRates";
import { useBrokerageFee } from "@/composables/useBrokerageFee";
import { useResultShare } from "@/composables/useResultShare";
import { formatPercent, formatWon } from "@/lib/utils";

const seoTitle = "주택 중개보수 계산기 — 매매·전세·월세 상한요율";
const seoDescription = "주택 매매, 전세, 월세 거래의 중개보수 상한요율과 최대 보수를 계산합니다.";

const { form, result, shareQuery } = useBrokerageFee();
const share = useResultShare({
  title: computed(() => `중개보수 상한 ${formatWon(result.value.maxFee)}`),
  description: seoDescription,
  summaryText: computed(() => `환산 거래금액 ${formatWon(result.value.dealAmount)}, 상한 ${formatWon(result.value.maxFee)}`),
  path: "/brokerage-fee",
  query: shareQuery,
});

const facts = computed(() => [
  { label: "환산 금액", value: formatWon(result.value.dealAmount) },
  { label: "상한요율", value: formatPercent(result.value.tier.rate, 1) },
  { label: "의뢰인 1인 최대", value: formatWon(result.value.maxFee) },
]);
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" />
  <div class="container space-y-5 py-5">
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">주택 중개보수 계산기</h1>
        <FreshBadge :message="`${BROKERAGE_DATA_UPDATED} 확인`" />
      </div>
      <div class="retro-panel-content">
        <BrokerageFeeInput v-model="form" />
      </div>
    </div>

    <SummaryBanner
      title="서울시 부동산중개업정보의 주택 요율표를 기준으로 계산한 상한 보수입니다."
      leader-label="중개보수 상한"
      :leader-value="formatWon(result.maxFee)"
      delta-label="적용 구간"
      :delta-value="result.tier.label"
      :facts="facts"
      show-share
      @share="share.openShare"
    />

    <BrokerageFeeResult :result="result" />
    <CompareSourceFooter :sources="[...BROKERAGE_SOURCES]" updated-at="2026-03-15" />
    <BrokerageFeeFAQ :faqs="BROKERAGE_FAQS" />

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
