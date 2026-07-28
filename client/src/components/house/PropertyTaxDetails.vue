<script setup lang="ts">
// 보유세 상세 — 요약(SummaryBanner) 뒤에 오는 분해 정보만 담는다.
// 요약과 같은 4개 수치를 반복하던 HouseStatGrid는 제거했다.
import { computed } from "vue";
import { ShBreakdownBar } from "@shakilabs/ui";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import PropertyTaxBreakdown from "@/components/house/PropertyTaxBreakdown.vue";
import { PROPERTY_TAX_SOURCES, PROPERTY_TAX_UPDATED } from "@/data/propertyTax";
import { formatWon } from "@/lib/utils";
import type { PropertyTaxInput } from "@/utils/housingCalculator";

const props = defineProps<{
  form: PropertyTaxInput;
  result: ReturnType<typeof import("@/utils/housingCalculator").calculatePropertyTax>;
}>();

const taxSegments = computed(() => [
  { key: "property", label: "재산세 합계", value: props.result.propertyTaxTotal, tone: "primary" as const },
  { key: "comprehensive", label: "종부세 합계", value: props.result.compTaxTotal, tone: "danger" as const },
]);
</script>

<template>
  <div class="space-y-4">
    <ShBreakdownBar
      label="연간 보유세 구성"
      note="연간 보유세 총액을 재산세와 종합부동산세로 나눴습니다."
      :segments="taxSegments"
      :format-value="formatWon"
      surface="outlined"
    />

    <PropertyTaxBreakdown :form="form" :result="result" />

    <CompareSourceFooter
      :sources="[...PROPERTY_TAX_SOURCES]"
      :updated-at="PROPERTY_TAX_UPDATED"
      note="※ 아파트 단독 명의 1세대 1주택 전용 추정치입니다. 공시가격과 전년도 자료를 비우면 현실화율 추정치와 상한 미적용 금액을 보여줍니다. 감면·합산배제·과세특례는 지원하지 않습니다."
    />
  </div>
</template>
