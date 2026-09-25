<script setup lang="ts">
import { ShPresetGroup } from "@shakilabs/ui";
import { JEONSE_DEPOSIT_PRESETS, BOK_BASE_RATE, LEGAL_RATE_SPREAD } from "@/data/jeonseWolseRate";
import { formatPercent, parseNumericInput } from "@/lib/utils";
import type { JeonseWolseRateInput } from "@/utils/housingCalculator";

const form = defineModel<JeonseWolseRateInput>({ required: true });

function setDepositPreset(price: number) {
  form.value = { ...form.value, jeonseDeposit: price };
}
</script>

<template>
  <section class="retro-panel-muted space-y-4 p-4">
    <!-- 전세 보증금 + 프리셋 -->
    <div class="space-y-1.5">
      <label for="conversion-jeonse-deposit" class="text-caption font-semibold text-foreground">전세 보증금</label>
      <input
        id="conversion-jeonse-deposit"
        type="text"
        inputmode="numeric"
        class="retro-input"
        :value="form.jeonseDeposit.toLocaleString('ko-KR')"
        @input="form.jeonseDeposit = parseNumericInput(($event.target as HTMLInputElement).value)"
      />
      <ShPresetGroup
        :model-value="form.jeonseDeposit"
        :options="JEONSE_DEPOSIT_PRESETS"
        label="전세 보증금 빠른 선택"
        @update:model-value="setDepositPreset"
      />
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <!-- 월세 보증금 -->
      <div class="space-y-1.5">
        <label for="conversion-wolse-deposit" class="text-caption font-semibold text-foreground">월세 보증금</label>
        <input
          id="conversion-wolse-deposit"
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="form.wolseDeposit.toLocaleString('ko-KR')"
          @input="form.wolseDeposit = parseNumericInput(($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- 월세 -->
      <div class="space-y-1.5">
        <label for="conversion-monthly-rent" class="text-caption font-semibold text-foreground">월세</label>
        <input
          id="conversion-monthly-rent"
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="form.monthlyRent.toLocaleString('ko-KR')"
          @input="form.monthlyRent = parseNumericInput(($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- 법정 전환율 (자동 표시) -->
    <div class="rounded-xl border border-border/50 bg-background/50 p-3">
      <p class="text-caption font-semibold text-muted-foreground">
        법정 전환율 상한 = 기준금리({{ formatPercent(BOK_BASE_RATE, 1) }}) + {{ formatPercent(LEGAL_RATE_SPREAD, 1) }} = <span class="text-foreground">{{ formatPercent(form.legalRateCap, 1) }}</span>
      </p>
      <p class="mt-1 text-[10px] text-muted-foreground">주택임대차보호법 시행령 §9 · 2026.03 기준</p>
    </div>
  </section>
</template>
