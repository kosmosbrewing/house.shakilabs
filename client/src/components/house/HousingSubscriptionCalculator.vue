<script setup lang="ts">
import { computed, reactive } from "vue";
import { ShBreakdownBar } from "@shakilabs/ui";
import { Home, Users, CalendarClock, Trophy } from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import HouseStatGrid from "@/components/house/HouseStatGrid.vue";
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
const scoreSegments = computed(() => [
  { key: "homeless", label: "무주택기간", value: result.value.homelessScore, tone: "primary" as const },
  { key: "dependent", label: "부양가족", value: result.value.dependentScore, tone: "success" as const },
  { key: "account", label: "가입기간", value: result.value.accountScore, tone: "danger" as const },
  { key: "remaining", label: "최고점까지", value: result.value.remainingToMax, tone: "muted" as const },
]);
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

    <HouseStatGrid
      :items="[
        { label: '무주택기간', value: `${result.homelessScore}점`, cls: '' },
        { label: '부양가족', value: `${result.dependentScore}점`, cls: '' },
        { label: '가입기간', value: `${result.accountScore}점`, cls: '' },
        { label: '총 가점', value: `${result.totalScore}점`, cls: 'text-primary' },
      ]"
      :icons="statIcons"
      :icon-classes="statIconClasses"
    />

    <ShBreakdownBar
      label="청약 가점 84점 구성"
      note="세 평가 항목의 현재 점수와 최고점까지 남은 점수를 한 막대에 표시합니다."
      :segments="scoreSegments"
      :format-value="(value) => `${value}점`"
      surface="outlined"
    />

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
