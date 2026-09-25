<script setup lang="ts">
import { computed } from "vue";
import { ShBreakdownBar } from "@shakilabs/ui";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Percent,
} from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import HouseStatGrid from "@/components/house/HouseStatGrid.vue";
import { CAPITAL_GAINS_TAX_SOURCES, CAPITAL_GAINS_TAX_UPDATED } from "@/data/capitalGainsTax";
import { formatWon, formatPercent } from "@/lib/utils";
import type { CapitalGainsTaxInput } from "@/utils/housingCalculator";

const props = defineProps<{
  form: CapitalGainsTaxInput;
  result: ReturnType<typeof import("@/utils/housingCalculator").calculateCapitalGainsTax>;
}>();

// 2026-09-17: 양도세는 위험이 아니라 결과다 — 히어로는 액센트로, text-fee는 폐기.
const statItems = computed(() => [
  { label: "양도소득세+지방세", value: formatWon(props.result.totalTax), cls: "text-primary" },
  { label: "세후 양도차익", value: formatWon(props.result.afterTaxProfit), cls: "" },
  { label: "양도차익", value: formatWon(props.result.capitalGain), cls: "" },
  { label: "실효세율", value: formatPercent(props.result.effectiveRate, 1), cls: "text-muted-foreground" },
]);

const statIcons = [Receipt, TrendingUp, TrendingDown, Percent] as const;
// 히어로(index 0) 아이콘은 그리드에서 빠져 렌더되지 않지만 --fee 참조를 남기지 않는다.
const statIconClasses = [
  "bg-accent text-accent-foreground",
  "bg-primary/10 text-primary",
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
] as const;
const gainSegments = computed(() => [
  { key: "after-tax", label: "세후 양도차익", value: props.result.afterTaxProfit, tone: "success" as const },
  { key: "tax", label: "양도소득세·지방세", value: props.result.totalTax, tone: "primary" as const },
]);
</script>

<template>
  <div class="space-y-4">
    <HouseStatGrid :items="statItems" :icons="statIcons" :icon-classes="statIconClasses" :hero-index="0" />

    <ShBreakdownBar
      label="양도차익의 세금·세후 이익 구성"
      note="전체 양도차익에서 세금이 차지하는 금액과 세후에 남는 금액을 표시합니다."
      :segments="gainSegments"
      :format-value="formatWon"
      surface="outlined"
    />

    <!-- 상세 내역 -->
    <Card>
      <CardContent class="p-4">
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Receipt class="h-3.5 w-3.5" />
          </span>
          <p class="text-caption font-semibold text-foreground">양도소득세 산출 내역</p>
          <span
            v-if="result.isExempt && result.totalTax === 0"
            class="ml-auto inline-flex shrink-0 whitespace-nowrap rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
          >
            비과세
          </span>
          <span
            v-else-if="result.isExempt"
            class="ml-auto inline-flex shrink-0 whitespace-nowrap rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
          >
            12억 초과분 과세
          </span>
        </div>

        <ul class="space-y-2 text-caption leading-relaxed text-muted-foreground">
          <li class="flex justify-between">
            <span>양도가</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.sellPrice) }}</span>
          </li>
          <li class="flex justify-between">
            <span>취득가</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.buyPrice) }}</span>
          </li>
          <li class="flex justify-between">
            <span>필요경비 (취득가 × {{ (form.expenseRate * 100).toFixed(0) }}%)</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.expenses) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between font-semibold text-foreground">
            <span>양도차익</span>
            <span class="tabular-nums">{{ formatWon(result.capitalGain) }}</span>
          </li>
          <li v-if="result.isExempt && result.taxableCapitalGain !== result.capitalGain" class="flex justify-between">
            <span>과세 양도차익 (12억 초과분)</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.taxableCapitalGain) }}</span>
          </li>
          <li class="flex justify-between">
            <span>장기보유특별공제 ({{ formatPercent(result.longTermDeductionRate, 0) }})</span>
            <span class="font-medium text-foreground tabular-nums">-{{ formatWon(result.longTermDeduction) }}</span>
          </li>
          <li class="flex justify-between">
            <span>양도소득금액</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.taxableGain) }}</span>
          </li>
          <li class="flex justify-between">
            <span>기본공제</span>
            <span class="font-medium text-foreground tabular-nums">-{{ formatWon(result.basicDeduction) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between">
            <span>과세표준</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.taxBase) }}</span>
          </li>
          <li class="flex justify-between">
            <span>세율 ({{ result.taxRateLabel }})</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatPercent(result.taxRate, 0) }}</span>
          </li>
          <li class="flex justify-between">
            <span>양도소득세</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.incomeTax) }}</span>
          </li>
          <li class="flex justify-between">
            <span>지방소득세 (× 10%)</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.localTax) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between font-semibold text-foreground">
            <span>세금 합계</span>
            <span class="tabular-nums text-foreground">{{ formatWon(result.totalTax) }}</span>
          </li>
        </ul>
      </CardContent>
    </Card>

    <CompareSourceFooter :sources="[...CAPITAL_GAINS_TAX_SOURCES]" :updated-at="CAPITAL_GAINS_TAX_UPDATED" />
  </div>
</template>
