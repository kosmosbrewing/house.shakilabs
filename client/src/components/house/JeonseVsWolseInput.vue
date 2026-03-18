<script setup lang="ts">
import { OPPORTUNITY_RATE_PRESETS } from "@/data/jeonseWolse";
import type { JeonseVsWolseInput } from "@/utils/housingCalculator";
import { parseNumericInput } from "@/lib/utils";

const model = defineModel<JeonseVsWolseInput>({ required: true });
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <label for="jeonse-deposit" class="text-caption font-semibold text-foreground">전세 보증금</label>
        <input id="jeonse-deposit" type="text" inputmode="numeric" class="retro-input" :value="model.jeonseDeposit.toLocaleString('ko-KR')" @input="model.jeonseDeposit = parseNumericInput(($event.target as HTMLInputElement).value)" />
      </div>
      <div class="space-y-2">
        <label for="wolse-deposit" class="text-caption font-semibold text-foreground">월세 보증금</label>
        <input id="wolse-deposit" type="text" inputmode="numeric" class="retro-input" :value="model.wolseDeposit.toLocaleString('ko-KR')" @input="model.wolseDeposit = parseNumericInput(($event.target as HTMLInputElement).value)" />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <label for="monthly-rent" class="text-caption font-semibold text-foreground">월세</label>
        <input id="monthly-rent" type="text" inputmode="numeric" class="retro-input" :value="model.monthlyRent.toLocaleString('ko-KR')" @input="model.monthlyRent = parseNumericInput(($event.target as HTMLInputElement).value)" />
      </div>
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-3">
          <label for="opportunity-rate" class="text-caption font-semibold text-foreground">보증금 기회비용 금리</label>
          <span class="retro-kbd">{{ (model.annualOpportunityRate * 100).toFixed(1) }}%</span>
        </div>
        <input
          v-model.number="model.annualOpportunityRate"
          type="range"
          min="0.01"
          max="0.1"
          step="0.005"
          class="w-full accent-primary"
          aria-label="보증금 기회비용 금리 슬라이더"
        />
        <div class="flex flex-wrap gap-2">
          <button
            v-for="preset in OPPORTUNITY_RATE_PRESETS"
            :key="preset"
            type="button"
            class="rounded-full border border-border bg-background px-3 py-1.5 text-caption font-semibold hover:border-primary hover:text-primary"
            @click="model.annualOpportunityRate = preset"
          >
            {{ (preset * 100).toFixed(1) }}%
          </button>
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between gap-3">
        <label for="analysis-years" class="text-caption font-semibold text-foreground">비교 기간</label>
        <span class="retro-kbd">{{ model.analysisYears }}년</span>
      </div>
      <input id="analysis-years" v-model.number="model.analysisYears" type="range" min="1" max="5" step="1" class="w-full accent-primary" />
    </div>
  </div>
</template>
