<script setup lang="ts">
import { computed } from "vue";
import { ShBreakdownBar } from "@shakilabs/ui";
import { Receipt, ShieldCheck, Landmark, Wallet } from "lucide-vue-next";
import HouseStatGrid from "@/components/house/HouseStatGrid.vue";
import { calculateFirstHomeBenefits } from "@/utils/housingCalculator";
import { formatWon } from "@/lib/utils";

const props = defineProps<{
  result: ReturnType<typeof calculateFirstHomeBenefits>;
}>();

const statIcons = [Receipt, ShieldCheck, Landmark, Wallet] as const;
// 필요 자기자금은 위험이 아니라 필요 조건이다 — 다른 중립 스탯과 같은 톤으로.
const statIconClasses = [
  "bg-muted text-muted-foreground",
  "bg-primary/10 text-primary",
  "bg-muted text-muted-foreground",
  "bg-muted text-muted-foreground",
] as const;
const fundingSegments = computed(() => [
  { key: "cash", label: "필요 자기자금", value: props.result.requiredCash, tone: "muted" as const },
  { key: "loan", label: "디딤돌 대출", value: props.result.didimdolLoanAmount, tone: "primary" as const },
]);
</script>

<template>
  <div class="space-y-4">
    <HouseStatGrid
      :items="[
        { label: '예상 취득세', value: formatWon(result.acquisitionTax), cls: '' },
        { label: '감면 반영 후', value: formatWon(result.acquisitionTaxAfterRelief), cls: 'text-primary' },
        { label: '디딤돌 최대 한도', value: formatWon(result.didimdolLoanAmount), cls: '' },
        { label: '필요 자기자금', value: formatWon(result.requiredCash), cls: '' },
      ]"
      :icons="statIcons"
      :icon-classes="statIconClasses"
      :hero-index="1"
    />

    <ShBreakdownBar
      label="주택 매수가 자금 구성"
      note="현재 조건에서 주택 매수가를 필요 자기자금과 디딤돌 대출 한도로 나눴습니다."
      :segments="fundingSegments"
      :format-value="formatWon"
      surface="outlined"
    />
  </div>
</template>
