<script setup lang="ts">
import { useId } from "vue";
import { ShPresetGroup, ShSlider } from "@shakilabs/ui";
import { SELL_PRICE_PRESETS } from "@/data/capitalGainsTax";
import { formatWon, parseNumericInput } from "@/lib/utils";
import type { CapitalGainsTaxInput } from "@/utils/housingCalculator";

const form = defineModel<CapitalGainsTaxInput>({ required: true });
const sellPricePresetOptions = SELL_PRICE_PRESETS.map((value) => ({
  label: formatPresetPrice(value),
  value,
}));

function setPreset(price: number) {
  form.value = { ...form.value, sellPrice: price };
}

function formatPresetPrice(price: number): string {
  return price % 100_000_000 === 0 ? `${price / 100_000_000}억원` : formatWon(price);
}

// 왜: 보이는 제목("양도가 (매도가)"·"취득가 (매입가)")을 <label for>로 칸에 묶는다.
// 예전 aria-label("양도가"·"취득가")은 보이는 글자와 달라 접근 이름이 화면과 어긋났다 — 이름은 보이는 라벨 하나로.
const sellPriceId = useId();
const buyPriceId = useId();
</script>

<template>
  <section class="retro-panel-muted space-y-4 p-4">
    <!-- 양도가 + 프리셋 -->
    <div class="space-y-1.5">
      <label :for="sellPriceId" class="text-caption font-semibold text-foreground">양도가 (매도가)</label>
      <input
        :id="sellPriceId"
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
      <label :for="buyPriceId" class="text-caption font-semibold text-foreground">취득가 (매입가)</label>
      <input
        :id="buyPriceId"
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
</template>
