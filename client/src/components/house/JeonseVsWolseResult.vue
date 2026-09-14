<script setup lang="ts">
import { computed } from "vue";
import { Home, Banknote, Scale, PiggyBank } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import PairComparisonMeters from "@/components/result-visualization/PairComparisonMeters.vue";
import HouseStatGrid from "@/components/house/HouseStatGrid.vue";
import ResultHero from "@/components/common/ResultHero.vue";
import type { JeonseVsWolseInput } from "@/utils/housingCalculator";
import { formatPercent, formatWon, formatWonShort } from "@/lib/utils";

const props = defineProps<{
  form: JeonseVsWolseInput;
  result: {
    jeonseAnnualCost: number;
    wolseAnnualCost: number;
    jeonseTotalCost: number;
    wolseTotalCost: number;
    difference: number;
    cheaperOption: "jeonse" | "wolse" | "same";
    breakEvenMonthlyRent: number;
    breakEvenJeonseDeposit: number;
    monthlyCostGap: number;
  };
}>();

// 이 계산기의 대표 수치는 4개 stat 중 하나가 아니라 "누적 부담 차이"다(BL-020).
// 라벨이 유·불리를 말하고 히어로 숫자가 그 크기를 말한다.
const heroLabel = computed(() => {
  if (props.result.cheaperOption === "same") return `${props.form.analysisYears}년 누적 부담 차이`;
  return props.result.cheaperOption === "jeonse"
    ? `${props.form.analysisYears}년 기준 전세가 유리한 금액`
    : `${props.form.analysisYears}년 기준 월세가 유리한 금액`;
});
const heroValue = computed(() => formatWon(Math.abs(props.result.difference)));
const heroClass = computed(() =>
  props.result.cheaperOption === "same" ? "text-muted-foreground" : "text-primary"
);

const statItems = computed(() => [
  { label: "전세 연간 부담", value: formatWon(props.result.jeonseAnnualCost), cls: "" },
  { label: "월세 연간 부담", value: formatWon(props.result.wolseAnnualCost), cls: "" },
  { label: "손익분기 월세", value: formatWon(props.result.breakEvenMonthlyRent), cls: "" },
  { label: "손익분기 전세금", value: formatWon(props.result.breakEvenJeonseDeposit), cls: "" },
]);
const costMetrics = computed(() => [
  {
    key: "annual",
    label: "연간 부담",
    values: [
      { key: "jeonse", label: "전세", value: props.result.jeonseAnnualCost },
      { key: "wolse", label: "월세", value: props.result.wolseAnnualCost },
    ] as const,
  },
  {
    key: "total",
    label: `${props.form.analysisYears}년 누적 부담`,
    values: [
      { key: "jeonse", label: "전세", value: props.result.jeonseTotalCost },
      { key: "wolse", label: "월세", value: props.result.wolseTotalCost },
    ] as const,
  },
]);
const statIcons = [Home, Banknote, Scale, PiggyBank] as const;
const statIconClasses = [
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
  "bg-primary/10 text-primary",
  "bg-primary/10 text-primary",
] as const;

function formatWonScale(value: number): string {
  return formatWonShort(value).replaceAll("원", "");
}
</script>

<template>
  <div class="space-y-4">
    <Card class="border-border/50 bg-card">
      <CardContent class="px-4 py-2">
        <ResultHero :label="heroLabel" :value="heroValue" :value-class="heroClass">
          <template #secondary>
            비교 금리 {{ formatPercent(form.annualOpportunityRate, 1) }} · 비교 기간 {{ form.analysisYears }}년 기준
          </template>
        </ResultHero>
      </CardContent>
    </Card>

    <HouseStatGrid :items="statItems" :icons="statIcons" :icon-classes="statIconClasses" />

    <PairComparisonMeters
      title="전세·월세 부담 비교"
      note="각 기간에서 전세와 월세를 같은 0원 기준으로 비교하며, 더 늘어나는 부담만 경고색으로 표시합니다."
      :metrics="costMetrics"
      :format-value="formatWon"
      :format-scale-value="formatWonScale"
    />

    <Card class="border-border/50 bg-muted/30">
      <CardContent class="p-4 space-y-2">
        <p class="text-caption leading-relaxed text-muted-foreground">
          손익분기 월세가 현재 월세보다 낮으면 전세가, 높으면 월세가 유리합니다.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
