<script setup lang="ts">
import { computed, reactive } from "vue";
import { Receipt, ShieldCheck, Landmark, Wallet, ListChecks, Lightbulb } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import {
  DEFAULT_FIRST_HOME_INPUT,
  sanitizeFirstHomeInput,
} from "@/lib/housingValidators";
import { calculateFirstHomeBenefits } from "@/utils/housingCalculator";
import { FIRST_HOME_SOURCES } from "@/data/firstHome";
import { formatPercent, formatWon, parseNumericInput } from "@/lib/utils";

const form = reactive({ ...DEFAULT_FIRST_HOME_INPUT });
const sanitized = computed(() => sanitizeFirstHomeInput(form));
const result = computed(() => calculateFirstHomeBenefits(sanitized.value));

const statIcons = [Receipt, ShieldCheck, Landmark, Wallet] as const;
const statIconClasses = [
  "bg-muted text-muted-foreground",
  "bg-primary/10 text-primary",
  "bg-muted text-muted-foreground",
  "bg-fee/10 text-fee",
] as const;
</script>

<template>
  <div class="space-y-4">
    <section class="retro-panel-muted space-y-4 p-4">
      <div class="grid gap-3 md:grid-cols-2">
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">주택 매수가</span>
          <input type="text" inputmode="numeric" class="retro-input" :value="form.homePrice.toLocaleString('ko-KR')" @input="form.homePrice = parseNumericInput(($event.target as HTMLInputElement).value)" />
        </label>
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">부부합산 연소득</span>
          <input type="text" inputmode="numeric" class="retro-input" :value="form.annualIncome.toLocaleString('ko-KR')" @input="form.annualIncome = parseNumericInput(($event.target as HTMLInputElement).value)" />
        </label>
      </div>

      <div class="grid gap-3 md:grid-cols-3">
        <label class="retro-panel flex items-center gap-2 px-3 py-3">
          <input v-model="form.isFirstHomeBuyer" class="retro-checkbox" type="checkbox" />
          <span class="text-caption font-semibold">생애최초 구입</span>
        </label>
        <label class="retro-panel flex items-center gap-2 px-3 py-3">
          <input v-model="form.isRegulatedArea" class="retro-checkbox" type="checkbox" />
          <span class="text-caption font-semibold">수도권·규제지역</span>
        </label>
        <label class="retro-panel flex items-center gap-2 px-3 py-3">
          <input v-model="form.isNewlywedOrMultiChild" class="retro-checkbox" type="checkbox" />
          <span class="text-caption font-semibold">신혼·2자녀 이상</span>
        </label>
      </div>
    </section>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Card
        v-for="(stat, index) in [
          { label: '예상 취득세', value: formatWon(result.acquisitionTax), cls: '' },
          { label: '감면 반영 후', value: formatWon(result.acquisitionTaxAfterRelief), cls: 'text-primary' },
          { label: '디딤돌 최대 한도', value: formatWon(result.didimdolLoanAmount), cls: '' },
          { label: '필요 자기자금', value: formatWon(result.requiredCash), cls: 'text-fee' },
        ]"
        :key="stat.label"
        class="border-border/50 bg-muted/30"
      >
        <CardContent class="p-3.5">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" :class="statIconClasses[index]">
              <component :is="statIcons[index]" class="h-3.5 w-3.5" />
            </span>
            <p class="truncate text-caption uppercase tracking-wide text-muted-foreground">{{ stat.label }}</p>
          </div>
          <p class="mt-2 text-heading font-bold tabular-nums" :class="stat.cls">{{ stat.value }}</p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
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

    <CompareSourceFooter :sources="[...FIRST_HOME_SOURCES]" updated-at="2026-03-17" />
  </div>
</template>
