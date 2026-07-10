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

const props = defineProps<{ initialDeposit?: number }>();
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
