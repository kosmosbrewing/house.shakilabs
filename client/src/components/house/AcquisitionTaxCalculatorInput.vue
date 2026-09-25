<script setup lang="ts">
import { ShPresetGroup } from "@shakilabs/ui";
import { PURCHASE_PRICE_PRESETS } from "@/data/acquisitionTax";
import { formatWon, parseNumericInput } from "@/lib/utils";
import type { AcquisitionTaxInput } from "@/utils/housingCalculator";

const form = defineModel<AcquisitionTaxInput>({ required: true });
const purchasePricePresetOptions = PURCHASE_PRICE_PRESETS.map((value) => ({
  label: formatWon(value),
  value,
}));

function setPreset(price: number) {
  form.value = { ...form.value, purchasePrice: price };
}
</script>

<template>
  <section class="retro-panel-muted space-y-4 p-4">
    <!-- 매매가 + 프리셋 -->
    <div class="space-y-1.5">
      <label class="text-caption font-semibold text-foreground">매매가</label>
      <input
        aria-label="매매가"
        type="text"
        inputmode="numeric"
        class="retro-input"
        :value="form.purchasePrice.toLocaleString('ko-KR')"
        @input="form.purchasePrice = parseNumericInput(($event.target as HTMLInputElement).value)"
      />
      <ShPresetGroup
        :model-value="form.purchasePrice"
        :options="purchasePricePresetOptions"
        label="매매가 빠른 선택"
        @update:model-value="setPreset"
      />
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <!-- 주택 수 -->
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">보유 주택 수</span>
        <select v-model.number="form.homeCount" class="retro-input">
          <option :value="1">1주택 (기본세율)</option>
          <option :value="2">2주택</option>
          <option :value="3">3주택 이상</option>
        </select>
      </label>

      <!-- 전용면적 -->
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">전용면적 (㎡)</span>
        <input v-model.number="form.exclusiveArea" class="retro-input" min="10" max="500" step="1" type="number" />
        <p class="text-[10px] text-muted-foreground">85㎡ ≈ 25.7평, 초과 시 농특세 부과</p>
      </label>
    </div>

    <!-- 조정대상지역 -->
    <label class="retro-panel flex items-center gap-2 px-3 py-3 w-full">
      <input v-model="form.isRegulatedArea" class="retro-checkbox" type="checkbox" />
      <span class="text-caption font-semibold">조정대상지역</span>
      <span class="text-[10px] text-muted-foreground ml-1">(2주택 이상 시 중과)</span>
    </label>
  </section>
</template>
