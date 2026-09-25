<script setup lang="ts">
import { computed } from "vue";
import { Percent, Scale, AlertTriangle, CheckCircle2, ArrowDown } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import ThresholdComparison from "@/components/result-visualization/ThresholdComparison.vue";
import HouseStatGrid from "@/components/house/HouseStatGrid.vue";
import { JEONSE_WOLSE_RATE_SOURCES, JEONSE_WOLSE_RATE_UPDATED } from "@/data/jeonseWolseRate";
import { formatWon, formatPercent } from "@/lib/utils";
import type { JeonseWolseRateInput, JeonseWolseRateResult } from "@/utils/housingCalculator";

const props = defineProps<{
  form: JeonseWolseRateInput;
  result: JeonseWolseRateResult;
}>();

const judgmentLabel = computed(() => {
  switch (props.result.judgment) {
    case "excessive":
      return "법정 상한 초과";
    case "below":
      return "법정 상한 이내";
    case "appropriate":
      return "법정 상한 근접";
  }
});

// 법정 상한 "초과"는 진짜 위험 신호다(DESIGN_CLEANUP_PLAN — 한도 초과는 빨강 유지 대상).
// 폐기된 --fee 로컬 별칭 대신 status-danger로 직접 표현한다.
const judgmentCls = computed(() => {
  switch (props.result.judgment) {
    case "excessive":
      return "text-status-danger";
    case "below":
      return "text-primary";
    case "appropriate":
      return "text-foreground";
  }
});

// 월세 보증금이 전세 보증금 이상이면 전환율 계산 불가
const isDepositInvalid = computed(() => props.form.wolseDeposit >= props.form.jeonseDeposit);

const statItems = computed(() => [
  {
    label: "실제 전환율",
    value: formatPercent(props.result.actualConversionRate, 2),
    cls: props.result.judgment === "excessive" ? "text-status-danger" : "text-primary",
  },
  {
    label: "법정 상한",
    value: formatPercent(props.result.legalRateCap, 1),
    cls: "text-muted-foreground",
  },
  {
    label: "판정",
    value: judgmentLabel.value,
    cls: judgmentCls.value,
  },
  {
    label: "적정 월세",
    value: formatWon(props.result.fairMonthlyRent),
    cls: "",
  },
]);
const rateComparisonMessages = {
  above: "법정 상한을 초과했습니다. 적용 대상 계약인지와 계약 조건을 함께 확인하세요.",
  equal: "법정 상한과 같은 수준입니다. 월세와 보증금 조건을 함께 확인하세요.",
  below: "법정 상한 이내입니다. 계약 조건과 실제 적용 여부를 함께 확인하세요.",
} as const;
const statIcons = computed(() => [
  Percent,
  Scale,
  props.result.judgment === "excessive" ? AlertTriangle : CheckCircle2,
  ArrowDown,
] as const);
const statIconClasses = computed(() => [
  props.result.judgment === "excessive" ? "bg-status-danger/10 text-status-danger" : "bg-primary/10 text-primary",
  "bg-muted text-muted-foreground",
  props.result.judgment === "excessive" ? "bg-status-danger/10 text-status-danger" : "bg-primary/10 text-primary",
  "bg-muted text-muted-foreground",
] as const);

function formatRate(value: number): string {
  return formatPercent(value, 2);
}

function formatRateScale(value: number): string {
  return formatPercent(value, 1);
}

function formatPercentagePoint(value: number): string {
  return `${(value * 100).toFixed(1)}%p`;
}
</script>

