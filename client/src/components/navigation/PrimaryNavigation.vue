<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { trackEvent } from "@/lib/analytics";
import { getPageGroup } from "@/utils/pageTracking";

interface NavigationItem {
  key: string;
  label: string;
  to: string;
}

const route = useRoute();

const navigationItems: readonly NavigationItem[] = [
  { key: "delay-interest", label: "보증금 이자", to: "/delay-interest" },
  { key: "property-tax", label: "재산세", to: "/property-tax" },
  { key: "jeonse-wolse-rate", label: "전환율", to: "/jeonse-wolse-rate" },
  { key: "jeonse-vs-wolse", label: "전세·월세", to: "/jeonse-vs-wolse" },
  { key: "brokerage-fee", label: "중개보수", to: "/brokerage-fee" },
  { key: "acquisition-tax", label: "취득세", to: "/acquisition-tax" },
  { key: "capital-gains-tax", label: "양도세", to: "/capital-gains-tax" },
  { key: "rental-yield", label: "임대수익률", to: "/rental-yield" },
  { key: "first-home", label: "생애최초", to: "/first-home" },
  { key: "housing-subscription", label: "청약가점", to: "/housing-subscription" },
  { key: "home", label: "전체", to: "/" },
];

const mobileDefaultKeys = [
  "delay-interest",
  "property-tax",
  "jeonse-wolse-rate",
  "jeonse-vs-wolse",
  "brokerage-fee",
  "home",
] as const;

function isActive(item: NavigationItem): boolean {
  if (item.key === "home") return route.path === "/";
  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}

const activeItem = computed(() => navigationItems.find(isActive));
const mobileItems = computed(() => {
  const keys: string[] = [...mobileDefaultKeys];
  const current = activeItem.value;

  if (current && !keys.includes(current.key)) {
    keys[4] = current.key;
  }

  return keys
    .map((key) => navigationItems.find((item) => item.key === key))
    .filter((item): item is NavigationItem => Boolean(item));
});

function trackNavigation(item: NavigationItem): void {
  trackEvent("nav_click", {
    from_tool: getPageGroup(route.path),
    to_tool: item.key,
    placement: "primary_nav",
  });
}
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-primary/20 bg-primary shadow-sm" aria-label="주요 계산기">
    <div class="container px-3 py-1.5 sm:px-4 sm:py-0">
      <div class="grid grid-cols-3 gap-1 sm:hidden">
        <RouterLink
          v-for="item in mobileItems"
          :key="item.key"
          :to="item.to"
          :aria-current="isActive(item) ? 'page' : undefined"
          :class="[
            'flex min-h-[44px] items-center justify-center rounded-lg px-1 py-1.5 text-center text-[0.7rem] font-medium leading-tight transition-colors',
            isActive(item)
              ? 'bg-white/20 font-semibold text-white'
              : 'text-white/75 active:bg-white/10',
          ]"
          @click="trackNavigation(item)"
        >
          <span class="break-keep">{{ item.label }}</span>
        </RouterLink>
      </div>

      <div class="tab-scroll hidden h-12 items-center gap-2 overflow-x-auto sm:flex">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.key"
          :to="item.to"
          :aria-current="isActive(item) ? 'page' : undefined"
          :class="[
            'relative flex h-12 shrink-0 items-center justify-center px-3 text-body font-semibold transition-colors',
            isActive(item) ? 'text-white' : 'text-white/70 hover:text-white',
          ]"
          @click="trackNavigation(item)"
        >
          {{ item.label }}
          <span
            v-if="isActive(item)"
            class="absolute inset-x-1 bottom-0 h-[3px] rounded-full bg-white"
            aria-hidden="true"
          />
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.tab-scroll {
  scrollbar-width: none;
}

.tab-scroll::-webkit-scrollbar {
  display: none;
}
</style>
