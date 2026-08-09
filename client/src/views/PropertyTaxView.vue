<script setup lang="ts">
import { computed } from "vue";
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import AdSlot from "@/components/common/AdSlot.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import { HOUSE_PROPERTY_TAX_GUIDE } from "@/data/seoGuides";
import { buildPropertyTaxGuide } from "@/data/seoParamGuides";
import { ShSummaryBanner as SummaryBanner } from "@shakilabs/ui";
import ShareModal from "@/components/share/ShareModal.vue";
import PropertyTaxInputPanel from "@/components/house/PropertyTaxInputPanel.vue";
import PropertyTaxDetails from "@/components/house/PropertyTaxDetails.vue";
import PopularCalculators from "@/components/house/PopularCalculators.vue";
import SessionDraftControl from "@/components/house/SessionDraftControl.vue";
import { PROPERTY_TAX_FAQS } from "@/data/propertyTax";
import { usePropertyTax } from "@/composables/usePropertyTax";
import { useResultShare } from "@/composables/useResultShare";
import { formatManWon, formatWon } from "@/lib/utils";
import { mergeFaqs } from "@/lib/faqMerge";

const props = defineProps<{ initialPrice?: number }>();
// Doorway-variant consolidation: the amount presets (/property-tax/:param) render a
// near-identical body to this page, so they canonicalize here instead of
// competing as separate URLs. The base route is self-canonical either way, so
// the override is unconditional. Reversible: drop this prop (and the route from
// PARAM_ROUTES in scripts/seo-routes.mjs) once a preset gains unique content.
const canonicalPath = "/property-tax";
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

// 프리셋 페이지는 가액별 고유 가이드, 랜딩은 공통 가이드
const guide = computed(() =>
  props.initialPrice ? buildPropertyTaxGuide(props.initialPrice) : HOUSE_PROPERTY_TAX_GUIDE,
);

// 화면에 실제 렌더되는 병합 FAQ와 구조화 데이터를 일치시킨다 (스키마 규칙, DelayInterestView와 동일 설계 변경)
const mergedFaqs = computed(() => mergeFaqs(PROPERTY_TAX_FAQS, guide.value.faqs));

const faqJsonLd = computed(() => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: mergedFaqs.value.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
}));
</script>

<template>
  <SEOHead
    :title="seoTitle"
    :description="seoDescription"
    :json-ld="faqJsonLd"
    :canonical-path="canonicalPath"
  />
  <div class="container space-y-5 py-5">
    <CalculatorPageHeader title="재산세·보유세 계산기" />

    <SessionDraftControl />

    <section class="retro-panel overflow-hidden" aria-labelledby="property-tax-input-title">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 id="property-tax-input-title" class="retro-title">보유세 조건 입력</h2>
      </div>
      <div class="retro-panel-content">
        <CalculatorInteractionTracker
          calculator-id="property_tax"
          page-path="/house/property-tax"
          :can-view-result="result.isSupportedScenario"
        >
          <PropertyTaxInputPanel v-model="form" />
        </CalculatorInteractionTracker>
      </div>
    </section>

    <div
      v-if="!result.isSupportedScenario"
      class="rounded-xl border border-status-warning/40 bg-status-warning/10 p-4 text-caption leading-relaxed text-foreground"
    >
      현재는 아파트를 단독 명의로 보유한 1세대 1주택만 지원합니다. 단독주택·공동명의·다주택·법인·주택 수 제외 특례는 잘못된 세액을 피하기 위해 결과를 숨깁니다.
    </div>

    <!-- 요약 배너 — 입력 직후에 결과를 먼저 보여주고, 분해는 그 뒤로 -->
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

    <AdSlot slot="120004" label="광고 · top" />

    <section v-if="result.isSupportedScenario" class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">보유세 상세 내역</h2>
      </div>
      <div class="retro-panel-content">
        <PropertyTaxDetails :form="form" :result="result" />
      </div>
    </section>

    <PopularCalculators />

    <AdSlot slot="120005" label="광고 · bottom" />

    <FaqAccordionPanel :items="mergedFaqs" />

    <SeoRichGuide
      :title="guide.title"
      :intro="guide.intro"
      :sections="guide.sections"
      :sources="guide.sources"
      :disclaimer="guide.disclaimer"
    />

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
