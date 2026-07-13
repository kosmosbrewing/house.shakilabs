<script setup lang="ts">
import { computed } from "vue";
import { ShBreakdownBar, ShPresetGroup, ShSlider } from "@shakilabs/ui";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Percent,
} from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import HouseStatGrid from "@/components/house/HouseStatGrid.vue";
import { SELL_PRICE_PRESETS, CAPITAL_GAINS_TAX_SOURCES, CAPITAL_GAINS_TAX_UPDATED } from "@/data/capitalGainsTax";
import { formatWon, formatPercent, parseNumericInput } from "@/lib/utils";
import type { CapitalGainsTaxInput } from "@/utils/housingCalculator";

const form = defineModel<CapitalGainsTaxInput>({ required: true });
const sellPricePresetOptions = SELL_PRICE_PRESETS.map((value) => ({
  label: formatPresetPrice(value),
  value,
}));

const props = defineProps<{
  result: ReturnType<typeof import("@/utils/housingCalculator").calculateCapitalGainsTax>;
}>();

const statItems = computed(() => [
  { label: "양도소득세+지방세", value: formatWon(props.result.totalTax), cls: "text-fee" },
  { label: "세후 양도차익", value: formatWon(props.result.afterTaxProfit), cls: "" },
  { label: "양도차익", value: formatWon(props.result.capitalGain), cls: "" },
  { label: "실효세율", value: formatPercent(props.result.effectiveRate, 1), cls: "text-muted-foreground" },
]);

const statIcons = [Receipt, TrendingUp, TrendingDown, Percent] as const;
const statIconClasses = [
  "bg-fee/10 text-fee",
  "bg-primary/10 text-primary",
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
] as const;
const gainSegments = computed(() => [
  { key: "after-tax", label: "세후 양도차익", value: props.result.afterTaxProfit, tone: "success" as const },
  { key: "tax", label: "양도소득세·지방세", value: props.result.totalTax, tone: "danger" as const },
]);

function setPreset(price: number) {
  form.value = { ...form.value, sellPrice: price };
}

function formatPresetPrice(price: number): string {
  return price % 100_000_000 === 0 ? `${price / 100_000_000}억원` : formatWon(price);
}
</script>

<template>
  <div class="space-y-4">
    <!-- 입력 영역 -->
    <section class="retro-panel-muted space-y-4 p-4">
      <!-- 양도가 + 프리셋 -->
      <div class="space-y-1.5">
        <label class="text-caption font-semibold text-foreground">양도가 (매도가)</label>
        <input
          aria-label="양도가"
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="form.sellPrice.toLocaleString('ko-KR')"
          @input="form.sellPrice = parseNumericInput(($event.target as HTMLInputElement).value)"
        />
        <ShPresetGroup
          :model-value="form.sellPrice"
          :options="sellPricePresetOptions"
          label="양도가 빠른 선택"
          @update:model-value="setPreset"
        />
      </div>

      <!-- 취득가 -->
      <div class="space-y-1.5">
        <label class="text-caption font-semibold text-foreground">취득가 (매입가)</label>
        <input
          aria-label="취득가"
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="form.buyPrice.toLocaleString('ko-KR')"
          @input="form.buyPrice = parseNumericInput(($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <!-- 필요경비율 -->
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">
            필요경비율: {{ (form.expenseRate * 100).toFixed(0) }}%
          </span>
          <ShSlider
            v-model="form.expenseRate"
            :min="0"
            :max="0.15"
            :step="0.01"
            :value-text="`필요경비율 ${(form.expenseRate * 100).toFixed(0)}%`"
          />
          <div class="grid grid-cols-2 text-[10px] text-muted-foreground tabular-nums">
            <span class="justify-self-start">0%</span>
            <span class="justify-self-end">15%</span>
          </div>
        </label>

        <!-- 보유기간 -->
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">보유 기간 (년)</span>
          <input v-model.number="form.holdingYears" class="retro-input" min="0" max="50" step="1" type="number" />
        </label>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <!-- 거주기간 -->
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">거주 기간 (년)</span>
          <input v-model.number="form.residenceYears" class="retro-input" min="0" max="50" step="1" type="number" />
        </label>

        <div class="space-y-2 pt-1">
          <!-- 1세대1주택 -->
          <label class="retro-panel flex items-center gap-2 px-3 py-2.5 w-full">
            <input v-model="form.isOneHousehold" class="retro-checkbox" type="checkbox" />
            <span class="text-caption font-semibold">1세대 1주택</span>
          </label>
          <!-- 조정대상지역 -->
          <label class="retro-panel flex items-center gap-2 px-3 py-2.5 w-full">
            <input v-model="form.isRegulatedArea" class="retro-checkbox" type="checkbox" />
            <span class="text-caption font-semibold">조정대상지역</span>
          </label>
        </div>
      </div>
    </section>

    <HouseStatGrid :items="statItems" :icons="statIcons" :icon-classes="statIconClasses" />

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
            <span class="font-medium text-fee tabular-nums">{{ formatWon(result.incomeTax) }}</span>
          </li>
          <li class="flex justify-between">
            <span>지방소득세 (× 10%)</span>
            <span class="font-medium text-fee tabular-nums">{{ formatWon(result.localTax) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between font-semibold text-foreground">
            <span>세금 합계</span>
            <span class="tabular-nums text-fee">{{ formatWon(result.totalTax) }}</span>
          </li>
        </ul>
      </CardContent>
    </Card>

    <CompareSourceFooter :sources="[...CAPITAL_GAINS_TAX_SOURCES]" :updated-at="CAPITAL_GAINS_TAX_UPDATED" />
  </div>
</template>
