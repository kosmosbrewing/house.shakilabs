<script setup lang="ts">
import { computed } from "vue";
import { ShBreakdownBar } from "@shakilabs/ui";
import MetricComparisonBars from "@/components/result-visualization/MetricComparisonBars.vue";
import { formatWon } from "@/lib/utils";
import type { RentalYieldResult } from "@/utils/housingCalculator";

const props = defineProps<{ result: RentalYieldResult }>();
const loanAmount = computed(() => Math.max(0, props.result.purchasePrice - props.result.totalInvestment));
const fundingSegments = computed(() => [
  { key: "equity", label: "자기자본", value: props.result.equity, tone: "primary" as const },
  { key: "deposit", label: "임차인 보증금", value: props.result.deposit, tone: "muted" as const },
  { key: "loan", label: "대출금", value: loanAmount.value, tone: "danger" as const },
]);
const isFundingBalanced = computed(() => {
  const total = fundingSegments.value.reduce((sum, segment) => sum + segment.value, 0);
  return Math.abs(total - props.result.purchasePrice) <= 1;
});
const incomeMetrics = computed(() => [{
  key: "income",
  label: "연간 임대 현금흐름",
  values: [
    { key: "gross", label: "공실 전 임대수입", value: props.result.annualRentGross, tone: "muted" as const },
    { key: "net", label: "비용 반영 순수익", value: props.result.annualNetIncome, tone: "profit" as const },
  ],
}]);
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <MetricComparisonBars
      title="연간 임대 현금흐름"
      note="공실·대출이자·관리비 반영 전후를 비교하며 손실이면 0원 기준선 왼쪽에 표시합니다."
      :metrics="incomeMetrics"
      :format-value="formatWon"
    />
    <ShBreakdownBar
      v-if="isFundingBalanced"
      label="매매가 자금 구성"
      note="매매가를 자기자본, 임차인 보증금, 대출금으로 나눈 결과입니다."
      :segments="fundingSegments"
      :format-value="formatWon"
      surface="outlined"
    />
  </div>
</template>
