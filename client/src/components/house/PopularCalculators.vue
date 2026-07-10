<script setup lang="ts">
import { computed } from "vue";
import { ArrowRight } from "lucide-vue-next";
import { RouterLink, useRoute } from "vue-router";
import { trackEvent } from "@/lib/analytics";
import { getPageGroup } from "@/utils/pageTracking";

const route = useRoute();
const items = [
  {
    key: "delay-interest",
    title: "보증금 반환 지연이자",
    description: "반환이 늦어진 기간의 예상 이자를 계산합니다.",
    to: "/delay-interest",
  },
  {
    key: "property-tax",
    title: "재산세·보유세",
    description: "시세를 기준으로 연간 보유세를 추정합니다.",
    to: "/property-tax",
  },
  {
    key: "jeonse-wolse-rate",
    title: "전월세 전환율",
    description: "법정 상한과 적정 월세를 함께 확인합니다.",
    to: "/jeonse-wolse-rate",
  },
] as const;

const currentGroup = computed(() => getPageGroup(route.path));
const relatedItems = computed(() =>
  items.filter((item) => item.key !== currentGroup.value),
);

function trackRelatedClick(toTool: string): void {
  trackEvent("popular_tool_click", {
    from_tool: currentGroup.value,
    to_tool: toTool,
    placement: "calculator_footer",
  });
}
</script>

<template>
  <section class="retro-panel overflow-hidden" aria-labelledby="popular-calculators-title">
    <div class="retro-titlebar rounded-t-2xl">
      <h2 id="popular-calculators-title" class="retro-title">함께 많이 찾는 계산기</h2>
    </div>
    <div class="retro-panel-content grid gap-3 sm:grid-cols-2">
      <RouterLink
        v-for="item in relatedItems"
        :key="item.key"
        :to="item.to"
        class="group rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/30"
        @click="trackRelatedClick(item.key)"
      >
        <p class="font-bold text-foreground">{{ item.title }}</p>
        <p class="mt-1.5 text-caption leading-relaxed text-muted-foreground">
          {{ item.description }}
        </p>
        <span class="mt-3 inline-flex items-center gap-1 text-caption font-semibold text-primary">
          계산하기
          <ArrowRight class="h-3.5 w-3.5" />
        </span>
      </RouterLink>
    </div>
  </section>
</template>
