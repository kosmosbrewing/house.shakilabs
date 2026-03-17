<script setup lang="ts">
import { computed, reactive } from "vue";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import {
  DEFAULT_FIRST_HOME_INPUT,
  sanitizeFirstHomeInput,
} from "@/lib/housingValidators";
import { calculateFirstHomeBenefits } from "@/utils/housingCalculator";
import { FIRST_HOME_SOURCES } from "@/data/firstHome";
import { formatPercent, formatWon } from "@/lib/utils";

const form = reactive({ ...DEFAULT_FIRST_HOME_INPUT });
const sanitized = computed(() => sanitizeFirstHomeInput(form));
const result = computed(() => calculateFirstHomeBenefits(sanitized.value));
</script>

<template>
  <div class="space-y-4">
    <section class="retro-panel-muted space-y-4 p-4">
      <div class="grid gap-3 md:grid-cols-2">
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">주택 매수가</span>
          <input v-model.number="form.homePrice" class="retro-input" min="100000000" step="10000000" type="number" />
        </label>
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">부부합산 연소득</span>
          <input v-model.number="form.annualIncome" class="retro-input" min="0" step="1000000" type="number" />
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

    <div class="retro-stat-grid">
      <div class="retro-stat">
        <p class="retro-stat-label">예상 취득세</p>
        <p class="retro-stat-value">{{ formatWon(result.acquisitionTax) }}</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">감면 반영 후</p>
        <p class="retro-stat-value text-primary">{{ formatWon(result.acquisitionTaxAfterRelief) }}</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">디딤돌 최대 한도</p>
        <p class="retro-stat-value">{{ formatWon(result.didimdolLoanAmount) }}</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">필요 자기자금</p>
        <p class="retro-stat-value text-status-danger">{{ formatWon(result.requiredCash) }}</p>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <section class="retro-panel p-4">
        <p class="text-caption font-semibold text-foreground">혜택 요약</p>
        <ul class="mt-3 space-y-2 text-caption leading-relaxed text-muted-foreground">
          <li>취득세 일반세율: {{ formatPercent(result.taxRate, 2) }}</li>
          <li>생애최초 감면 추정: {{ formatWon(result.estimatedTaxRelief) }}</li>
          <li>적용 LTV: {{ formatPercent(result.ltvLimit, 0) }}</li>
          <li>금리 우대 가정: {{ formatPercent(result.rateDiscount, 1) }}</li>
        </ul>
      </section>

      <section class="retro-panel p-4">
        <p class="text-caption font-semibold text-foreground">판단 포인트</p>
        <p class="mt-3 text-caption leading-relaxed text-muted-foreground">
          {{
            result.didimdolEligible
              ? `현재 입력값 기준으로 디딤돌 한도 ${formatWon(result.didimdolLoanAmount)}까지 검토 가능합니다.`
              : "소득 또는 생애최초 조건이 맞지 않아 디딤돌 기본 혜택은 제외하고 계산했습니다."
          }}
        </p>
        <p class="mt-2 text-caption leading-relaxed text-muted-foreground">
          취득세 감면은 참고 계산이며, 실제 적용 여부는 계약 형태와 세대요건을 관할 지자체에서 다시 확인해야 합니다.
        </p>
      </section>
    </div>

    <CompareSourceFooter :sources="[...FIRST_HOME_SOURCES]" updated-at="2026-03-17" />
  </div>
</template>
