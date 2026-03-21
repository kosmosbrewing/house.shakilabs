<script setup lang="ts">
import { computed } from "vue";
import { Percent, Scale, AlertTriangle, CheckCircle2, ArrowDown } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import {
  JEONSE_DEPOSIT_PRESETS,
  JEONSE_WOLSE_RATE_SOURCES,
  JEONSE_WOLSE_RATE_UPDATED,
  BOK_BASE_RATE,
  LEGAL_RATE_SPREAD,
} from "@/data/jeonseWolseRate";
import { formatWon, formatPercent, parseNumericInput } from "@/lib/utils";
import type { JeonseWolseRateInput, JeonseWolseRateResult } from "@/utils/housingCalculator";

const form = defineModel<JeonseWolseRateInput>({ required: true });

const props = defineProps<{
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

const judgmentCls = computed(() => {
  switch (props.result.judgment) {
    case "excessive":
      return "text-fee";
    case "below":
      return "text-primary";
    case "appropriate":
      return "text-foreground";
  }
});

// 월세 보증금이 전세 보증금 이상이면 전환율 계산 불가
const isDepositInvalid = computed(() => form.value.wolseDeposit >= form.value.jeonseDeposit);

const statItems = computed(() => [
  {
    label: "실제 전환율",
    value: formatPercent(props.result.actualConversionRate, 2),
    cls: props.result.judgment === "excessive" ? "text-fee" : "text-primary",
    icon: Percent,
    iconCls: props.result.judgment === "excessive" ? "bg-fee/10 text-fee" : "bg-primary/10 text-primary",
  },
  {
    label: "법정 상한",
    value: formatPercent(props.result.legalRateCap, 1),
    cls: "text-muted-foreground",
    icon: Scale,
    iconCls: "bg-muted text-muted-foreground",
  },
  {
    label: "판정",
    value: judgmentLabel.value,
    cls: judgmentCls.value,
    icon: props.result.judgment === "excessive" ? AlertTriangle : CheckCircle2,
    iconCls: props.result.judgment === "excessive" ? "bg-fee/10 text-fee" : "bg-primary/10 text-primary",
  },
  {
    label: "적정 월세",
    value: formatWon(props.result.fairMonthlyRent),
    cls: "",
    icon: ArrowDown,
    iconCls: "bg-muted text-muted-foreground",
  },
]);

function setDepositPreset(price: number) {
  form.value = { ...form.value, jeonseDeposit: price };
}
</script>

<template>
  <div class="space-y-4">
    <!-- 입력 영역 -->
    <section class="retro-panel-muted space-y-4 p-4">
      <!-- 전세 보증금 + 프리셋 -->
      <div class="space-y-1.5">
        <label class="text-caption font-semibold text-foreground">전세 보증금</label>
        <input
          type="text"
          inputmode="numeric"
          class="retro-input"
          :value="form.jeonseDeposit.toLocaleString('ko-KR')"
          @input="form.jeonseDeposit = parseNumericInput(($event.target as HTMLInputElement).value)"
        />
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="preset in JEONSE_DEPOSIT_PRESETS"
            :key="preset.value"
            :aria-pressed="form.jeonseDeposit === preset.value"
            class="rounded-lg border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            :class="{ '!bg-primary/15 !text-primary !border-primary/30': form.jeonseDeposit === preset.value }"
            @click="setDepositPreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <!-- 월세 보증금 -->
        <div class="space-y-1.5">
          <label class="text-caption font-semibold text-foreground">월세 보증금</label>
          <input
            type="text"
            inputmode="numeric"
            class="retro-input"
            :value="form.wolseDeposit.toLocaleString('ko-KR')"
            @input="form.wolseDeposit = parseNumericInput(($event.target as HTMLInputElement).value)"
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

      <!-- 법정 전환율 (자동 표시) -->
      <div class="rounded-xl border border-border/50 bg-background/50 p-3">
        <p class="text-caption font-semibold text-muted-foreground">
          법정 전환율 상한 = 기준금리({{ formatPercent(BOK_BASE_RATE, 1) }}) + {{ formatPercent(LEGAL_RATE_SPREAD, 1) }} = <span class="text-foreground">{{ formatPercent(form.legalRateCap, 1) }}</span>
        </p>
        <p class="mt-1 text-[10px] text-muted-foreground">주택임대차보호법 시행령 §9 · 2026.03 기준</p>
      </div>
    </section>

    <!-- 보증금 역전 경고 -->
    <div v-if="isDepositInvalid" class="rounded-xl border border-status-danger/30 bg-status-danger/5 p-4">
      <p class="flex items-center gap-2 font-semibold text-status-danger">
        <AlertTriangle class="h-4 w-4 shrink-0" />
        월세 보증금이 전세 보증금 이상이면 전환율을 계산할 수 없습니다.
      </p>
    </div>

    <!-- 4칸 stat grid -->
    <div v-if="!isDepositInvalid" class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Card
        v-for="stat in statItems"
        :key="stat.label"
        class="border-border/50 bg-muted/30"
      >
        <CardContent class="p-3.5">
          <div class="flex items-center gap-2">
            <span
              class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              :class="stat.iconCls"
            >
              <component :is="stat.icon" class="h-3.5 w-3.5" />
            </span>
            <p class="truncate text-caption uppercase tracking-wide text-muted-foreground">{{ stat.label }}</p>
          </div>
          <p class="mt-2 text-heading font-bold tabular-nums" :class="stat.cls">{{ stat.value }}</p>
        </CardContent>
      </Card>
    </div>

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
            <span class="font-medium tabular-nums" :class="result.judgment === 'excessive' ? 'text-fee' : 'text-primary'">
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
            <span class="font-medium tabular-nums" :class="result.monthlyRentGap > 0 ? 'text-fee' : 'text-primary'">
              {{ result.monthlyRentGap > 0 ? '+' : '' }}{{ formatWon(result.monthlyRentGap) }}
            </span>
          </li>
          <li v-if="result.annualExcessBurden > 0" class="flex justify-between font-semibold text-foreground">
            <span>연간 초과 부담</span>
            <span class="tabular-nums text-fee">{{ formatWon(result.annualExcessBurden) }}</span>
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
          <table class="w-full text-caption">
            <thead>
              <tr class="border-b border-border/40 text-muted-foreground">
                <th class="pb-2 text-left font-semibold">보증금 증액</th>
                <th class="pb-2 text-right font-semibold">조정 후 보증금</th>
                <th class="pb-2 text-right font-semibold">적정 월세</th>
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
