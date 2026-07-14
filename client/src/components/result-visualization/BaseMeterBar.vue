<script setup lang="ts">
import { computed } from "vue";
import { thresholdMeterGeometry } from "@/utils/meterMath";

const props = withDefaults(defineProps<{
  label: string;
  value: number;
  threshold: number;
  maximum: number;
  formatValue: (value: number) => string;
  formatScaleValue?: (value: number) => string;
  valueLabel?: string;
  thresholdLabel?: string;
  minimum?: number;
  tolerance?: number;
  ariaValueText?: string;
}>(), {
  valueLabel: "현재 값",
  thresholdLabel: "기준",
  minimum: 0,
  tolerance: 0,
  formatScaleValue: undefined,
  ariaValueText: undefined,
});

const geometry = computed(() => thresholdMeterGeometry(
  props.value,
  props.threshold,
  props.minimum,
  props.maximum,
  props.tolerance,
));
const scaleFormatter = computed(() => props.formatScaleValue ?? props.formatValue);
const meterValue = computed(() => Math.min(props.maximum, Math.max(props.minimum, props.value)));
const baseStyle = computed(() => ({ width: `${geometry.value.basePercent}%` }));
const excessStyle = computed(() => ({
  left: `${geometry.value.excessStartPercent}%`,
  width: `${geometry.value.excessPercent}%`,
}));

function markerStyle(percent: number): Record<string, string> {
  if (percent <= 0) return { left: "0" };
  if (percent >= 100) return { left: "calc(100% - 2px)" };
  return { left: `calc(${percent}% - 1px)` };
}

function scaleMarkerClass(percent: number): string {
  if (percent <= 18) return "translate-x-0";
  if (percent >= 82) return "-translate-x-full";
  return "-translate-x-1/2";
}
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between gap-3 text-caption">
      <span class="font-semibold text-muted-foreground">{{ valueLabel }}</span>
      <strong class="tabular-nums" :class="geometry.state === 'above' ? 'text-fee' : 'text-primary'">
        {{ formatValue(value) }}
      </strong>
    </div>

    <div
      data-meter-track
      class="relative mt-3 h-3 rounded-[6px] bg-muted/70"
      role="meter"
      :aria-label="label"
      :aria-valuemin="minimum"
      :aria-valuemax="maximum"
      :aria-valuenow="meterValue"
      :aria-valuetext="ariaValueText"
    >
      <span
        v-if="geometry.basePercent > 0"
        data-meter-base
        class="meter-segment absolute inset-y-0 left-0 bg-primary"
        :class="geometry.state === 'above' ? 'meter-segment--start' : 'meter-segment--both'"
        :style="baseStyle"
        aria-hidden="true"
      />
      <span
        v-if="geometry.excessPercent > 0"
        data-meter-excess
        class="meter-segment absolute inset-y-0 bg-fee"
        :class="geometry.excessStartPercent <= 0 ? 'meter-segment--both' : 'meter-segment--end'"
        :style="excessStyle"
        aria-hidden="true"
      />
      <span
        data-meter-threshold
        class="absolute -top-1 -bottom-1 z-10 border-l border-dashed border-foreground/70"
        :style="markerStyle(geometry.thresholdPercent)"
        aria-hidden="true"
      />
      <span
        v-if="geometry.state !== 'equal'"
        data-meter-value
        class="absolute -top-[3px] z-20 h-[18px] w-[2px] bg-foreground"
        :style="markerStyle(geometry.valuePercent)"
        aria-hidden="true"
      />
    </div>

    <div class="relative mt-2 h-5 text-tiny tabular-nums text-muted-foreground" aria-hidden="true">
      <span class="absolute left-0">{{ scaleFormatter(minimum) }}</span>
      <span
        class="absolute whitespace-nowrap"
        :class="scaleMarkerClass(geometry.thresholdPercent)"
        :style="{ left: `${geometry.thresholdPercent}%` }"
      >
        {{ thresholdLabel }} {{ scaleFormatter(threshold) }}
      </span>
      <span class="absolute right-0">{{ scaleFormatter(maximum) }}</span>
    </div>
  </div>
</template>

<style scoped>
.meter-segment--start {
  border-radius: 6px 0 0 6px;
}

.meter-segment--end {
  border-radius: 0 6px 6px 0;
}

.meter-segment--both {
  border-radius: 6px;
}
</style>
