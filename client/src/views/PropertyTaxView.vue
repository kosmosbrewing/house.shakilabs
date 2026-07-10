<script setup lang="ts">
import { computed } from "vue";
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import SummaryBanner from "@/components/common/SummaryBanner.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import PropertyTaxCalculator from "@/components/house/PropertyTaxCalculator.vue";
import PopularCalculators from "@/components/house/PopularCalculators.vue";
import { PROPERTY_TAX_FAQS, PROPERTY_TAX_UPDATED } from "@/data/propertyTax";
import { usePropertyTax } from "@/composables/usePropertyTax";
import { useResultShare } from "@/composables/useResultShare";
import { formatManWon, formatWon } from "@/lib/utils";

const props = defineProps<{ initialPrice?: number }>();
const priceLabel = computed(() => props.initialPrice ? formatManWon(props.initialPrice / 10000) : null);

const seoTitle = computed(() =>
  priceLabel.value
    ? `${priceLabel.value} 아파트 재산세·보유세 계산기 | shakilabs.com/house`
    : "1세대 1주택 재산세·보유세 계산기 — 2026년 기준",
);
const seoDescription = computed(() =>
  priceLabel.value
    ? `시가 ${priceLabel.value}원 아파트의 재산세와 종합부동산세를 자동 계산합니다.`
    : "단독 명의 1세대 1주택의 시세를 입력하면 2026년 공정시장가액비율과 특례세율로 재산세·종부세를 추정합니다.",
);

const override = props.initialPrice ? { marketPrice: props.initialPrice } : undefined;
const { form, result, shareQuery } = usePropertyTax(override);
const share = useResultShare({
  title: computed(() => `보유세 ${formatWon(result.value.annualTotal)} (월 ${formatWon(result.value.monthlyEquivalent)})`),
  description: seoDescription,
  summaryText: computed(
    () =>
      `공시가격 ${formatWon(result.value.officialPrice)} 기준, 연간 보유세 ${formatWon(result.value.annualTotal)} (월 ${formatWon(result.value.monthlyEquivalent)})`
  ),
  path: "/property-tax",
  query: shareQuery,
});

const facts = computed(() => [
  { label: "재산세 합계", value: formatWon(result.value.propertyTaxTotal) },
  { label: "종부세 합계", value: formatWon(result.value.compTaxTotal) },
  { label: "공시가격", value: formatWon(result.value.officialPrice) },
]);
const resultBasisTitle = computed(() => result.value.isOfficialPriceEstimated
  ? "시가로 공시가격을 추정한 결과입니다. 실제 공시가격을 입력하면 정확도가 높아집니다."
  : "입력한 공시가격과 2026년 세율을 적용한 단순 추정 결과입니다.");

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PROPERTY_TAX_FAQS.map((faq) => ({
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
        <h1 class="retro-title">재산세·보유세 계산기</h1>
        <FreshBadge :message="`${PROPERTY_TAX_UPDATED} 확인`" />
      </div>
      <div class="retro-panel-content">
        <CalculatorInteractionTracker
          calculator-id="property_tax"
          page-path="/house/property-tax"
          :can-view-result="result.isSupportedScenario"
        >
          <PropertyTaxCalculator v-model="form" :result="result" />
        </CalculatorInteractionTracker>
      </div>
    </div>

    <!-- 요약 배너 -->
    <SummaryBanner
      v-if="result.isSupportedScenario"
      :title="resultBasisTitle"
      leader-label="연간 보유세"
      :leader-value="formatWon(result.annualTotal)"
      delta-label="월 환산"
      :delta-value="formatWon(result.monthlyEquivalent)"
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
          v-for="faq in PROPERTY_TAX_FAQS"
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
