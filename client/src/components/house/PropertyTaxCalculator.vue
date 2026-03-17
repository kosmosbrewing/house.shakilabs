<script setup lang="ts">
import { computed } from "vue";
import {
  Building2,
  Receipt,
  Landmark,
  CalendarDays,
} from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import { PROPERTY_TAX_SOURCES, PROPERTY_TAX_UPDATED, MARKET_PRICE_PRESETS } from "@/data/propertyTax";
import { formatWon, formatPercent, parseNumericInput } from "@/lib/utils";
import type { PropertyTaxInput } from "@/utils/housingCalculator";

const form = defineModel<PropertyTaxInput>({ required: true });

const props = defineProps<{
  result: ReturnType<typeof import("@/utils/housingCalculator").calculatePropertyTax>;
}>();

const statItems = computed(() => [
  { label: "연간 보유세 총액", value: formatWon(props.result.annualTotal), cls: "text-fee" },
  { label: "월 환산액", value: formatWon(props.result.monthlyEquivalent), cls: "text-fee" },
  { label: "재산세 합계", value: formatWon(props.result.propertyTaxTotal), cls: "" },
  { label: "종부세 합계", value: formatWon(props.result.compTaxTotal), cls: props.result.isCompTaxSubject ? "" : "text-muted-foreground" },
]);

const statIcons = [Receipt, CalendarDays, Building2, Landmark] as const;
const statIconClasses = [
  "bg-fee/10 text-fee",
  "bg-fee/10 text-fee",
  "bg-primary/10 text-primary",
  "bg-muted text-muted-foreground",
] as const;

function setPreset(price: number) {
  form.value = { ...form.value, marketPrice: price };
}
</script>

<template>
  <div class="space-y-4">
    <!-- 입력 영역 -->
    <section class="retro-panel-muted space-y-4 p-4">
      <!-- 시가 + 프리셋 -->
      <div class="space-y-1.5">
        <label class="text-caption font-semibold text-foreground">시가 (시세)</label>
        <input
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="form.marketPrice.toLocaleString('ko-KR')"
          @input="form.marketPrice = parseNumericInput(($event.target as HTMLInputElement).value)"
        />
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="preset in MARKET_PRICE_PRESETS"
            :key="preset"
            :aria-pressed="form.marketPrice === preset"
            class="rounded-lg border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            :class="{ '!bg-primary/15 !text-primary !border-primary/30': form.marketPrice === preset }"
            @click="setPreset(preset)"
          >
            {{ formatWon(preset) }}
          </button>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <!-- 주택유형 -->
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">주택 유형</span>
          <select v-model="form.housingType" class="retro-input">
            <option value="apartment">아파트</option>
            <option value="detached">단독주택</option>
          </select>
        </label>

        <!-- 나이 -->
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">소유자 나이</span>
          <input v-model.number="form.ownerAge" class="retro-input" min="20" max="100" step="1" type="number" />
        </label>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <!-- 보유기간 -->
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">보유 기간 (년)</span>
          <input v-model.number="form.holdingYears" class="retro-input" min="0" max="50" step="1" type="number" />
        </label>

        <!-- 도시지역 -->
        <div class="flex items-end pb-1">
          <label class="retro-panel flex items-center gap-2 px-3 py-3 w-full">
            <input v-model="form.isUrbanArea" class="retro-checkbox" type="checkbox" />
            <span class="text-caption font-semibold">도시지역 (대부분 해당)</span>
          </label>
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

    <!-- 상세 내역 2컬럼 -->
    <div class="grid gap-4 lg:grid-cols-2">
      <!-- 재산세 내역 -->
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 class="h-3.5 w-3.5" />
            </span>
            <p class="text-caption font-semibold text-foreground">재산세 내역</p>
            <span
              v-if="result.isSpecialRate"
              class="ml-auto rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
            >
              1주택 특례
            </span>
          </div>
          <ul class="space-y-2 text-caption leading-relaxed text-muted-foreground">
            <li class="flex justify-between">
              <span>공시가격 (현실화율 {{ formatPercent(result.realizationRate, 0) }})</span>
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

      <!-- 종부세 내역 -->
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Landmark class="h-3.5 w-3.5" />
            </span>
            <p class="text-caption font-semibold text-foreground">종부세 내역</p>
            <span
              v-if="!result.isCompTaxSubject"
              class="ml-auto rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
            >
              대상 아님
            </span>
          </div>

          <template v-if="result.isCompTaxSubject">
            <ul class="space-y-2 text-caption leading-relaxed text-muted-foreground">
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
              <li class="h-px bg-border/40" />
              <li class="flex justify-between">
                <span>고령자 공제</span>
                <span class="font-medium text-foreground tabular-nums">
                  {{ formatPercent(result.elderlyDeduction, 0) }}
                  <span v-if="result.elderlyDeduction > 0" class="text-muted-foreground">({{ formatWon(Math.round(result.compTaxAmount * result.elderlyDeduction)) }})</span>
                </span>
              </li>
              <li class="flex justify-between">
                <span>장기보유 공제</span>
                <span class="font-medium text-foreground tabular-nums">
                  {{ formatPercent(result.longHoldDeduction, 0) }}
                  <span v-if="result.longHoldDeduction > 0" class="text-muted-foreground">({{ formatWon(Math.round(result.compTaxAmount * result.longHoldDeduction)) }})</span>
                </span>
              </li>
              <li class="flex justify-between">
                <span>
                  합산 공제율 (최대 80%)
                  <span v-if="result.totalDeductionRate >= 0.8" class="ml-1 text-[10px] text-primary">상한 적용</span>
                </span>
                <span class="font-medium text-foreground tabular-nums">{{ formatPercent(result.totalDeductionRate, 0) }}</span>
              </li>
              <li class="flex justify-between">
                <span>공제 후 종부세</span>
                <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.compTaxAfterDeduction) }}</span>
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
          </template>
          <template v-else>
            <p class="text-caption leading-relaxed text-muted-foreground">
              공시가격 {{ formatWon(result.officialPrice) }}으로 기본공제(12억원) 이하이므로 종부세 대상이 아닙니다.
            </p>
          </template>
        </CardContent>
      </Card>
    </div>

    <CompareSourceFooter :sources="[...PROPERTY_TAX_SOURCES]" :updated-at="PROPERTY_TAX_UPDATED" />
  </div>
</template>
