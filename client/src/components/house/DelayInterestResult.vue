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
  <!-- 수치 4종(일 이자·누적·월 기준·원금+이자)은 바로 위 요약 배너와 동일해 제거하고,
       배너가 담지 못하는 해석 문장만 남긴다 -->
  <div class="space-y-4">
    <div class="delay-result-note retro-panel-muted p-4">
      <p class="text-caption leading-relaxed text-muted-foreground">
        {{ form.overdueDays }}일 동안 {{ formatPercent(form.annualRate, 1) }} 가정 시
        보증금 {{ formatWon(form.depositAmount) }}에 대한 지연이자는
        <span class="font-bold text-status-danger">{{ formatWon(result.totalInterest) }}</span>입니다.
      </p>
    </div>
  </div>
</template>
