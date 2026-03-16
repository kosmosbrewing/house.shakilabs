<script setup lang="ts">
import { computed } from "vue";
import type { JeonseVsWolseInput } from "@/utils/housingCalculator";
import { formatPercent, formatWon } from "@/lib/utils";

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

const headline = computed(() => {
  if (props.result.cheaperOption === "same") return "두 선택지가 거의 비슷합니다.";
  return props.result.cheaperOption === "jeonse"
    ? `현재 조건에서는 ${formatWon(props.result.difference)} 만큼 전세가 유리합니다.`
    : `현재 조건에서는 ${formatWon(Math.abs(props.result.difference))} 만큼 월세가 유리합니다.`;
});
</script>

<template>
  <div class="space-y-4">
    <div class="retro-stat-grid">
      <div class="retro-stat">
        <p class="retro-stat-label">전세 연간 부담</p>
        <p class="retro-stat-value">{{ formatWon(result.jeonseAnnualCost) }}</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">월세 연간 부담</p>
        <p class="retro-stat-value">{{ formatWon(result.wolseAnnualCost) }}</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">손익분기 월세</p>
        <p class="retro-stat-value">{{ formatWon(result.breakEvenMonthlyRent) }}</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">손익분기 전세금</p>
        <p class="retro-stat-value">{{ formatWon(result.breakEvenJeonseDeposit) }}</p>
      </div>
    </div>

    <div class="retro-panel-muted p-4 space-y-2">
      <p class="text-body font-semibold text-foreground">{{ headline }}</p>
      <p class="text-caption leading-relaxed text-muted-foreground">
        비교 금리 {{ formatPercent(form.annualOpportunityRate, 1) }}, 비교 기간 {{ form.analysisYears }}년 기준입니다.
        손익분기 월세가 현재 월세보다 낮으면 전세가, 높으면 월세가 유리합니다.
      </p>
    </div>
  </div>
</template>
