<script setup lang="ts">
import { computed } from "vue";
import { TrendingUp, Wallet, Home, Percent } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import RentalYieldCharts from "@/components/house/RentalYieldCharts.vue";
import HouseStatGrid from "@/components/house/HouseStatGrid.vue";
import { RENTAL_YIELD_SOURCES, RENTAL_YIELD_UPDATED } from "@/data/rentalYield";
import { formatWon, formatPercent } from "@/lib/utils";
import type { RentalYieldInput, RentalYieldResult } from "@/utils/housingCalculator";

const props = defineProps<{
  form: RentalYieldInput;
  result: RentalYieldResult;
}>();

// 순수익이 음수면 투자가 손실 상태라는 진짜 위험 신호다 — status-danger를 유지한다.
const statItems = computed(() => [
  {
    label: "순수익률 (Net)",
    value: formatPercent(props.result.netYield, 1),
    cls: props.result.netYield >= 0 ? "text-primary" : "text-status-danger",
  },
  {
    label: "자기자본수익률",
    value: formatPercent(props.result.roe, 1),
    cls: props.result.roe >= 0 ? "" : "text-status-danger",
  },
  {
    label: "총수익률 (Gross)",
    value: formatPercent(props.result.grossYield, 1),
    cls: "text-muted-foreground",
  },
  {
    label: "월 순수익",
    value: formatWon(props.result.monthlyNetIncome),
    cls: props.result.monthlyNetIncome >= 0 ? "" : "text-status-danger",
  },
]);

const statIcons = [Percent, TrendingUp, Home, Wallet] as const;
const statIconClasses = [
  "bg-primary/10 text-primary",
  "bg-primary/10 text-primary",
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
] as const;
</script>

<template>
  <div class="space-y-4">
    <HouseStatGrid :items="statItems" :icons="statIcons" :icon-classes="statIconClasses" :hero-index="0" />

    <RentalYieldCharts :result="result" />

    <Card>
      <CardContent class="p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TrendingUp class="h-3.5 w-3.5" />
          </span>
          <p class="text-caption font-semibold text-foreground">수익 분석 상세</p>
        </div>

        <ul class="space-y-2 text-caption leading-relaxed text-muted-foreground">
          <li class="flex justify-between">
            <span>연간 임대수입 (공실 전)</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.annualRentGross) }}</span>
          </li>
          <li class="flex justify-between">
            <span>공실 손실 ({{ (form.vacancyRate * 100).toFixed(0) }}%)</span>
            <span class="font-medium text-foreground tabular-nums">-{{ formatWon(result.vacancyLoss) }}</span>
          </li>
          <li class="flex justify-between">
            <span>연간 실 임대수입</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.annualRentNet) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between">
            <span>연간 대출이자</span>
            <span class="font-medium text-foreground tabular-nums">-{{ formatWon(result.annualLoanInterest) }}</span>
          </li>
          <li class="flex justify-between">
            <span>연간 관리비·수선비</span>
            <span class="font-medium text-foreground tabular-nums">-{{ formatWon(result.annualExpense) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between font-semibold text-foreground">
            <span>연간 순수익</span>
            <span class="tabular-nums" :class="result.annualNetIncome >= 0 ? 'text-primary' : 'text-status-danger'">
              {{ formatWon(result.annualNetIncome) }}
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>

    <!-- 투자금 구성 -->
    <Card>
      <CardContent class="p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Wallet class="h-3.5 w-3.5" />
          </span>
          <p class="text-caption font-semibold text-foreground">투자금 구성</p>
        </div>

        <ul class="space-y-2 text-caption leading-relaxed text-muted-foreground">
          <li class="flex justify-between">
            <span>매매가</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.purchasePrice) }}</span>
          </li>
          <li class="flex justify-between">
            <span>대출금</span>
            <span class="font-medium text-foreground tabular-nums">-{{ formatWon(form.loanAmount) }}</span>
          </li>
          <li class="flex justify-between">
            <span>보증금 (임차인)</span>
            <span class="font-medium text-foreground tabular-nums">-{{ formatWon(result.deposit) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between font-semibold text-foreground">
            <span>실 투입 자기자본</span>
            <span class="tabular-nums">{{ formatWon(result.equity) }}</span>
          </li>
        </ul>
      </CardContent>
    </Card>

    <CompareSourceFooter :sources="[...RENTAL_YIELD_SOURCES]" :updated-at="RENTAL_YIELD_UPDATED" />
  </div>
</template>
