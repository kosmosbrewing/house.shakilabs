<script setup lang="ts">
import { computed } from "vue";
import { Home, Banknote, Scale, PiggyBank } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
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

const statItems = computed(() => [
  { label: "전세 연간 부담", value: formatWon(props.result.jeonseAnnualCost), cls: "", icon: Home, iconCls: "bg-muted text-muted-foreground" },
  { label: "월세 연간 부담", value: formatWon(props.result.wolseAnnualCost), cls: "", icon: Banknote, iconCls: "bg-muted text-muted-foreground" },
  { label: "손익분기 월세", value: formatWon(props.result.breakEvenMonthlyRent), cls: "", icon: Scale, iconCls: "bg-primary/10 text-primary" },
  { label: "손익분기 전세금", value: formatWon(props.result.breakEvenJeonseDeposit), cls: "", icon: PiggyBank, iconCls: "bg-primary/10 text-primary" },
]);
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Card
        v-for="stat in statItems"
        :key="stat.label"
        class="border-border/50 bg-muted/30"
      >
        <CardContent class="p-3.5">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" :class="stat.iconCls">
              <component :is="stat.icon" class="h-3.5 w-3.5" />
            </span>
            <p class="truncate text-caption uppercase tracking-wide text-muted-foreground">{{ stat.label }}</p>
          </div>
          <p class="mt-2 text-heading font-bold tabular-nums" :class="stat.cls">{{ stat.value }}</p>
        </CardContent>
      </Card>
    </div>

    <Card class="border-border/50 bg-muted/30">
      <CardContent class="p-4 space-y-2">
        <p class="text-body font-semibold text-foreground">{{ headline }}</p>
        <p class="text-caption leading-relaxed text-muted-foreground">
          비교 금리 {{ formatPercent(form.annualOpportunityRate, 1) }}, 비교 기간 {{ form.analysisYears }}년 기준입니다.
          손익분기 월세가 현재 월세보다 낮으면 전세가, 높으면 월세가 유리합니다.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
