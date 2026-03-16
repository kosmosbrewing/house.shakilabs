<script setup lang="ts">
import { computed } from "vue";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import SummaryBanner from "@/components/common/SummaryBanner.vue";
import DelayInterestFAQ from "@/components/house/DelayInterestFAQ.vue";
import DelayInterestInput from "@/components/house/DelayInterestInput.vue";
import DelayInterestResult from "@/components/house/DelayInterestResult.vue";
import { DELAY_INTEREST_DATA_UPDATED, DELAY_INTEREST_FAQS, DELAY_INTEREST_SOURCES } from "@/data/delayInterest";
import { useDelayInterest } from "@/composables/useDelayInterest";
import { useResultShare } from "@/composables/useResultShare";
import { formatWon } from "@/lib/utils";

const seoTitle = "보증금 반환 지연이자 계산기 — 연 12% 가정";
const seoDescription = "보증금 반환이 늦어졌을 때 연 12% 가정 기준의 예상 지연이자를 계산합니다.";

const { form, result, shareQuery } = useDelayInterest();
const share = useResultShare({
  title: computed(() => `보증금 지연이자 ${formatWon(result.value.totalInterest)}`),
  description: seoDescription,
  summaryText: computed(() => `보증금 ${formatWon(form.value.depositAmount)}, ${form.value.overdueDays}일 지연 시 ${formatWon(result.value.totalInterest)}`),
  path: "/delay-interest",
  query: shareQuery,
});

const facts = computed(() => [
  { label: "일 이자", value: formatWon(result.value.dailyInterest) },
  { label: "월 기준", value: formatWon(result.value.monthlyEquivalentInterest) },
  { label: "원금+이자", value: formatWon(result.value.totalWithPrincipal) },
]);
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" />
  <div class="container space-y-5 py-5">
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">보증금 반환 지연이자 계산기</h1>
        <FreshBadge :message="`${DELAY_INTEREST_DATA_UPDATED} 확인`" />
      </div>
      <div class="retro-panel-content">
        <DelayInterestInput v-model="form" />
      </div>
    </div>

    <SummaryBanner
      title="소송촉진 등에 관한 특례법상 연 12% 가정을 적용한 참고 계산입니다."
      leader-label="예상 지연이자"
      :leader-value="formatWon(result.totalInterest)"
      delta-label="지연 일수"
      :delta-value="`${form.overdueDays}일`"
      :facts="facts"
      show-share
      @share="share.openShare"
    />

    <DelayInterestResult :form="form" :result="result" />
    <CompareSourceFooter :sources="[...DELAY_INTEREST_SOURCES]" updated-at="2026-03-15" />
    <DelayInterestFAQ :faqs="DELAY_INTEREST_FAQS" />

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
