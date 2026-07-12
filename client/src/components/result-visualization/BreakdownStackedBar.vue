<script setup lang="ts">
import { computed, useId } from "vue";
import { normalizeSegments } from "@/utils/chartMath";

type Tone = "primary" | "fee" | "profit" | "muted";
type Segment = { key: string; label: string; value: number; tone: Tone };
const props = defineProps<{
  title: string;
  note: string;
  segments: readonly Segment[];
  formatValue: (value: number) => string;
}>();
const titleId = `house-breakdown-${useId()}`;
const ratios = computed(() => normalizeSegments(props.segments.map((segment) => segment.value)));
const offsets = computed(() => ratios.value.map((_, index) => ratios.value.slice(0, index).reduce((sum, ratio) => sum + ratio, 0)));

function fillClass(tone: Tone): string {
  if (tone === "fee") return "fill-fee";
  if (tone === "profit") return "fill-profit";
  if (tone === "muted") return "fill-muted-foreground/45";
  return "fill-primary";
}
</script>

<template>
  <section class="rounded-xl border border-border/60 bg-card p-4" :aria-labelledby="titleId">
    <h3 :id="titleId" class="text-caption font-semibold text-foreground">{{ title }}</h3>
    <p class="mt-1 text-tiny leading-relaxed text-muted-foreground">{{ note }}</p>
    <svg viewBox="0 0 100 18" preserveAspectRatio="none" class="mt-3 h-5 w-full overflow-hidden rounded-lg" role="img" :aria-labelledby="titleId">
      <rect v-for="(segment, index) in segments" :key="segment.key" :x="offsets[index] * 100" :width="ratios[index] * 100" height="18" :class="fillClass(segment.tone)" />
    </svg>
    <dl class="mt-3 grid gap-2 sm:grid-cols-2">
      <div v-for="segment in segments" :key="`${segment.key}-legend`" class="flex justify-between gap-3 text-caption">
        <dt class="text-muted-foreground">{{ segment.label }}</dt>
        <dd class="font-semibold tabular-nums">{{ formatValue(segment.value) }}</dd>
      </div>
    </dl>
  </section>
</template>
