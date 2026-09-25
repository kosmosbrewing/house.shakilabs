<script setup lang="ts">
// 1×2 결과 칸이 입력보다 300px 이상 길어져(rule 2) FirstHomeCalculatorResult에서 분리했다 —
// 계산기 아래 전폭 패널로 렌더한다. 계산식은 바꾸지 않았다.
import { ListChecks, Lightbulb } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import { calculateFirstHomeBenefits } from "@/utils/housingCalculator";
import { formatPercent, formatWon } from "@/lib/utils";

defineProps<{
  result: ReturnType<typeof calculateFirstHomeBenefits>;
}>();
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <Card>
      <CardContent class="p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ListChecks class="h-3.5 w-3.5" />
          </span>
          <p class="text-caption font-semibold text-foreground">혜택 요약</p>
        </div>
        <ul class="space-y-2 text-caption leading-relaxed text-muted-foreground">
          <li>취득세 일반세율: {{ formatPercent(result.taxRate, 2) }}</li>
          <li>생애최초 감면 추정: {{ formatWon(result.estimatedTaxRelief) }}</li>
          <li>적용 LTV: {{ formatPercent(result.ltvLimit, 0) }}</li>
          <li>금리 우대 가정: {{ formatPercent(result.rateDiscount, 1) }}</li>
        </ul>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Lightbulb class="h-3.5 w-3.5" />
          </span>
          <p class="text-caption font-semibold text-foreground">판단 포인트</p>
        </div>
        <p class="text-caption leading-relaxed text-muted-foreground">
          {{
            result.didimdolEligible
              ? `현재 입력값 기준으로 디딤돌 한도 ${formatWon(result.didimdolLoanAmount)}까지 검토 가능합니다.`
              : "소득 또는 생애최초 조건이 맞지 않아 디딤돌 기본 혜택은 제외하고 계산했습니다."
          }}
        </p>
        <p class="mt-2 text-caption leading-relaxed text-muted-foreground">
          취득세 감면은 참고 계산이며, 실제 적용 여부는 계약 형태와 세대요건을 관할 지자체에서 다시 확인해야 합니다.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
