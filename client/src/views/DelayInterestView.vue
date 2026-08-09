<script setup lang="ts">
import { computed } from "vue";
import CalculatorInteractionTracker from "@/components/analytics/CalculatorInteractionTracker.vue";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import AdSlot from "@/components/common/AdSlot.vue";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import ShareModal from "@/components/share/ShareModal.vue";
import { ShSummaryBanner as SummaryBanner } from "@shakilabs/ui";
import DelayInterestFAQ from "@/components/house/DelayInterestFAQ.vue";
import DelayInterestInput from "@/components/house/DelayInterestInput.vue";
import DelayInterestResult from "@/components/house/DelayInterestResult.vue";
import PopularCalculators from "@/components/house/PopularCalculators.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import { HOUSE_DELAY_INTEREST_GUIDE } from "@/data/seoGuides";
import { buildDelayDepositGuide } from "@/data/seoParamGuides";
import {
  CIVIL_DELAY_INTEREST_RATE,
  DELAY_INTEREST_DATA_UPDATED,
  DELAY_INTEREST_FAQS,
  DELAY_INTEREST_SOURCES,
  LITIGATION_DELAY_INTEREST_RATE,
} from "@/data/delayInterest";
import { useDelayInterest } from "@/composables/useDelayInterest";
import { useResultShare } from "@/composables/useResultShare";
import { formatManWon, formatWon } from "@/lib/utils";
import { mergeFaqs } from "@/lib/faqMerge";

const props = defineProps<{ initialDeposit?: number }>();
// Doorway-variant consolidation: the amount presets (/delay-interest/:param) render a
// near-identical body to this page, so they canonicalize here instead of
// competing as separate URLs. The base route is self-canonical either way, so
// the override is unconditional. Reversible: drop this prop (and the route from
// PARAM_ROUTES in scripts/seo-routes.mjs) once a preset gains unique content.
const canonicalPath = "/delay-interest";
const depositLabel = computed(() => props.initialDeposit ? formatManWon(props.initialDeposit / 10000) : null);

const seoTitle = computed(() =>
  depositLabel.value
    ? `보증금 ${depositLabel.value} 지연이자 계산기 | shakilabs.com/house`
    : "보증금 반환 지연이자 계산기 — 민법 5%·소송촉진법 12%",
);
const seoDescription = computed(() =>
  depositLabel.value
    ? `보증금 ${depositLabel.value}원 반환이 늦어졌을 때 연 12% 기준 예상 지연이자를 계산합니다.`
    : "보증금 반환이 늦어졌을 때 약정 이율, 민법상 5%, 소장 송달 다음 날 이후 소송촉진법상 12%를 구분해 계산합니다.",
);

const override = props.initialDeposit ? { depositAmount: props.initialDeposit } : undefined;
const { form, result, shareQuery } = useDelayInterest(override);
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

const rateBasis = computed(() => {
  if (form.value.annualRate === CIVIL_DELAY_INTEREST_RATE) {
    return "약정이 없는 민사채무의 법정이율 5% 가정";
  }
  if (form.value.annualRate === LITIGATION_DELAY_INTEREST_RATE) {
    return "금전 지급 판결을 전제로 한 소장 등 송달 다음 날 이후 12% 가정";
  }
  return `사용자가 입력한 약정·참고 이율 ${(form.value.annualRate * 100).toFixed(1)}% 가정`;
});

// 프리셋 페이지는 보증금별 고유 가이드, 랜딩은 공통 가이드
const guide = computed(() =>
  props.initialDeposit ? buildDelayDepositGuide(props.initialDeposit) : HOUSE_DELAY_INTEREST_GUIDE,
);

// 화면에 실제 렌더되는 병합 FAQ와 구조화 데이터를 일치시킨다 (스키마 규칙)
// 이전에는 프리셋/랜딩에 따라 한쪽 FAQ만 스키마에 넣어 "중복 스키마 방지"를 노렸으나,
// 아코디언은 항상 두 배열을 병합해 보여주므로 스키마도 동일한 병합 결과를 써야 화면=스키마가 성립한다
const mergedFaqs = computed(() => mergeFaqs(DELAY_INTEREST_FAQS, guide.value.faqs));

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
  <div class="text-resize-layout container space-y-5 py-5">
    <CalculatorPageHeader title="보증금 반환 지연이자 계산기" />

    <section class="retro-panel overflow-hidden" aria-labelledby="delay-interest-input-title">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 id="delay-interest-input-title" class="retro-title">지연이자 조건 입력</h2>
      </div>
      <div class="retro-panel-content">
        <CalculatorInteractionTracker
          calculator-id="deposit_delay_interest"
          page-path="/house/delay-interest"
        >
          <DelayInterestInput v-model="form" />
        </CalculatorInteractionTracker>
      </div>
    </section>

    <SummaryBanner
      :title="rateBasis"
      leader-label="예상 지연이자"
      :leader-value="formatWon(result.totalInterest)"
      delta-label="지연 일수"
      :delta-value="`${form.overdueDays}일`"
      :facts="facts"
      show-share
      @share="share.openShare"
    />

    <DelayInterestResult :form="form" :result="result" />
    <AdSlot slot="120001" label="광고 · top" />
    <section class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">적용 순서와 계산 한계</h2>
      </div>
      <div class="retro-panel-content space-y-2 text-caption leading-relaxed text-muted-foreground">
        <p><strong class="text-foreground">계산식:</strong> 보증금 × 연이율 × 지연일수 ÷ 365</p>
        <p><strong class="text-foreground">적용 순서:</strong> 계약상 지연손해금 약정 → 약정이 없을 때 민법상 5% 검토 → 금전 지급 판결과 소장 등 송달 이후 소송촉진법상 12% 검토</p>
        <p><strong class="text-foreground">시작일:</strong> 계약 종료일만으로 단정하지 않고 보증금 반환 이행기와 주택 인도 또는 이행제공 여부를 확인해야 합니다.</p>
        <p><strong class="text-foreground">미지원:</strong> 일부 반환, 연체 차임·원상복구비 공제, 항쟁이 타당한 기간, 판결 주문별 적용 이율은 계산하지 않습니다.</p>
      </div>
    </section>
    <CompareSourceFooter :sources="[...DELAY_INTEREST_SOURCES]" :updated-at="DELAY_INTEREST_DATA_UPDATED" />
    <DelayInterestFAQ :faqs="mergedFaqs" />
    <AdSlot slot="120002" label="광고 · middle" />
    <PopularCalculators />

    <SeoRichGuide
      :title="guide.title"
      :intro="guide.intro"
      :sections="guide.sections"
      :disclaimer="guide.disclaimer"
    />

    <AdSlot slot="120003" label="광고 · bottom" />

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
