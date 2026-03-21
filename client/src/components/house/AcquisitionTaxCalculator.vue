<script setup lang="ts">
import { computed } from "vue";
import {
  Receipt,
  Home,
  Landmark,
  Percent,
} from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import { PURCHASE_PRICE_PRESETS, ACQUISITION_TAX_SOURCES, ACQUISITION_TAX_UPDATED } from "@/data/acquisitionTax";
import { formatWon, formatPercent, parseNumericInput } from "@/lib/utils";
import type { AcquisitionTaxInput } from "@/utils/housingCalculator";

const form = defineModel<AcquisitionTaxInput>({ required: true });

const props = defineProps<{
  result: ReturnType<typeof import("@/utils/housingCalculator").calculateAcquisitionTax>;
}>();

const statItems = computed(() => [
  { label: "납부 세금 합계", value: formatWon(props.result.totalTax), cls: "text-fee" },
  { label: "취득세", value: formatWon(props.result.acquisitionTax), cls: "text-fee" },
  { label: "지방교육세", value: formatWon(props.result.localEducationTax), cls: "" },
  { label: "실효세율", value: formatPercent(props.result.effectiveTotalRate, 2), cls: "text-muted-foreground" },
]);

const statIcons = [Receipt, Home, Landmark, Percent] as const;
const statIconClasses = [
  "bg-fee/10 text-fee",
  "bg-fee/10 text-fee",
  "bg-primary/10 text-primary",
  "bg-muted text-muted-foreground",
] as const;

function setPreset(price: number) {
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
            :key="preset"
            :aria-pressed="form.purchasePrice === preset"
            class="rounded-lg border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            :class="{ '!bg-primary/15 !text-primary !border-primary/30': form.purchasePrice === preset }"
            @click="setPreset(preset)"
          >
            {{ formatWon(preset) }}
          </button>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <!-- 주택 수 -->
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">보유 주택 수</span>
          <select v-model.number="form.homeCount" class="retro-input">
            <option :value="1">1주택 (기본세율)</option>
            <option :value="2">2주택</option>
            <option :value="3">3주택 이상</option>
          </select>
        </label>

        <!-- 전용면적 -->
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">전용면적 (㎡)</span>
          <input v-model.number="form.exclusiveArea" class="retro-input" min="10" max="500" step="1" type="number" />
          <p class="text-[10px] text-muted-foreground">85㎡ ≈ 25.7평, 초과 시 농특세 부과</p>
        </label>
      </div>

      <!-- 조정대상지역 -->
      <label class="retro-panel flex items-center gap-2 px-3 py-3 w-full">
        <input v-model="form.isRegulatedArea" class="retro-checkbox" type="checkbox" />
        <span class="text-caption font-semibold">조정대상지역</span>
        <span class="text-[10px] text-muted-foreground ml-1">(2주택 이상 시 중과)</span>
      </label>
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

    <!-- 상세 내역 -->
    <Card>
      <CardContent class="p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Receipt class="h-3.5 w-3.5" />
          </span>
          <p class="text-caption font-semibold text-foreground">취득세 산출 내역</p>
          <span
            v-if="result.isSurcharged"
            class="ml-auto rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive"
          >
            다주택 중과
          </span>
        </div>

        <ul class="space-y-2 text-caption leading-relaxed text-muted-foreground">
          <li class="flex justify-between">
            <span>매매가</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.purchasePrice) }}</span>
          </li>
          <li class="flex justify-between">
            <span>기본 취득세율</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatPercent(result.baseRate, 1) }}</span>
          </li>
          <li v-if="result.isSurcharged" class="flex justify-between">
            <span>적용 세율 ({{ result.homeCountLabel }} · {{ result.rateLabel }})</span>
            <span class="font-medium text-fee tabular-nums">{{ formatPercent(result.effectiveRate, 0) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between">
            <span>취득세</span>
            <span class="font-medium text-fee tabular-nums">{{ formatWon(result.acquisitionTax) }}</span>
          </li>
          <li class="flex justify-between">
            <span>지방교육세 (기본세율분 × 10%)</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.localEducationTax) }}</span>
          </li>
          <li class="flex justify-between">
            <span>농어촌특별세{{ form.exclusiveArea <= 85 ? ' (85㎡ 이하 면제)' : '' }}</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.ruralTax) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between font-semibold text-foreground">
            <span>납부 세금 합계</span>
            <span class="tabular-nums text-fee">{{ formatWon(result.totalTax) }}</span>
          </li>
        </ul>
      </CardContent>
    </Card>

    <CompareSourceFooter :sources="[...ACQUISITION_TAX_SOURCES]" :updated-at="ACQUISITION_TAX_UPDATED" />
  </div>
</template>
