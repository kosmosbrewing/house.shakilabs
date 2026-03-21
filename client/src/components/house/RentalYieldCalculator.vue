<script setup lang="ts">
import { computed } from "vue";
import { TrendingUp, Wallet, Home, Percent } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import {
  PURCHASE_PRICE_PRESETS,
  LOAN_RATE_PRESETS,
  VACANCY_RATE_PRESETS,
  RENTAL_YIELD_SOURCES,
  RENTAL_YIELD_UPDATED,
} from "@/data/rentalYield";
import { formatWon, formatPercent, parseNumericInput } from "@/lib/utils";
import type { RentalYieldInput, RentalYieldResult } from "@/utils/housingCalculator";

const form = defineModel<RentalYieldInput>({ required: true });

const props = defineProps<{
  result: RentalYieldResult;
}>();

const statItems = computed(() => [
  {
    label: "순수익률 (Net)",
    value: formatPercent(props.result.netYield, 1),
    cls: props.result.netYield >= 0 ? "text-primary" : "text-fee",
  },
  {
    label: "자기자본수익률",
    value: formatPercent(props.result.roe, 1),
    cls: props.result.roe >= 0 ? "" : "text-fee",
  },
  {
    label: "총수익률 (Gross)",
    value: formatPercent(props.result.grossYield, 1),
    cls: "text-muted-foreground",
  },
  {
    label: "월 순수익",
    value: formatWon(props.result.monthlyNetIncome),
    cls: props.result.monthlyNetIncome >= 0 ? "" : "text-fee",
  },
]);

const statIcons = [Percent, TrendingUp, Home, Wallet] as const;
const statIconClasses = [
  "bg-primary/10 text-primary",
  "bg-primary/10 text-primary",
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
] as const;

function setPricePreset(price: number) {
  form.value = { ...form.value, purchasePrice: price };
}
</script>

<template>
  <div class="space-y-4">
    <!-- 입력 영역 -->
    <section class="retro-panel-muted space-y-4 p-4">
      <!-- 매매가 + 프리셋 -->
      <div class="space-y-1.5">
        <label class="text-caption font-semibold text-foreground">매매가</label>
        <input
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="form.purchasePrice.toLocaleString('ko-KR')"
          @input="form.purchasePrice = parseNumericInput(($event.target as HTMLInputElement).value)"
        />
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="preset in PURCHASE_PRICE_PRESETS"
            :key="preset.value"
            :aria-pressed="form.purchasePrice === preset.value"
            class="rounded-lg border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            :class="{ '!bg-primary/15 !text-primary !border-primary/30': form.purchasePrice === preset.value }"
            @click="setPricePreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <!-- 보증금 -->
        <div class="space-y-1.5">
          <label class="text-caption font-semibold text-foreground">보증금 (전세금)</label>
          <input
            type="text"
            inputmode="numeric"
            class="retro-input"
            :value="form.deposit.toLocaleString('ko-KR')"
            @input="form.deposit = parseNumericInput(($event.target as HTMLInputElement).value)"
          />
        </div>

        <!-- 월세 -->
        <div class="space-y-1.5">
          <label class="text-caption font-semibold text-foreground">월세</label>
          <input
            type="text"
            inputmode="numeric"
            class="retro-input"
            :value="form.monthlyRent.toLocaleString('ko-KR')"
            @input="form.monthlyRent = parseNumericInput(($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <!-- 대출금액 -->
        <div class="space-y-1.5">
          <label class="text-caption font-semibold text-foreground">대출 금액</label>
          <input
            type="text"
            inputmode="numeric"
            class="retro-input"
            :value="form.loanAmount.toLocaleString('ko-KR')"
            @input="form.loanAmount = parseNumericInput(($event.target as HTMLInputElement).value)"
          />
        </div>

        <!-- 대출금리 -->
        <div class="space-y-1.5">
          <label class="text-caption font-semibold text-foreground">
            대출 금리: {{ (form.loanRate * 100).toFixed(1) }}%
          </label>
          <input
            v-model.number="form.loanRate"
            type="range"
            min="0"
            max="0.1"
            step="0.005"
            class="w-full accent-primary"
          />
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="preset in LOAN_RATE_PRESETS"
              :key="preset.value"
              :aria-pressed="form.loanRate === preset.value"
              class="rounded-lg border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              :class="{ '!bg-primary/15 !text-primary !border-primary/30': form.loanRate === preset.value }"
              @click="form.loanRate = preset.value"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <!-- 월 관리비·수선비 -->
        <div class="space-y-1.5">
          <label class="text-caption font-semibold text-foreground">월 관리비·수선비</label>
          <input
            type="text"
            inputmode="numeric"
            class="retro-input"
            :value="form.monthlyExpense.toLocaleString('ko-KR')"
            @input="form.monthlyExpense = parseNumericInput(($event.target as HTMLInputElement).value)"
          />
        </div>

        <!-- 공실률 -->
        <div class="space-y-1.5">
          <label class="text-caption font-semibold text-foreground">
            공실률: {{ (form.vacancyRate * 100).toFixed(0) }}%
          </label>
          <input
            v-model.number="form.vacancyRate"
            type="range"
            min="0"
            max="0.5"
            step="0.05"
            class="w-full accent-primary"
          />
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="preset in VACANCY_RATE_PRESETS"
              :key="preset.value"
              :aria-pressed="form.vacancyRate === preset.value"
              class="rounded-lg border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              :class="{ '!bg-primary/15 !text-primary !border-primary/30': form.vacancyRate === preset.value }"
              @click="form.vacancyRate = preset.value"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 4칸 stat grid -->
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Card
        v-for="(stat, index) in statItems"
        :key="stat.label"
        class="border-border/50 bg-muted/30"
      >
        <CardContent class="p-3.5">
          <div class="flex items-center gap-2">
            <span
              class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              :class="statIconClasses[index]"
            >
              <component :is="statIcons[index]" class="h-3.5 w-3.5" />
            </span>
            <p class="truncate text-caption uppercase tracking-wide text-muted-foreground">{{ stat.label }}</p>
          </div>
          <p class="mt-2 text-heading font-bold tabular-nums" :class="stat.cls">{{ stat.value }}</p>
        </CardContent>
      </Card>
    </div>

    <!-- 수익 분석 상세 -->
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
            <span class="font-medium text-fee tabular-nums">-{{ formatWon(result.vacancyLoss) }}</span>
          </li>
          <li class="flex justify-between">
            <span>연간 실 임대수입</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.annualRentNet) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between">
            <span>연간 대출이자</span>
            <span class="font-medium text-fee tabular-nums">-{{ formatWon(result.annualLoanInterest) }}</span>
          </li>
          <li class="flex justify-between">
            <span>연간 관리비·수선비</span>
            <span class="font-medium text-fee tabular-nums">-{{ formatWon(result.annualExpense) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between font-semibold text-foreground">
            <span>연간 순수익</span>
            <span class="tabular-nums" :class="result.annualNetIncome >= 0 ? 'text-primary' : 'text-fee'">
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
