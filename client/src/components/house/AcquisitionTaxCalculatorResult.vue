<script setup lang="ts">
import { computed } from "vue";
import { ShBreakdownBar } from "@shakilabs/ui";
import {
  Receipt,
  Home,
  Landmark,
  Percent,
} from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import HouseStatGrid from "@/components/house/HouseStatGrid.vue";
import { ACQUISITION_TAX_SOURCES, ACQUISITION_TAX_UPDATED } from "@/data/acquisitionTax";
import { formatWon, formatPercent } from "@/lib/utils";
import type { AcquisitionTaxInput } from "@/utils/housingCalculator";

const props = defineProps<{
  form: AcquisitionTaxInput;
  result: ReturnType<typeof import("@/utils/housingCalculator").calculateAcquisitionTax>;
}>();

// 2026-09-17: 납부 세금은 위험이 아니라 결과다(DESIGN_CLEANUP_PLAN §4.2-2) — 히어로는
// 액센트(text-primary)로, 하위 항목은 중립으로 내린다. text-fee는 로컬 별칭이라 폐기.
const statItems = computed(() => [
  { label: "납부 세금 합계", value: formatWon(props.result.totalTax), cls: "text-primary" },
  { label: "취득세", value: formatWon(props.result.acquisitionTax), cls: "" },
  { label: "지방교육세", value: formatWon(props.result.localEducationTax), cls: "" },
  { label: "실효세율", value: formatPercent(props.result.effectiveTotalRate, 2), cls: "text-muted-foreground" },
]);

const statIcons = [Receipt, Home, Landmark, Percent] as const;
// 스탯 카드 아이콘 배경 3색(취득세·지방교육세·실효세율) → accent-muted 1색(§4.2 밖 액센트 제거)
const statIconClasses = [
  "bg-accent text-accent-foreground",
  "bg-accent text-accent-foreground",
  "bg-accent text-accent-foreground",
  "bg-accent text-accent-foreground",
] as const;
const taxSegments = computed(() => [
  { key: "acquisition", label: "취득세", value: props.result.acquisitionTax, tone: "primary" as const },
  { key: "education", label: "지방교육세", value: props.result.localEducationTax, tone: "muted" as const },
  { key: "rural", label: "농어촌특별세", value: props.result.ruralTax, tone: "muted" as const },
]);
</script>

<template>
  <div class="space-y-4">
    <HouseStatGrid :items="statItems" :icons="statIcons" :icon-classes="statIconClasses" :hero-index="0" />

    <ShBreakdownBar
      label="취득 단계 세금 구성"
      note="납부 세금 합계를 취득세·지방교육세·농어촌특별세로 나눴습니다."
      :segments="taxSegments"
      :format-value="formatWon"
      surface="outlined"
    />

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
            <span class="font-medium text-status-danger tabular-nums">{{ formatPercent(result.effectiveRate, 0) }}</span>
          </li>
          <li class="h-px bg-border/40" />
          <li class="flex justify-between">
            <span>취득세</span>
            <span class="font-medium text-foreground tabular-nums">{{ formatWon(result.acquisitionTax) }}</span>
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
            <span class="tabular-nums text-foreground">{{ formatWon(result.totalTax) }}</span>
          </li>
        </ul>
      </CardContent>
    </Card>

    <CompareSourceFooter :sources="[...ACQUISITION_TAX_SOURCES]" :updated-at="ACQUISITION_TAX_UPDATED" />
  </div>
</template>
