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
// 히어로(index 2, "의뢰인 1인 최대")는 그리드에서 빠져 이 아이콘은 렌더되지 않지만
// --fee 참조를 남기지 않기 위해 accent-muted로 맞춰 둔다.
const statIconClasses = [
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
  "bg-accent text-accent-foreground",
  "bg-muted text-muted-foreground",
] as const;
</script>

<template>
  <div class="space-y-4">
    <!-- v8 결함: 위 결과 카드(leader-value)와 같은 "의뢰인 1인 최대"를 26px 히어로로
         한 번 더 보여줬다(BRIEF-V8 house). hero-index를 빼면 네 항목이 같은 크기 표로만
         남아 중복 노출이 사라진다 — 숫자 자체는 그대로다. -->
    <HouseStatGrid
      :items="[
        { label: '환산 거래금액', value: formatWon(result.dealAmount), cls: '' },
        { label: '상한요율', value: formatPercent(result.tier.rate, 1), cls: '' },
        { label: '의뢰인 1인 최대', value: formatWon(result.maxFee), cls: 'text-primary' },
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
