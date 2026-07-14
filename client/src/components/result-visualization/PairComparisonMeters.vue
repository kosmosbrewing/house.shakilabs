<script setup lang="ts">
import { computed, useId } from "vue";
import BaseMeterBar from "./BaseMeterBar.vue";
import { thresholdScaleMaximum } from "@/utils/meterMath";

type PairValue = Readonly<{ key: string; label: string; value: number }>;
type PairMetric = Readonly<{
  key: string;
  label: string;
  values: readonly [PairValue, PairValue];
}>;

const props = withDefaults(defineProps<{
  title: string;
  note: string;
  metrics: readonly PairMetric[];
  formatValue: (value: number) => string;
  formatScaleValue?: (value: number) => string;
  tolerance?: number;
}>(), {
  formatScaleValue: undefined,
  tolerance: 0,
});

const titleId = `pair-comparison-${useId()}`;
const rows = computed(() => props.metrics.map((metric) => {
  const [first, second] = metric.values;
  const firstValue = Number.isFinite(first.value) ? Math.max(0, first.value) : 0;
  const secondValue = Number.isFinite(second.value) ? Math.max(0, second.value) : 0;
  const equal = Math.abs(firstValue - secondValue) <= Math.max(0, props.tolerance);
  const lower = firstValue <= secondValue
    ? { ...first, value: firstValue }
    : { ...second, value: secondValue };
  const higher = firstValue <= secondValue
    ? { ...second, value: secondValue }
    : { ...first, value: firstValue };
  const scaleStep = higher.value > 0
    ? 10 ** Math.floor(Math.log10(higher.value)) / 10
    : 1;
  const maximum = thresholdScaleMaximum(higher.value, lower.value, 0, scaleStep);
  const status = equal
    ? `${first.label}와 ${second.label} 부담이 같음`
    : `${lower.label}가 ${higher.label}보다 ${props.formatValue(higher.value - lower.value)} 낮음`;

  return {
    ...metric,
    first: { ...first, value: firstValue },
    second: { ...second, value: secondValue },
    lower,
    higher,
    equal,
    maximum,
    status,
  };
}));
</script>

<template>
  <section
    data-pair-comparison
    class="rounded-xl border border-border/60 bg-card p-4"
    :aria-labelledby="titleId"
  >
    <h3 :id="titleId" class="text-caption font-semibold text-foreground">{{ title }}</h3>
    <p class="mt-1 text-tiny leading-relaxed text-muted-foreground">{{ note }}</p>

    <div class="mt-4 space-y-4">
      <div
        v-for="(row, index) in rows"
        :key="row.key"
        class="space-y-2"
        :class="index > 0 ? 'border-t border-border/50 pt-4' : ''"
      >
        <h4 class="text-tiny font-semibold text-muted-foreground">{{ row.label }}</h4>
        <BaseMeterBar
          :label="`${row.first.label}와 ${row.second.label} ${row.label} 비교`"
          :value="row.higher.value"
          :threshold="row.lower.value"
          :maximum="row.maximum"
          :tolerance="tolerance"
          :format-value="formatValue"
          :format-scale-value="formatScaleValue"
          :value-label="row.equal ? `${row.first.label}·${row.second.label} 부담` : `${row.higher.label} 부담`"
          :threshold-label="row.equal ? '동일' : row.lower.label"
          :aria-value-text="`${row.first.label} ${formatValue(row.first.value)}, ${row.second.label} ${formatValue(row.second.value)}, ${row.status}`"
          :base-tone="row.equal ? 'primary' : 'profit'"
          excess-tone="fee"
        />
        <p
          data-pair-status
          class="text-tiny font-semibold"
          :class="row.equal ? 'text-foreground' : 'text-profit'"
        >
          {{ row.status }}
        </p>
      </div>
    </div>
  </section>
</template>
