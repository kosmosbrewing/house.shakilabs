<script setup lang="ts">
import { computed, useId } from "vue";
import { signedBarGeometry } from "@/utils/chartMath";

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
  return [metric.key, { minimum: Math.min(0, ...values), maximum: Math.max(0, ...values) }];
})));

function geometry(metricKey: string, value: number) {
  const domain = domains.value.get(metricKey) ?? { minimum: 0, maximum: 0 };
  return signedBarGeometry(value, domain.minimum, domain.maximum);
}

function toneClass(tone: Tone | undefined, value: number, prefix: "fill" | "text"): string {
  const resolved = value < 0 ? "fee" : tone ?? "muted";
  if (prefix === "fill") {
    if (resolved === "primary") return "fill-primary";
    if (resolved === "fee") return "fill-fee";
    if (resolved === "profit") return "fill-profit";
    return "fill-muted-foreground/45";
  }
  if (resolved === "primary") return "text-primary";
  if (resolved === "fee") return "text-fee";
  if (resolved === "profit") return "text-profit";
  return "text-foreground";
}
</script>

<template>
  <section class="rounded-xl border border-border/60 bg-card p-4" :aria-labelledby="titleId">
    <h3 :id="titleId" class="text-caption font-semibold text-foreground">{{ title }}</h3>
    <p class="mt-1 text-tiny leading-relaxed text-muted-foreground">{{ note }}</p>
    <div class="mt-4 space-y-5">
      <div v-for="metric in metrics" :key="metric.key" class="space-y-3">
        <h4 class="border-b border-border/50 pb-1.5 text-tiny font-semibold text-muted-foreground">{{ metric.label }}</h4>
        <div v-for="item in metric.values" :key="item.key" class="space-y-1.5">
          <div class="flex items-baseline justify-between gap-3 text-caption">
            <span class="font-semibold" :class="toneClass(item.tone, item.value, 'text')">{{ item.label }}</span>
            <strong class="tabular-nums" :class="toneClass(item.tone, item.value, 'text')">{{ formatValue(item.value) }}</strong>
          </div>
          <div class="h-3 overflow-hidden rounded-full bg-muted/55">
            <svg viewBox="0 0 100 12" preserveAspectRatio="none" class="block h-full w-full" aria-hidden="true">
              <rect :x="geometry(metric.key, item.value).start" :width="geometry(metric.key, item.value).width" height="12" rx="4" :class="toneClass(item.tone, item.value, 'fill')" />
              <line :x1="geometry(metric.key, item.value).zero" :x2="geometry(metric.key, item.value).zero" y1="0" y2="12" class="stroke-border" vector-effect="non-scaling-stroke" />
            </svg>
          </div>
          <p v-if="item.detail" class="text-tiny text-muted-foreground">{{ item.detail }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
