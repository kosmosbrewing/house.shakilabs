<script setup lang="ts">
import type { DelayInterestInput } from "@/utils/housingCalculator";
import { formatPercent, formatWon } from "@/lib/utils";

defineProps<{
  form: DelayInterestInput;
  result: {
    dailyInterest: number;
    totalInterest: number;
    monthlyEquivalentInterest: number;
    totalWithPrincipal: number;
  };
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="retro-stat-grid">
      <div class="retro-stat">
        <p class="retro-stat-label">일 이자</p>
        <p class="retro-stat-value text-status-danger">{{ formatWon(result.dailyInterest) }}</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">누적 지연이자</p>
        <p class="retro-stat-value text-status-danger">{{ formatWon(result.totalInterest) }}</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">월 기준 이자</p>
        <p class="retro-stat-value">{{ formatWon(result.monthlyEquivalentInterest) }}</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">원금+이자</p>
        <p class="retro-stat-value">{{ formatWon(result.totalWithPrincipal) }}</p>
      </div>
    </div>

    <div class="retro-panel-muted p-4">
      <p class="text-caption leading-relaxed text-muted-foreground">
        {{ form.overdueDays }}일 동안 {{ formatPercent(form.annualRate, 1) }} 가정 시
        보증금 {{ formatWon(form.depositAmount) }}에 대한 지연이자는
        <span class="font-bold text-status-danger">{{ formatWon(result.totalInterest) }}</span>입니다.
      </p>
    </div>
  </div>
</template>
