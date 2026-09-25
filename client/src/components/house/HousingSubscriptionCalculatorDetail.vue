<script setup lang="ts">
// 1×2 결과 칸이 입력보다 300px 이상 길어져(rule 2) HousingSubscriptionCalculatorResult에서 분리했다 —
// 계산기 아래 전폭 패널로 렌더한다. 계산식은 바꾸지 않았다.
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateHousingSubscriptionScore } from "@/utils/housingCalculator";

defineProps<{
  result: ReturnType<typeof calculateHousingSubscriptionScore>;
}>();
</script>

<template>
  <Card>
    <CardContent class="p-4">
      <div class="flex items-center gap-2 mb-3">
        <p class="text-caption font-semibold text-foreground">{{ result.competitivenessLabel }}</p>
        <Badge variant="secondary" class="shrink-0 rounded-full">{{ result.totalScore }} / 84</Badge>
      </div>
      <p class="text-caption leading-relaxed text-muted-foreground">
        최고점 84점까지 {{ result.remainingToMax }}점 남았습니다. 민영주택 청약은 지역, 면적, 추첨 비중에 따라
        체감 난도가 달라지므로 가점 외 추첨 물량도 같이 확인하는 것이 좋습니다.
      </p>
    </CardContent>
  </Card>
</template>
