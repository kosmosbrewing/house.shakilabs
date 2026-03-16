<script setup lang="ts">
import { formatPercent, formatWon } from "@/lib/utils";

defineProps<{
  result: {
    dealAmount: number;
    maxFee: number;
    effectiveRate: number;
    tier: {
      rate: number;
      label: string;
      cap: number | null;
    };
    vatExcludedNotice: string;
  };
}>();
</script>

<template>
  <div class="space-y-4">
    <div class="retro-stat-grid">
      <div class="retro-stat">
        <p class="retro-stat-label">환산 거래금액</p>
        <p class="retro-stat-value">{{ formatWon(result.dealAmount) }}</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">상한요율</p>
        <p class="retro-stat-value">{{ formatPercent(result.tier.rate, 1) }}</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">의뢰인 1인 최대</p>
        <p class="retro-stat-value text-status-danger">{{ formatWon(result.maxFee) }}</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">실효 요율</p>
        <p class="retro-stat-value">{{ formatPercent(result.effectiveRate, 2) }}</p>
      </div>
    </div>

    <div class="retro-panel-muted p-4 space-y-2">
      <p class="text-body font-semibold text-foreground">적용 구간: {{ result.tier.label }}</p>
      <p class="text-caption leading-relaxed text-muted-foreground">
        {{ result.vatExcludedNotice }}
        <template v-if="result.tier.cap != null"> 한도액이 있는 구간은 한도액까지만 계산합니다.</template>
      </p>
    </div>
  </div>
</template>
