<script setup lang="ts">
import { computed } from "vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import SummaryBanner from "@/components/common/SummaryBanner.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import CapitalGainsTaxCalculator from "@/components/house/CapitalGainsTaxCalculator.vue";
import { CAPITAL_GAINS_TAX_FAQS, CAPITAL_GAINS_TAX_UPDATED } from "@/data/capitalGainsTax";
import { useCapitalGainsTax } from "@/composables/useCapitalGainsTax";
import { useResultShare } from "@/composables/useResultShare";
import { formatManWon, formatWon } from "@/lib/utils";

const props = defineProps<{ initialSellPrice?: number }>();
const priceLabel = computed(() => props.initialSellPrice ? formatManWon(props.initialSellPrice / 10000) : null);

const seoTitle = computed(() =>
  priceLabel.value
    ? `${priceLabel.value} 양도소득세 계산기 | 1세대1주택 비과세·장특공제`
    : "양도소득세 계산기 — 1세대1주택 비과세·장기보유특별공제 시뮬레이션",
);
const seoDescription = computed(() =>
  priceLabel.value
    ? `양도가 ${priceLabel.value}원 기준 양도소득세와 지방소득세를 자동 계산합니다.`
    : "양도가·취득가를 입력하면 장기보유특별공제와 1세대1주택 비과세를 반영한 양도소득세를 계산합니다.",
);

const override = props.initialSellPrice ? { sellPrice: props.initialSellPrice } : undefined;
const { form, result, shareQuery } = useCapitalGainsTax(override);
const share = useResultShare({
  title: computed(() => `양도소득세 ${formatWon(result.value.totalTax)}`),
  description: seoDescription,
  summaryText: computed(
    () =>
      `양도가 ${formatWon(form.value.sellPrice)} → 취득가 ${formatWon(form.value.buyPrice)} 기준, 세금 합계 ${formatWon(result.value.totalTax)}`
  ),
  path: "/capital-gains-tax",
  query: shareQuery,
});

const facts = computed(() => [
  { label: "양도차익", value: formatWon(result.value.capitalGain) },
  { label: "장특공제", value: `${(result.value.longTermDeductionRate * 100).toFixed(0)}%` },
  { label: "실효세율", value: `${(result.value.effectiveRate * 100).toFixed(1)}%` },
]);

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: CAPITAL_GAINS_TAX_FAQS.map((faq) => ({
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
        <h1 class="retro-title">양도소득세 계산기</h1>
        <FreshBadge :message="`${CAPITAL_GAINS_TAX_UPDATED} 기준`" />
      </div>
      <div class="retro-panel-content">
        <CapitalGainsTaxCalculator v-model="form" :result="result" />
      </div>
    </div>

    <!-- 요약 배너 -->
    <SummaryBanner
      title="양도가·취득가와 보유기간을 기준으로 양도소득세를 시뮬레이션한 결과입니다."
      leader-label="세금 합계"
      :leader-value="formatWon(result.totalTax)"
      delta-label="세후 차익"
      :delta-value="formatWon(result.afterTaxProfit)"
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
          v-for="faq in CAPITAL_GAINS_TAX_FAQS"
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
