<script setup lang="ts">
import { computed } from "vue";
import { Building2, CalendarDays, Landmark, Receipt } from "lucide-vue-next";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import PropertyTaxBreakdown from "@/components/house/PropertyTaxBreakdown.vue";
import PropertyTaxInputPanel from "@/components/house/PropertyTaxInputPanel.vue";
import { Card, CardContent } from "@/components/ui/card";
import { PROPERTY_TAX_SOURCES, PROPERTY_TAX_UPDATED } from "@/data/propertyTax";
import { formatWon } from "@/lib/utils";
import type { PropertyTaxInput } from "@/utils/housingCalculator";

const form = defineModel<PropertyTaxInput>({ required: true });
const props = defineProps<{
  result: ReturnType<typeof import("@/utils/housingCalculator").calculatePropertyTax>;
}>();

const statItems = computed(() => [
  { label: "연간 보유세 총액", value: formatWon(props.result.annualTotal), cls: "text-fee" },
  { label: "월 환산액", value: formatWon(props.result.monthlyEquivalent), cls: "text-fee" },
  { label: "재산세 합계", value: formatWon(props.result.propertyTaxTotal), cls: "" },
  {
    label: "종부세 합계",
    value: formatWon(props.result.compTaxTotal),
    cls: props.result.isCompTaxSubject ? "" : "text-muted-foreground",
  },
]);
const statIcons = [Receipt, CalendarDays, Building2, Landmark] as const;
const statIconClasses = [
  "bg-fee/10 text-fee",
  "bg-fee/10 text-fee",
  "bg-primary/10 text-primary",
  "bg-muted text-muted-foreground",
] as const;
</script>

<template>
  <div class="space-y-4">
    <PropertyTaxInputPanel v-model="form" />

    <div
      v-if="!result.isSupportedScenario"
      class="rounded-xl border border-status-warning/40 bg-status-warning/10 p-4 text-caption leading-relaxed text-foreground"
    >
      현재는 아파트를 단독 명의로 보유한 1세대 1주택만 지원합니다. 단독주택·공동명의·다주택·법인·주택 수 제외 특례는 잘못된 세액을 피하기 위해 결과를 숨깁니다.
    </div>

    <div v-if="result.isSupportedScenario" class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Card v-for="(stat, index) in statItems" :key="stat.label" class="border-border/50 bg-muted/30">
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

    <PropertyTaxBreakdown :form="form" :result="result" />

    <CompareSourceFooter
      :sources="[...PROPERTY_TAX_SOURCES]"
      :updated-at="PROPERTY_TAX_UPDATED"
      note="※ 아파트 단독 명의 1세대 1주택 전용 추정치입니다. 공시가격과 전년도 자료를 비우면 현실화율 추정치와 상한 미적용 금액을 보여줍니다. 감면·합산배제·과세특례는 지원하지 않습니다."
    />
  </div>
</template>
