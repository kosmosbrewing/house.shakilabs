<script setup lang="ts">
import { Building2, Landmark } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent, formatWon } from "@/lib/utils";
import type { PropertyTaxInput } from "@/utils/housingCalculator";

defineProps<{
  form: PropertyTaxInput;
  result: ReturnType<typeof import("@/utils/housingCalculator").calculatePropertyTax>;
}>();
</script>

<template>
  <div v-if="result.isSupportedScenario" class="grid gap-4 lg:grid-cols-2">
    <Card>
      <CardContent class="p-4">
        <div class="mb-3 flex items-center gap-2">
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 class="h-3.5 w-3.5" />
          </span>
          <p class="text-caption font-semibold text-foreground">재산세 내역</p>
          <span v-if="result.isSpecialRate" class="ml-auto rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            1주택 특례
          </span>
        </div>
        <ul class="space-y-2 text-caption leading-relaxed text-muted-foreground">
          <li class="flex justify-between">
            <span>
              공시가격
              {{ result.isOfficialPriceEstimated ? `(시가 추정 ${formatPercent(result.realizationRate, 0)})` : "(직접 입력)" }}
            </span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.officialPrice) }}</span>
          </li>
          <li class="flex justify-between">
            <span>공정시장가액비율</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatPercent(result.fairMarketRatio, 0) }}</span>
          </li>
          <li class="flex justify-between">
            <span>과세표준</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.propertyTaxBase) }}</span>
          </li>
          <li v-if="result.propertyTaxBaseCapAmount != null" class="flex justify-between">
            <span>5% 과세표준상한</span>
            <span class="font-medium text-foreground tabular-nums">
              {{ result.propertyTaxBaseCapReduction > 0 ? `-${formatWon(result.propertyTaxBaseCapReduction)}` : "감액 없음" }}
            </span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between">
            <span>재산세 본세 ({{ result.propertyTaxRateLabel }})</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.propertyTax) }}</span>
          </li>
          <li v-if="form.isUrbanArea" class="flex justify-between">
            <span>도시지역분 (0.14%)</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.urbanAreaTax) }}</span>
          </li>
          <li class="flex justify-between">
            <span>지방교육세 (본세 × 20%)</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.localEducationTax) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between font-semibold text-foreground">
            <span>재산세 합계</span>
            <span class="tabular-nums">{{ formatWon(result.propertyTaxTotal) }}</span>
          </li>
        </ul>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-4">
        <div class="mb-3 flex items-center gap-2">
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Landmark class="h-3.5 w-3.5" />
          </span>
          <p class="text-caption font-semibold text-foreground">종부세 내역</p>
          <span v-if="!result.isCompTaxSubject" class="ml-auto rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            대상 아님
          </span>
        </div>

        <ul v-if="result.isCompTaxSubject" class="space-y-2 text-caption leading-relaxed text-muted-foreground">
          <li class="flex justify-between">
            <span>공시가격 − 기본공제 12억</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.officialPrice - 1_200_000_000) }}</span>
          </li>
          <li class="flex justify-between">
            <span>과세표준 (× 60%)</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.compTaxBase) }}</span>
          </li>
          <li class="flex justify-between">
            <span>산출세액 ({{ result.compTaxTierLabel }})</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.compTaxAmount) }}</span>
          </li>
          <li class="flex justify-between">
            <span>공제할 재산세액</span>
            <span class="font-medium text-foreground tabular-nums">-{{ formatWon(result.deductiblePropertyTax) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between">
            <span>고령자 공제</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatPercent(result.elderlyDeduction, 0) }}</span>
          </li>
          <li class="flex justify-between">
            <span>장기보유 공제</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatPercent(result.longHoldDeduction, 0) }}</span>
          </li>
          <li class="flex justify-between">
            <span>합산 공제율 (최대 80%)</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatPercent(result.totalDeductionRate, 0) }}</span>
          </li>
          <li class="flex justify-between">
            <span>공제 후 종부세</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.compTaxAfterDeduction) }}</span>
          </li>
          <li v-if="result.compTaxBurdenCapAmount != null" class="flex justify-between">
            <span>전년 총세액 150% 상한</span>
            <span class="font-medium text-foreground tabular-nums">
              {{ result.compTaxBurdenCapReduction > 0 ? `-${formatWon(result.compTaxBurdenCapReduction)}` : "감액 없음" }}
            </span>
          </li>
          <li class="flex justify-between">
            <span>농어촌특별세 (× 20%)</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.ruralSpecialTax) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between font-semibold text-foreground">
            <span>종부세 합계</span>
            <span class="tabular-nums">{{ formatWon(result.compTaxTotal) }}</span>
          </li>
        </ul>
        <p v-else class="text-caption leading-relaxed text-muted-foreground">
          공시가격 {{ formatWon(result.officialPrice) }}으로 기본공제(12억원) 이하이므로 종부세 대상이 아닙니다.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
