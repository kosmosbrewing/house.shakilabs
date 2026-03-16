<script setup lang="ts">
import { DEPOSIT_PRESETS, OVERDUE_DAY_PRESETS } from "@/data/delayInterest";
import type { DelayInterestInput } from "@/utils/housingCalculator";
import { formatNumber } from "@/lib/utils";

const model = defineModel<DelayInterestInput>({ required: true });
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-3">
        <label for="delay-deposit" class="text-caption font-semibold text-foreground">보증금</label>
        <span class="retro-kbd">현재 {{ formatNumber(model.depositAmount) }}원</span>
      </div>
      <input
        id="delay-deposit"
        v-model.number="model.depositAmount"
        type="number"
        inputmode="numeric"
        min="1000000"
        step="1000000"
        class="retro-input"
      />
      <div class="flex flex-wrap gap-2">
        <button
          v-for="preset in DEPOSIT_PRESETS"
          :key="preset"
          type="button"
          class="rounded-full border border-border bg-background px-3 py-1.5 text-caption font-semibold hover:border-primary hover:text-primary"
          @click="model.depositAmount = preset"
        >
          {{ formatNumber(preset) }}원
        </button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-3">
          <label for="delay-days" class="text-caption font-semibold text-foreground">지연 일수</label>
          <span class="retro-kbd">{{ model.overdueDays }}일</span>
        </div>
        <input
          v-model.number="model.overdueDays"
          type="range"
          min="1"
          max="365"
          step="1"
          class="w-full accent-primary"
          aria-label="지연 일수 슬라이더"
        />
        <input
          id="delay-days"
          v-model.number="model.overdueDays"
          type="number"
          inputmode="numeric"
          min="1"
          max="730"
          class="retro-input"
        />
        <div class="flex flex-wrap gap-2">
          <button
            v-for="preset in OVERDUE_DAY_PRESETS"
            :key="preset"
            type="button"
            class="rounded-full border border-border bg-background px-3 py-1.5 text-caption font-semibold hover:border-primary hover:text-primary"
            @click="model.overdueDays = preset"
          >
            {{ preset }}일
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between gap-3">
          <label for="delay-rate" class="text-caption font-semibold text-foreground">적용 연이율</label>
          <span class="retro-kbd">{{ (model.annualRate * 100).toFixed(1) }}%</span>
        </div>
        <input
          v-model.number="model.annualRate"
          type="range"
          min="0.01"
          max="0.2"
          step="0.005"
          class="w-full accent-primary"
          aria-label="적용 연이율 슬라이더"
        />
        <input
          id="delay-rate"
          v-model.number="model.annualRate"
          type="number"
          inputmode="numeric"
          min="0.01"
          max="0.3"
          step="0.005"
          class="retro-input"
        />
        <p class="text-caption text-muted-foreground">
          기본값은 소송촉진 등에 관한 특례법상 12% 가정입니다.
        </p>
      </div>
    </div>
  </div>
</template>
