<script setup lang="ts">
import {
  MONTHLY_RENT_PRESETS,
  RENT_DEPOSIT_PRESETS,
  SALE_PRICE_PRESETS,
} from "@/data/brokerageRates";
import type { BrokerageFeeInput } from "@/utils/housingCalculator";
import { formatNumber, parseNumericInput } from "@/lib/utils";

const model = defineModel<BrokerageFeeInput>({ required: true });
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-2 sm:grid-cols-3">
      <label class="retro-step cursor-pointer" :class="model.dealType === 'sale' ? 'border-primary bg-primary/10' : ''">
        <input v-model="model.dealType" type="radio" value="sale" class="retro-radio" />
        <span>매매</span>
      </label>
      <label class="retro-step cursor-pointer" :class="model.dealType === 'jeonse' ? 'border-primary bg-primary/10' : ''">
        <input v-model="model.dealType" type="radio" value="jeonse" class="retro-radio" />
        <span>전세</span>
      </label>
      <label class="retro-step cursor-pointer" :class="model.dealType === 'monthly' ? 'border-primary bg-primary/10' : ''">
        <input v-model="model.dealType" type="radio" value="monthly" class="retro-radio" />
        <span>월세</span>
      </label>
    </div>

    <div class="space-y-2">
      <label for="brokerage-amount" class="text-caption font-semibold text-foreground">
        {{ model.dealType === "sale" ? "거래금액" : "보증금" }}
      </label>
      <input id="brokerage-amount" type="text" inputmode="numeric" class="retro-input" :value="model.amount.toLocaleString('ko-KR')" @input="model.amount = parseNumericInput(($event.target as HTMLInputElement).value)" />
      <div class="flex flex-wrap gap-2">
        <button
          v-for="preset in model.dealType === 'sale' ? SALE_PRICE_PRESETS : RENT_DEPOSIT_PRESETS"
          :key="preset"
          type="button"
          class="rounded-full border border-border bg-background px-3 py-1.5 text-caption font-semibold hover:border-primary hover:text-primary"
          @click="model.amount = preset"
        >
          {{ formatNumber(preset) }}원
        </button>
      </div>
    </div>

    <div v-if="model.dealType === 'monthly'" class="space-y-2">
      <label for="brokerage-monthly-rent" class="text-caption font-semibold text-foreground">월세</label>
      <input id="brokerage-monthly-rent" type="text" inputmode="numeric" class="retro-input" :value="model.monthlyRent.toLocaleString('ko-KR')" @input="model.monthlyRent = parseNumericInput(($event.target as HTMLInputElement).value)" />
      <div class="flex flex-wrap gap-2">
        <button
          v-for="preset in MONTHLY_RENT_PRESETS"
          :key="preset"
          type="button"
          class="rounded-full border border-border bg-background px-3 py-1.5 text-caption font-semibold hover:border-primary hover:text-primary"
          @click="model.monthlyRent = preset"
        >
          {{ formatNumber(preset) }}원
        </button>
      </div>
    </div>
  </div>
</template>
