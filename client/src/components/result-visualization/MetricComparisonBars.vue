<script setup lang="ts">
import { computed, useId } from "vue";
import BaseComparisonBar from "./BaseComparisonBar.vue";

type Tone = "primary" | "fee" | "profit" | "muted";
type ValueItem = { key: string; label: string; value: number; tone?: Tone; detail?: string };
type Metric = { key: string; label: string; values: readonly ValueItem[] };
const props = defineProps<{
  title: string;
  note: string;
  metrics: readonly Metric[];
  formatValue: (value: number) => string;
}>();
const titleId = `house-metrics-${useId()}`;
const domains = computed(() => new Map(props.metrics.map((metric) => {
  const values = metric.values.map((item) => item.value).filter(Number.isFinite);
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  return [metric.key, {
    minimum,
    maximum: maximum > minimum ? maximum : minimum + 1,
  }];
})));

function domain(metricKey: string): { minimum: number; maximum: number } {
  return domains.value.get(metricKey) ?? { minimum: 0, maximum: 1 };
}
</script>

<template>
  <section
    data-metric-comparison
    class="rounded-xl border border-border/60 bg-card p-4"
    :aria-labelledby="titleId"
  >
    <h3 :id="titleId" class="text-caption font-semibold text-foreground">{{ title }}</h3>
    <p class="mt-1 text-tiny leading-relaxed text-muted-foreground">{{ note }}</p>
    <div class="mt-4 space-y-5">
      <div v-for="metric in metrics" :key="metric.key" class="space-y-3">
        <h4 class="border-b border-border/50 pb-1.5 text-tiny font-semibold text-muted-foreground">{{ metric.label }}</h4>
        <BaseComparisonBar
          v-for="(item, itemIndex) in metric.values"
          :key="item.key"
          :label="item.label"
          :value="item.value"
          :minimum="domain(metric.key).minimum"
          :maximum="domain(metric.key).maximum"
          :tone="item.tone"
          :detail="item.detail"
          :show-scale="itemIndex === metric.values.length - 1"
          :format-value="formatValue"
        />
      </div>
    </div>
  </section>
</template>
