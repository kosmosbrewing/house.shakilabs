<script setup lang="ts">
import { computed, onMounted } from "vue";
import { ArrowRight } from "lucide-vue-next";
import { RouterLink, useRoute } from "vue-router";
import { trackEvent } from "@/lib/analytics";
import { getPageGroup } from "@/utils/pageTracking";

interface CalculatorItem {
  key: string;
  title: string;
  description: string;
  to: string;
}

const route = useRoute();

const items: CalculatorItem[] = [
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
  {
    key: "jeonse-vs-wolse",
    title: "전세 vs 월세",
    description: "기회비용까지 반영해 유리한 쪽을 판정합니다.",
    to: "/jeonse-vs-wolse",
  },
  {
    key: "brokerage-fee",
    title: "중개보수",
    description: "거래 유형별 상한요율과 최대 보수를 계산합니다.",
    to: "/brokerage-fee",
  },
  {
    key: "first-home",
    title: "생애최초 혜택",
    description: "취득세 감면과 대출 한도를 함께 확인합니다.",
    to: "/first-home",
  },
  {
    key: "housing-subscription",
    title: "청약 가점",
    description: "84점 만점 기준 내 청약 가점을 계산합니다.",
    to: "/housing-subscription",
  },
  {
    key: "capital-gains-tax",
    title: "양도소득세",
    description: "비과세·장기보유공제를 반영해 세액을 추정합니다.",
    to: "/capital-gains-tax",
  },
  {
    key: "acquisition-tax",
    title: "취득세",
    description: "매매가와 주택 수 기준 취득세를 계산합니다.",
    to: "/acquisition-tax",
  },
  {
    key: "rental-yield",
    title: "임대수익률",
    description: "총·순수익률과 자기자본수익률을 구분해 봅니다.",
    to: "/rental-yield",
  },
];

const itemByKey = new Map(items.map((item) => [item.key, item]));

// 계산기별 관련 4개 맵 — 임차(전월세) → 매수 → 보유 → 매도 사용자 여정 기준 (finance InternalLink 패턴)
const RELATED_MAP: Record<string, readonly string[]> = {
  "delay-interest": ["jeonse-wolse-rate", "jeonse-vs-wolse", "brokerage-fee", "rental-yield"],
  "property-tax": ["acquisition-tax", "capital-gains-tax", "first-home", "rental-yield"],
  "jeonse-wolse-rate": ["jeonse-vs-wolse", "delay-interest", "brokerage-fee", "rental-yield"],
  "jeonse-vs-wolse": ["jeonse-wolse-rate", "delay-interest", "brokerage-fee", "first-home"],
  "brokerage-fee": ["jeonse-vs-wolse", "acquisition-tax", "delay-interest", "jeonse-wolse-rate"],
  "first-home": ["acquisition-tax", "housing-subscription", "property-tax", "jeonse-vs-wolse"],
  "housing-subscription": ["first-home", "acquisition-tax", "jeonse-vs-wolse", "property-tax"],
  "capital-gains-tax": ["property-tax", "acquisition-tax", "rental-yield", "brokerage-fee"],
  "acquisition-tax": ["first-home", "property-tax", "capital-gains-tax", "brokerage-fee"],
  "rental-yield": ["property-tax", "capital-gains-tax", "jeonse-wolse-rate", "brokerage-fee"],
};

// 홈 등 미매핑 그룹은 GA 유입 상위 3개로 폴백
const FALLBACK_KEYS: readonly string[] = ["delay-interest", "property-tax", "jeonse-wolse-rate"];

const currentGroup = computed(() => getPageGroup(route.path));
const relatedItems = computed(() => {
  const keys = RELATED_MAP[currentGroup.value] ?? FALLBACK_KEYS;
  return keys
    .filter((key) => key !== currentGroup.value)
    .map((key) => itemByKey.get(key))
    .filter((item): item is CalculatorItem => Boolean(item));
});

onMounted(() => {
  relatedItems.value.forEach((item) => trackEvent("related_tool_impression", {
    app_id: "house",
    from_tool: currentGroup.value,
    to_tool: item.key,
    placement: "after_result",
  }));
});

function trackRelatedClick(toTool: string): void {
  trackEvent("related_tool_click", {
    app_id: "house",
    from_tool: currentGroup.value,
    to_tool: toTool,
    placement: "after_result",
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
          {{ item.title }} 계산
          <ArrowRight class="h-3.5 w-3.5" />
        </span>
      </RouterLink>
    </div>
  </section>
</template>
