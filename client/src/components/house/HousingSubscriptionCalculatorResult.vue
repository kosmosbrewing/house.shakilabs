<script setup lang="ts">
import { computed } from "vue";
import { ShBreakdownBar } from "@shakilabs/ui";
import { Home, Users, CalendarClock, Trophy } from "lucide-vue-next";
import HouseStatGrid from "@/components/house/HouseStatGrid.vue";
import { calculateHousingSubscriptionScore } from "@/utils/housingCalculator";

const props = defineProps<{
  result: ReturnType<typeof calculateHousingSubscriptionScore>;
}>();

const statIcons = [Home, Users, CalendarClock, Trophy] as const;
const statIconClasses = [
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
  "bg-primary/10 text-primary",
] as const;
const scoreSegments = computed(() => [
  { key: "homeless", label: "무주택기간", value: props.result.homelessScore, tone: "primary" as const },
  { key: "dependent", label: "부양가족", value: props.result.dependentScore, tone: "success" as const },
  { key: "account", label: "가입기간", value: props.result.accountScore, tone: "danger" as const },
  { key: "remaining", label: "최고점까지", value: props.result.remainingToMax, tone: "muted" as const },
]);
</script>

<template>
  <div class="space-y-4">
    <HouseStatGrid
      :items="[
        { label: '무주택기간', value: `${result.homelessScore}점`, cls: '' },
        { label: '부양가족', value: `${result.dependentScore}점`, cls: '' },
        { label: '가입기간', value: `${result.accountScore}점`, cls: '' },
        { label: '총 가점', value: `${result.totalScore}점`, cls: 'text-primary' },
      ]"
      :icons="statIcons"
      :icon-classes="statIconClasses"
      :hero-index="3"
    />

    <ShBreakdownBar
      label="청약 가점 84점 구성"
      note="세 평가 항목의 현재 점수와 최고점까지 남은 점수를 한 막대에 표시합니다."
      :segments="scoreSegments"
      :format-value="(value) => `${value}점`"
      surface="outlined"
    />
  </div>
</template>
