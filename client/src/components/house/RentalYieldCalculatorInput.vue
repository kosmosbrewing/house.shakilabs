<script setup lang="ts">
import { ShPresetGroup, ShSlider } from "@shakilabs/ui";
import {
  PURCHASE_PRICE_PRESETS,
  LOAN_RATE_PRESETS,
  VACANCY_RATE_PRESETS,
} from "@/data/rentalYield";
import { parseNumericInput } from "@/lib/utils";
import type { RentalYieldInput } from "@/utils/housingCalculator";

const form = defineModel<RentalYieldInput>({ required: true });

function setPricePreset(price: number) {
  form.value = { ...form.value, purchasePrice: price };
}
</script>

<template>
  <section class="retro-panel-muted space-y-4 p-4">
    <div class="space-y-1.5">
      <label for="rental-purchase-price" class="text-caption font-semibold text-foreground">매매가</label>
      <input
        id="rental-purchase-price"
        type="text"
        inputmode="numeric"
        class="retro-input"
        :value="form.purchasePrice.toLocaleString('ko-KR')"
        @input="form.purchasePrice = parseNumericInput(($event.target as HTMLInputElement).value)"
      />
      <ShPresetGroup
        :model-value="form.purchasePrice"
        :options="PURCHASE_PRICE_PRESETS"
        label="매매가 빠른 선택"
        @update:model-value="setPricePreset"
      />
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <!-- 보증금 -->
      <div class="space-y-1.5">
        <label for="rental-deposit" class="text-caption font-semibold text-foreground">보증금 (전세금)</label>
        <input
          id="rental-deposit"
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="form.deposit.toLocaleString('ko-KR')"
          @input="form.deposit = parseNumericInput(($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- 월세 -->
      <div class="space-y-1.5">
        <label for="rental-monthly-rent" class="text-caption font-semibold text-foreground">월세</label>
        <input
          id="rental-monthly-rent"
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="form.monthlyRent.toLocaleString('ko-KR')"
          @input="form.monthlyRent = parseNumericInput(($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <!-- 대출금액 -->
      <div class="space-y-1.5">
        <label for="rental-loan-amount" class="text-caption font-semibold text-foreground">대출 금액</label>
        <input
          id="rental-loan-amount"
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="form.loanAmount.toLocaleString('ko-KR')"
          @input="form.loanAmount = parseNumericInput(($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- 대출금리 -->
      <div class="space-y-1.5">
        <label for="rental-loan-rate" class="text-caption font-semibold text-foreground">
          대출 금리: {{ (form.loanRate * 100).toFixed(1) }}%
        </label>
        <ShSlider
          id="rental-loan-rate"
          v-model="form.loanRate"
          :min="0"
          :max="0.1"
          :step="0.005"
          :value-text="`대출 금리 ${(form.loanRate * 100).toFixed(1)}%`"
        />
        <ShPresetGroup
          v-model="form.loanRate"
          :options="LOAN_RATE_PRESETS"
          label="대출 금리 빠른 선택"
        />
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <!-- 월 관리비·수선비 -->
      <div class="space-y-1.5">
        <label for="rental-monthly-expense" class="text-caption font-semibold text-foreground">월 관리비·수선비</label>
        <input
          id="rental-monthly-expense"
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="form.monthlyExpense.toLocaleString('ko-KR')"
          @input="form.monthlyExpense = parseNumericInput(($event.target as HTMLInputElement).value)"
        />
      </div>

      <!-- 공실률 -->
      <div class="space-y-1.5">
        <label for="rental-vacancy-rate" class="text-caption font-semibold text-foreground">
          공실률: {{ (form.vacancyRate * 100).toFixed(0) }}%
        </label>
        <ShSlider
          id="rental-vacancy-rate"
          v-model="form.vacancyRate"
          :min="0"
          :max="0.5"
          :step="0.05"
          :value-text="`공실률 ${(form.vacancyRate * 100).toFixed(0)}%`"
        />
        <ShPresetGroup
          v-model="form.vacancyRate"
          :options="VACANCY_RATE_PRESETS"
          label="공실률 빠른 선택"
        />
      </div>
    </div>
  </section>
</template>
