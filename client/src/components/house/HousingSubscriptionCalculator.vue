<script setup lang="ts">
import { computed, reactive } from "vue";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import {
  DEFAULT_HOUSING_SUBSCRIPTION_INPUT,
  sanitizeHousingSubscriptionInput,
} from "@/lib/housingValidators";
import { calculateHousingSubscriptionScore } from "@/utils/housingCalculator";
import { HOUSING_SUBSCRIPTION_SOURCES } from "@/data/housingSubscription";

const form = reactive({ ...DEFAULT_HOUSING_SUBSCRIPTION_INPUT });
const sanitized = computed(() => sanitizeHousingSubscriptionInput(form));
const result = computed(() => calculateHousingSubscriptionScore(sanitized.value));
</script>

<template>
  <div class="space-y-4">
    <section class="retro-panel-muted space-y-4 p-4">
      <div class="grid gap-4 md:grid-cols-3">
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">무주택기간(년)</span>
          <input v-model.number="form.homelessYears" class="retro-input" min="0" max="30" step="1" type="number" />
        </label>
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">부양가족 수</span>
          <input v-model.number="form.dependents" class="retro-input" min="0" max="6" step="1" type="number" />
        </label>
        <label class="space-y-1.5">
          <span class="text-caption font-semibold text-foreground">통장 가입기간(년)</span>
          <input v-model.number="form.accountYears" class="retro-input" min="0" max="30" step="0.5" type="number" />
        </label>
      </div>
    </section>

    <div class="retro-stat-grid">
      <div class="retro-stat">
        <p class="retro-stat-label">무주택기간</p>
        <p class="retro-stat-value">{{ result.homelessScore }}점</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">부양가족</p>
        <p class="retro-stat-value">{{ result.dependentScore }}점</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">가입기간</p>
        <p class="retro-stat-value">{{ result.accountScore }}점</p>
      </div>
      <div class="retro-stat">
        <p class="retro-stat-label">총 가점</p>
        <p class="retro-stat-value text-primary">{{ result.totalScore }}점</p>
      </div>
    </div>

    <section class="retro-panel p-4">
      <p class="text-caption font-semibold text-foreground">{{ result.competitivenessLabel }}</p>
      <p class="mt-3 text-caption leading-relaxed text-muted-foreground">
        최고점 84점까지 {{ result.remainingToMax }}점 남았습니다. 민영주택 청약은 지역, 면적, 추첨 비중에 따라
        체감 난도가 달라지므로 가점 외 추첨 물량도 같이 확인하는 것이 좋습니다.
      </p>
    </section>

    <CompareSourceFooter :sources="[...HOUSING_SUBSCRIPTION_SOURCES]" updated-at="2026-03-17" />
  </div>
</template>