<template>
  <div class="space-y-4">
    <!-- 보증금 역전 경고 -->
    <div v-if="isDepositInvalid" class="rounded-xl border border-status-danger/30 bg-status-danger/5 p-4">
      <p class="flex items-center gap-2 font-semibold text-status-danger">
        <AlertTriangle class="h-4 w-4 shrink-0" />
        월세 보증금이 전세 보증금 이상이면 전환율을 계산할 수 없습니다.
      </p>
    </div>

    <HouseStatGrid
      v-if="!isDepositInvalid"
      :items="statItems"
      :icons="statIcons"
      :icon-classes="statIconClasses"
      :hero-index="0"
    />

    <ThresholdComparison
      v-if="!isDepositInvalid"
      title="실제·법정 전환율 비교"
      note="하나의 0% 기준 track에서 실제 전환율과 법정 상한을 비교합니다."
      actual-label="실제 전환율"
      threshold-label="법정 상한"
      :actual-value="result.actualConversionRate"
      :threshold-value="result.legalRateCap"
      :scale-step="0.01"
      :format-value="formatRate"
      :format-scale-value="formatRateScale"
      :format-difference="formatPercentagePoint"
      :messages="rateComparisonMessages"
    />

    <!-- 분석 상세 -->
    <Card v-if="!isDepositInvalid">
      <CardContent class="p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Percent class="h-3.5 w-3.5" />
          </span>
          <p class="text-caption font-semibold text-foreground">전환율 분석</p>
        </div>

        <ul class="space-y-2 text-caption leading-relaxed text-muted-foreground">
          <li class="flex justify-between">
            <span>보증금 차액</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.depositDifference) }}</span>
          </li>
          <li class="flex justify-between">
            <span>연간 월세 합계</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(form.monthlyRent * 12) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between">
            <span>실제 전환율</span>
            <span class="font-medium tabular-nums" :class="result.judgment === 'excessive' ? 'text-status-danger' : 'text-primary'">
              {{ formatPercent(result.actualConversionRate, 2) }}
            </span>
          </li>
          <li class="flex justify-between">
            <span>법정 상한 전환율</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatPercent(result.legalRateCap, 1) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between">
            <span>법정 상한 기준 적정 월세</span>
            <span class="font-medium text-primary tabular-nums">{{ formatWon(result.fairMonthlyRent) }}</span>
          </li>
          <li class="flex justify-between">
            <span>현재 월세와 차이</span>
            <span class="font-medium tabular-nums" :class="result.monthlyRentGap > 0 ? 'text-status-danger' : 'text-primary'">
              {{ result.monthlyRentGap > 0 ? '+' : '' }}{{ formatWon(result.monthlyRentGap) }}
            </span>
          </li>
          <li v-if="result.annualExcessBurden > 0" class="flex justify-between font-semibold text-foreground">
            <span>연간 초과 부담</span>
            <span class="tabular-nums text-status-danger">{{ formatWon(result.annualExcessBurden) }}</span>
          </li>
        </ul>
      </CardContent>
    </Card>

    <!-- 보증금 조정 시뮬레이션 -->
    <Card v-if="!isDepositInvalid && result.simulations.length > 0">
      <CardContent class="p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Scale class="h-3.5 w-3.5" />
          </span>
          <p class="text-caption font-semibold text-foreground">보증금 조정 시뮬레이션</p>
        </div>
        <p class="mb-3 text-[10px] leading-relaxed text-muted-foreground">
          월세 보증금을 올리면 적정 월세가 낮아집니다. 법정 전환율 {{ formatPercent(result.legalRateCap, 1) }} 기준입니다.
        </p>

        <div class="overflow-x-auto">
          <table aria-label="보증금 조정별 적정 월세" class="w-max min-w-full text-caption">
            <thead>
              <tr class="border-b border-border/40 text-muted-foreground">
                <th scope="col" class="pb-2 text-left font-semibold">보증금 증액</th>
                <th scope="col" class="pb-2 text-right font-semibold">조정 후 보증금</th>
                <th scope="col" class="pb-2 text-right font-semibold">적정 월세</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="sim in result.simulations"
                :key="sim.adjustAmount"
                class="border-b border-border/20"
              >
                <td class="py-2 tabular-nums">+{{ formatWon(sim.adjustAmount) }}</td>
                <td class="py-2 text-right tabular-nums">{{ formatWon(sim.newWolseDeposit) }}</td>
                <td class="py-2 text-right font-medium tabular-nums text-primary">{{ formatWon(sim.newFairMonthlyRent) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <CompareSourceFooter :sources="[...JEONSE_WOLSE_RATE_SOURCES]" :updated-at="JEONSE_WOLSE_RATE_UPDATED" />
  </div>
</template>
