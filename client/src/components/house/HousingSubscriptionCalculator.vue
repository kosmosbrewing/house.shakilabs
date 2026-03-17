<script setup lang="ts">
import { computed, reactive } from "vue";
import { Home, Users, CalendarClock, Trophy } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const statIcons = [Home, Users, CalendarClock, Trophy] as const;
const statIconClasses = [
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
  "bg-primary/10 text-primary",
] as const;
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

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Card
        v-for="(stat, index) in [
          { label: '무주택기간', value: `${result.homelessScore}점`, cls: '' },
          { label: '부양가족', value: `${result.dependentScore}점`, cls: '' },
          { label: '가입기간', value: `${result.accountScore}점`, cls: '' },
          { label: '총 가점', value: `${result.totalScore}점`, cls: 'text-primary' },
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

    <Card>
      <CardContent class="p-4">
        <div class="flex items-center gap-2 mb-3">
          <p class="text-caption font-semibold text-foreground">{{ result.competitivenessLabel }}</p>
          <Badge variant="secondary" class="shrink-0 rounded-full">{{ result.totalScore }} / 84</Badge>
        </div>
        <p class="text-caption leading-relaxed text-muted-foreground">
          최고점 84점까지 {{ result.remainingToMax }}점 남았습니다. 민영주택 청약은 지역, 면적, 추첨 비중에 따라
          체감 난도가 달라지므로 가점 외 추첨 물량도 같이 확인하는 것이 좋습니다.
        </p>
      </CardContent>
    </Card>

    <CompareSourceFooter :sources="[...HOUSING_SUBSCRIPTION_SOURCES]" updated-at="2026-03-17" />
  </div>
</template>
