<script setup lang="ts">
import { ref, watch } from "vue";
import {
  CIVIL_DELAY_INTEREST_RATE,
  DEPOSIT_PRESETS,
  LITIGATION_DELAY_INTEREST_RATE,
  OVERDUE_DAY_PRESETS,
} from "@/data/delayInterest";
import type { DelayInterestInput } from "@/utils/housingCalculator";
import {
  calculateInclusiveOverdueDays,
  parseAnnualRatePercent,
} from "@/utils/delayInterestInput";
import { formatNumber, parseNumericInput } from "@/lib/utils";

const model = defineModel<DelayInterestInput>({ required: true });

const ratePresets = [
  { label: "약정 없음 · 민법 5%", value: CIVIL_DELAY_INTEREST_RATE },
  { label: "소장 송달 다음 날 이후 · 12%", value: LITIGATION_DELAY_INTEREST_RATE },
] as const;

const interestStartDate = ref("");
const calculationEndDate = ref("");
const dateError = ref("");

function updateAnnualRate(event: Event) {
  const rate = parseAnnualRatePercent((event.target as HTMLInputElement).value);
  if (rate != null) model.value.annualRate = rate;
}

function updateOverdueDaysFromDates() {
  if (!interestStartDate.value || !calculationEndDate.value) {
    dateError.value = "";
    return;
  }
  const days = calculateInclusiveOverdueDays(interestStartDate.value, calculationEndDate.value);
  if (days == null) {
    dateError.value = "종료일은 시작일 이후여야 하며 계산 범위는 최대 730일입니다.";
    return;
  }
  model.value.overdueDays = days;
  dateError.value = "";
}

watch([interestStartDate, calculationEndDate], updateOverdueDaysFromDates);
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <div class="delay-field-heading flex items-center justify-between gap-3">
        <label for="delay-deposit" class="text-caption font-semibold text-foreground">보증금</label>
        <span class="delay-current-value retro-kbd">현재 {{ formatNumber(model.depositAmount) }}원</span>
      </div>
      <input
        id="delay-deposit"
        type="text"
        inputmode="numeric"
        class="retro-input"
        :value="model.depositAmount.toLocaleString('ko-KR')"
        @input="model.depositAmount = parseNumericInput(($event.target as HTMLInputElement).value)"
      />
      <div class="flex flex-wrap gap-2">
        <button
          v-for="preset in DEPOSIT_PRESETS"
          :key="preset"
          type="button"
          class="min-h-[44px] rounded-full border border-border bg-background px-3 py-1.5 text-caption font-semibold hover:border-primary hover:text-primary"
          @click="model.depositAmount = preset"
        >
          {{ formatNumber(preset) }}원
        </button>
      </div>
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">이자 계산 시작일</span>
        <input v-model="interestStartDate" type="date" class="delay-date-input retro-input" />
      </label>
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">계산 종료일 (포함)</span>
        <input v-model="calculationEndDate" type="date" class="delay-date-input retro-input" />
      </label>
    </div>
    <p v-if="dateError" role="alert" class="text-caption text-status-danger">{{ dateError }}</p>
    <p v-else class="text-caption leading-relaxed text-muted-foreground">
      법적으로 확인한 첫 이자 발생일과 계산 종료일을 넣으면 지연 일수를 자동 계산합니다.
    </p>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <div class="delay-field-heading flex items-center justify-between gap-3">
          <label for="delay-days" class="text-caption font-semibold text-foreground">지연 일수</label>
          <span class="delay-current-value retro-kbd">{{ model.overdueDays }}일</span>
        </div>
        <input
          v-model.number="model.overdueDays"
          type="range"
          min="1"
          max="365"
          step="1"
          class="h-[44px] w-full accent-primary"
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
            class="min-h-[44px] rounded-full border border-border bg-background px-3 py-1.5 text-caption font-semibold hover:border-primary hover:text-primary"
            @click="model.overdueDays = preset"
          >
            {{ preset }}일
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <div class="delay-field-heading flex items-center justify-between gap-3">
          <label for="delay-rate" class="text-caption font-semibold text-foreground">적용 연이율</label>
          <span class="delay-current-value retro-kbd">{{ (model.annualRate * 100).toFixed(1) }}%</span>
        </div>
        <input
          v-model.number="model.annualRate"
          type="range"
          min="0.01"
          max="0.2"
          step="0.005"
          class="h-[44px] w-full accent-primary"
          aria-label="적용 연이율 슬라이더"
        />
        <input
          id="delay-rate"
          :value="(model.annualRate * 100).toFixed(1)"
          type="number"
          inputmode="decimal"
          min="1"
          max="30"
          step="0.5"
          class="retro-input"
          @input="updateAnnualRate"
        />
        <div class="grid gap-2">
          <button
            v-for="preset in ratePresets"
            :key="preset.value"
            type="button"
            class="min-h-[44px] rounded-lg border border-border bg-background px-3 py-2 text-left text-caption font-semibold hover:border-primary hover:text-primary"
            :class="{ 'border-primary bg-primary/10 text-primary': model.annualRate === preset.value }"
            :aria-pressed="model.annualRate === preset.value"
            @click="model.annualRate = preset.value"
          >
            {{ preset.label }}
          </button>
        </div>
        <p class="text-caption text-muted-foreground">
          약정 이율이 있으면 직접 입력하세요. 12%는 계약 종료일에 자동 적용되지 않습니다.
        </p>
      </div>
    </div>
  </div>
</template>
