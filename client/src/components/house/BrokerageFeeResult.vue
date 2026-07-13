<script setup lang="ts">
import { Receipt, Percent, AlertTriangle, TrendingDown } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import HouseStatGrid from "@/components/house/HouseStatGrid.vue";
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

const statIcons = [Receipt, Percent, AlertTriangle, TrendingDown] as const;
const statIconClasses = [
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
  "bg-fee/10 text-fee",
  "bg-muted text-muted-foreground",
] as const;
</script>

<template>
  <div class="space-y-4">
    <HouseStatGrid
      :items="[
        { label: '환산 거래금액', value: formatWon(result.dealAmount), cls: '' },
        { label: '상한요율', value: formatPercent(result.tier.rate, 1), cls: '' },
        { label: '의뢰인 1인 최대', value: formatWon(result.maxFee), cls: 'text-fee' },
        { label: '실효 요율', value: formatPercent(result.effectiveRate, 2), cls: '' },
      ]"
      :icons="statIcons"
      :icon-classes="statIconClasses"
    />

    <Card class="border-border/50 bg-muted/30">
      <CardContent class="p-4 space-y-2">
        <div class="flex items-center gap-2">
          <p class="text-body font-semibold text-foreground">적용 구간: {{ result.tier.label }}</p>
          <Badge variant="secondary" class="shrink-0 rounded-full">{{ formatPercent(result.tier.rate, 1) }}</Badge>
        </div>
        <p class="text-caption leading-relaxed text-muted-foreground">
          {{ result.vatExcludedNotice }}
          <template v-if="result.tier.cap != null"> 한도액이 있는 구간은 한도액까지만 계산합니다.</template>
        </p>
      </CardContent>
    </Card>
  </div>
</template>
