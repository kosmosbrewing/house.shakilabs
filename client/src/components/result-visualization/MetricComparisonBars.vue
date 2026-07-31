<script setup lang="ts">
// 차트 본체는 @shakilabs/ui ShMetricBars — 이 파일은 house 카드 크롬만 입힌다.
// 호출부(RentalYieldCharts.vue)의 props와 tone 값("fee"/"profit")은 그대로 두고 여기서 변환한다.
// 주의: tone을 넘기면 패키지의 자동 음수색이 무시되므로, 부호가 갈리는 값은 호출부에서 signedTone()으로 계산한다.
import { computed } from "vue";
import { ShMetricBars } from "@shakilabs/ui";
import type { ChartTone, MetricBarGroup } from "@shakilabs/ui";
import type { Tone } from "./chartTone";

type ValueItem = { key: string; label: string; value: number; tone?: Tone; detail?: string };
type Metric = { key: string; label: string; values: readonly ValueItem[] };

const props = defineProps<{
  title: string;
  note: string;
  metrics: readonly Metric[];
  formatValue: (value: number) => string;
}>();

// 앱 의미색 톤 → 패키지 ChartTone. 실제 색은 main.css 오버라이드로 승격 전과 동일하게 고정된다.
const TONE_MAP: Record<Tone, ChartTone> = {
  primary: "primary",
  fee: "danger",
  profit: "success",
  muted: "muted",
};

const mappedMetrics = computed<MetricBarGroup[]>(() => props.metrics.map((metric) => ({
  key: metric.key,
  label: metric.label,
  values: metric.values.map((item) => ({
    key: item.key,
    label: item.label,
    value: item.value,
    // tone 미지정 항목은 패키지 기본(baseTone=muted)에 맡긴다 — 승격 전 BaseComparisonBar 기본값과 같다.
    ...(item.tone ? { tone: TONE_MAP[item.tone] } : {}),
    ...(item.detail ? { detail: item.detail } : {}),
  })),
})));
</script>

<template>
  <section data-metric-comparison class="rounded-xl border border-border/60 bg-card p-4">
    <ShMetricBars
      :metrics="mappedMetrics"
      :note="note"
      :format-value="formatValue"
      domain="signed"
      show-scale
    >
      <template #header="{ titleId }">
        <h3 :id="titleId" class="text-caption font-semibold text-foreground">{{ title }}</h3>
      </template>
    </ShMetricBars>
  </section>
</template>
