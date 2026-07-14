<script setup lang="ts">
import { computed } from "vue";
import { signedBarGeometry } from "@/utils/chartMath";

type MeterTone = "primary" | "fee" | "profit" | "muted";

const props = withDefaults(defineProps<{
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  formatValue: (value: number) => string;
  tone?: MeterTone;
  detail?: string;
  showScale?: boolean;
  ariaValueText?: string;
}>(), {
  tone: "muted",
  detail: undefined,
  showScale: false,
  ariaValueText: undefined,
});

const safeMinimum = computed(() => Math.min(0, Number.isFinite(props.minimum) ? props.minimum : 0));
const safeMaximum = computed(() => {
  const maximum = Math.max(0, Number.isFinite(props.maximum) ? props.maximum : 0);
  return maximum > safeMinimum.value ? maximum : safeMinimum.value + 1;
});
const geometry = computed(() => signedBarGeometry(
  props.value,
  safeMinimum.value,
  safeMaximum.value,
));
const meterValue = computed(() => {
  const value = Number.isFinite(props.value) ? props.value : 0;
  return Math.min(safeMaximum.value, Math.max(safeMinimum.value, value));
});
const hasMixedDomain = computed(() => safeMinimum.value < 0 && safeMaximum.value > 0);
const fillStyle = computed(() => ({
  left: `${geometry.value.start}%`,
  width: `${geometry.value.width}%`,
}));
const valuePercent = computed(() => (
  props.value < 0
    ? geometry.value.start
    : geometry.value.start + geometry.value.width
));
const resolvedTone = computed<MeterTone>(() => props.value < 0 ? "fee" : props.tone);
const fillShapeClass = computed(() => {
  if (!hasMixedDomain.value) return "comparison-segment--both";
  return props.value < 0 ? "comparison-segment--start" : "comparison-segment--end";
});
const ariaText = computed(() => props.ariaValueText ?? `${props.label} ${props.formatValue(props.value)}`);

function markerStyle(percent: number): Record<string, string> {
  if (percent <= 0) return { left: "0" };
  if (percent >= 100) return { left: "calc(100% - 2px)" };
  return { left: `calc(${percent}% - 1px)` };
}

function backgroundToneClass(tone: MeterTone): string {
  if (tone === "fee") return "bg-fee";
  if (tone === "profit") return "bg-profit";
  if (tone === "primary") return "bg-primary";
  return "bg-muted-foreground/45";
}

function textToneClass(tone: MeterTone): string {
  if (tone === "fee") return "text-fee";
  if (tone === "profit") return "text-profit";
  if (tone === "primary") return "text-primary";
  return "text-foreground";
}
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between gap-3 text-caption">
      <span class="font-semibold" :class="textToneClass(resolvedTone)">{{ label }}</span>
      <strong class="tabular-nums" :class="textToneClass(resolvedTone)">{{ formatValue(value) }}</strong>
    </div>

    <div
      data-comparison-track
      class="relative mt-2 h-3 rounded-[6px] bg-muted/70"
      role="meter"
      :aria-label="label"
      :aria-valuemin="safeMinimum"
      :aria-valuemax="safeMaximum"
      :aria-valuenow="meterValue"
      :aria-valuetext="ariaText"
    >
      <span
        v-if="geometry.width > 0"
        data-comparison-fill
        class="absolute inset-y-0"
        :class="[backgroundToneClass(resolvedTone), fillShapeClass]"
        :style="fillStyle"
        aria-hidden="true"
      />
      <span
        v-if="hasMixedDomain"
        data-comparison-zero
        class="absolute -top-1 -bottom-1 z-10 border-l border-dashed border-foreground/60"
        :style="markerStyle(geometry.zero)"
        aria-hidden="true"
      />
      <span
        v-if="geometry.width > 0"
        data-comparison-value
        class="absolute -top-[3px] z-20 h-[18px] w-[2px] bg-foreground"
        :style="markerStyle(valuePercent)"
        aria-hidden="true"
      />
    </div>

    <div v-if="showScale" class="relative mt-2 h-5 text-tiny tabular-nums text-muted-foreground" aria-hidden="true">
      <span class="absolute left-0">{{ formatValue(safeMinimum) }}</span>
      <span
        v-if="hasMixedDomain && geometry.zero >= 18 && geometry.zero <= 82"
        class="absolute -translate-x-1/2 whitespace-nowrap"
        :style="{ left: `${geometry.zero}%` }"
      >
        {{ formatValue(0) }}
      </span>
      <span class="absolute right-0">{{ formatValue(safeMaximum) }}</span>
    </div>
    <p v-if="detail" class="mt-1 text-tiny text-muted-foreground">{{ detail }}</p>
  </div>
</template>

<style scoped>
.comparison-segment--start {
  border-radius: 6px 0 0 6px;
}

.comparison-segment--end {
  border-radius: 0 6px 6px 0;
}

.comparison-segment--both {
  border-radius: 6px;
}
</style>
