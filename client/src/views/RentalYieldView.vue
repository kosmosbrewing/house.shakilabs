<script setup lang="ts">
import { computed } from "vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import SummaryBanner from "@/components/common/SummaryBanner.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import RentalYieldCalculator from "@/components/house/RentalYieldCalculator.vue";
import { RENTAL_YIELD_FAQS, RENTAL_YIELD_UPDATED } from "@/data/rentalYield";
import { useRentalYield } from "@/composables/useRentalYield";
import { useResultShare } from "@/composables/useResultShare";
import { formatManWon, formatPercent, formatWon } from "@/lib/utils";

const props = defineProps<{ initialPrice?: number }>();
const priceLabel = computed(() => props.initialPrice ? formatManWon(props.initialPrice / 10000) : null);

const seoTitle = computed(() =>
  priceLabel.value
    ? `${priceLabel.value} 임대수익률 계산기 | 순수익률·자기자본수익률`
    : "임대수익률 계산기 — 부동산 투자 순수익률·ROE 시뮬레이션",
);
const seoDescription = computed(() =>
  priceLabel.value
    ? `매매가 ${priceLabel.value}원 기준 임대수익률, 월 순수익, 자기자본수익률(ROE)을 계산합니다.`
    : "매매가·보증금·월세·대출을 입력하면 총수익률, 순수익률, 자기자본수익률(ROE)과 투자 수익을 분석합니다.",
);

const override = props.initialPrice ? { purchasePrice: props.initialPrice } : undefined;
const { form, result, shareQuery } = useRentalYield(override);
const share = useResultShare({
  title: computed(() => `임대수익률 ${formatPercent(result.value.netYield, 1)}`),
  description: seoDescription,
  summaryText: computed(
    () =>
      `매매가 ${formatWon(form.value.purchasePrice)} → 순수익률 ${formatPercent(result.value.netYield, 1)}, 월 순수익 ${formatWon(result.value.monthlyNetIncome)}`
  ),
  path: "/rental-yield",
  query: shareQuery,
});

const facts = computed(() => [
  { label: "총수익률", value: formatPercent(result.value.grossYield, 1) },
  { label: "자기자본수익률", value: formatPercent(result.value.roe, 1) },
  { label: "자기자본", value: formatWon(result.value.equity) },
]);

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: RENTAL_YIELD_FAQS.map((faq) => ({
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
        <h1 class="retro-title">임대수익률 계산기</h1>
        <FreshBadge :message="`${RENTAL_YIELD_UPDATED} 기준`" />
      </div>
      <div class="retro-panel-content">
        <RentalYieldCalculator v-model="form" :result="result" />
      </div>
    </div>

    <!-- 요약 배너 -->
    <SummaryBanner
      title="매매가·보증금·월세와 대출 조건을 기준으로 임대수익률을 분석한 결과입니다."
      leader-label="순수익률"
      :leader-value="formatPercent(result.netYield, 1)"
      delta-label="월 순수익"
      :delta-value="formatWon(result.monthlyNetIncome)"
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
          v-for="faq in RENTAL_YIELD_FAQS"
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
