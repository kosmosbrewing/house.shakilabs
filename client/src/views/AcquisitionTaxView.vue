<script setup lang="ts">
import { computed } from "vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import SummaryBanner from "@/components/common/SummaryBanner.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import AcquisitionTaxCalculator from "@/components/house/AcquisitionTaxCalculator.vue";
import { ACQUISITION_TAX_FAQS, ACQUISITION_TAX_UPDATED } from "@/data/acquisitionTax";
import { useAcquisitionTax } from "@/composables/useAcquisitionTax";
import { useResultShare } from "@/composables/useResultShare";
import { formatManWon, formatWon, formatPercent } from "@/lib/utils";

const props = defineProps<{ initialPrice?: number }>();
const priceLabel = computed(() => props.initialPrice ? formatManWon(props.initialPrice / 10000) : null);

const seoTitle = computed(() =>
  priceLabel.value
    ? `${priceLabel.value} 주택 취득세 계산기 | 다주택 중과 반영`
    : "주택 취득세 계산기 — 1~3주택 취득세·지방교육세·농특세",
);
const seoDescription = computed(() =>
  priceLabel.value
    ? `매매가 ${priceLabel.value}원 기준 주택 취득세와 부속세금을 자동 계산합니다.`
    : "매매가를 입력하면 주택 수·조정대상지역에 따른 취득세, 지방교육세, 농어촌특별세를 계산합니다.",
);

const override = props.initialPrice ? { purchasePrice: props.initialPrice } : undefined;
const { form, result, shareQuery } = useAcquisitionTax(override);
const share = useResultShare({
  title: computed(() => `취득세 ${formatWon(result.value.totalTax)}`),
  description: seoDescription,
  summaryText: computed(
    () =>
      `매매가 ${formatWon(form.value.purchasePrice)} · ${result.value.homeCountLabel} 기준, 취득세 합계 ${formatWon(result.value.totalTax)}`
  ),
  path: "/acquisition-tax",
  query: shareQuery,
});

const facts = computed(() => [
  { label: "취득세", value: formatWon(result.value.acquisitionTax) },
  { label: "적용 세율", value: formatPercent(result.value.effectiveRate, 1) },
  { label: "실효세율", value: formatPercent(result.value.effectiveTotalRate, 2) },
]);

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ACQUISITION_TAX_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};
</script>

<template>
  <SEOHead :title="seoTitle" :description="seoDescription" :json-ld="faqJsonLd" />
  <div class="container space-y-5 py-5">
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">주택 취득세 계산기</h1>
        <FreshBadge :message="`${ACQUISITION_TAX_UPDATED} 기준`" />
      </div>
      <div class="retro-panel-content">
        <AcquisitionTaxCalculator v-model="form" :result="result" />
      </div>
    </div>

    <SummaryBanner
      title="매매가, 주택 수, 조정대상지역 여부를 반영한 취득세 시뮬레이션 결과입니다."
      leader-label="세금 합계"
      :leader-value="formatWon(result.totalTax)"
      delta-label="취득세율"
      :delta-value="result.rateLabel"
      :facts="facts"
      show-share
      @share="share.openShare"
    />

    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">자주 묻는 질문</h2>
      </div>
      <div class="retro-panel-content space-y-3">
        <details
          v-for="faq in ACQUISITION_TAX_FAQS"
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
