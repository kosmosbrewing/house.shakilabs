<script setup lang="ts">
import { computed, useId } from "vue";
import BaseMeterBar from "./BaseMeterBar.vue";
import { thresholdScaleMaximum, thresholdState } from "@/utils/meterMath";

type ThresholdMessages = Readonly<{
  above: string;
  equal: string;
  below: string;
}>;

const props = withDefaults(defineProps<{
  title: string;
  note: string;
  actualValue: number;
  thresholdValue: number;
  formatValue: (value: number) => string;
  formatDifference: (difference: number) => string;
  messages: ThresholdMessages;
  actualLabel?: string;
  thresholdLabel?: string;
  formatScaleValue?: (value: number) => string;
  minimum?: number;
  maximum?: number;
  scaleStep?: number;
  tolerance?: number;
}>(), {
  actualLabel: "실제 값",
  thresholdLabel: "기준값",
  formatScaleValue: undefined,
  minimum: 0,
  maximum: undefined,
  scaleStep: 1,
  tolerance: 0,
});

const titleId = `threshold-comparison-${useId()}`;
const state = computed(() => thresholdState(
  props.actualValue,
  props.thresholdValue,
  props.tolerance,
));
const difference = computed(() => Math.abs(props.actualValue - props.thresholdValue));
const scaleMaximum = computed(() => (
  props.maximum != null && Number.isFinite(props.maximum) && props.maximum > props.minimum
    ? props.maximum
    : thresholdScaleMaximum(
      props.actualValue,
      props.thresholdValue,
      props.minimum,
      props.scaleStep,
    )
));
const statusText = computed(() => {
  if (state.value === "above") {
    return `${props.thresholdLabel}보다 ${props.formatDifference(difference.value)} 높음`;
  }
  if (state.value === "below") {
    return `${props.thresholdLabel}보다 ${props.formatDifference(difference.value)} 낮음`;
  }
  return `${props.thresholdLabel}과 같음`;
});
const statusMessage = computed(() => props.messages[state.value]);
const ariaValueText = computed(() => [
  `${props.actualLabel} ${props.formatValue(props.actualValue)}`,
  `${props.thresholdLabel} ${props.formatValue(props.thresholdValue)}`,
  statusText.value,
].join(", "));
</script>

<template>
  <section
    data-threshold-comparison
    class="rounded-xl border border-border/60 bg-card p-4"
    :aria-labelledby="titleId"
  >
    <h3 :id="titleId" class="text-caption font-semibold text-foreground">{{ title }}</h3>
    <p class="mt-1 text-tiny leading-relaxed text-muted-foreground">{{ note }}</p>

    <BaseMeterBar
      class="mt-4"
      :label="`${actualLabel}과 ${thresholdLabel} 비교`"
      :value="actualValue"
      :threshold="thresholdValue"
      :minimum="minimum"
      :maximum="scaleMaximum"
      :tolerance="tolerance"
      :format-value="formatValue"
      :format-scale-value="formatScaleValue"
      :value-label="actualLabel"
      :threshold-label="thresholdLabel"
      :aria-value-text="ariaValueText"
    />

    <div class="mt-3 border-t border-border/50 pt-3">
      <p
        data-threshold-status
        class="text-caption font-semibold"
        :class="state === 'above' ? 'text-fee' : state === 'below' ? 'text-primary' : 'text-foreground'"
      >
        {{ statusText }}
      </p>
      <p class="mt-1 text-tiny leading-relaxed text-muted-foreground">{{ statusMessage }}</p>
    </div>
  </section>
</template>
