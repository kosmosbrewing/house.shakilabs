<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  ShPrimaryNavigation,
  type PrimaryNavigationItem,
} from "@shakilabs/ui";
import { trackEvent } from "@/lib/analytics";
import { getPageGroup } from "@/utils/pageTracking";
import { HOUSE_NAVIGATION_ITEMS } from "@/data/houseNavigation";

const route = useRoute();

const navigationItems = HOUSE_NAVIGATION_ITEMS;

const mobileDefaultKeys = [
  "delay-interest",
  "property-tax",
  "jeonse-wolse-rate",
  "jeonse-vs-wolse",
  "brokerage-fee",
  "home",
] as const;

function isActive(item: PrimaryNavigationItem): boolean {
  if (item.key === "home") return route.path === "/";
  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}

const activeItem = computed(() => navigationItems.find(isActive));
const mobileItems = computed(() => {
  const keys: string[] = [...mobileDefaultKeys];

  if (activeItem.value && !keys.includes(activeItem.value.key)) {
    keys[4] = activeItem.value.key;
  }

  return keys
    .map((key) => navigationItems.find((item) => item.key === key))
    .filter((item): item is PrimaryNavigationItem => Boolean(item));
});

function trackNavigation(item: PrimaryNavigationItem): void {
  trackEvent("nav_click", {
    from_tool: getPageGroup(route.path),
    to_tool: item.key,
    placement: "primary_nav",
  });
}
</script>

<template>
  <!-- 모바일(<48rem)은 헤더의 좌측 드로어가 대신한다(v3 §3.3-1) — 링크는
       AppHeader의 nav-items(HOUSE_NAVIGATION_ITEMS, 같은 출처)로 드로어에
       그대로 렌더되어 크롤 경로는 유지된다. -->
  <ShPrimaryNavigation
    class="house-secondary-nav"
    :items="navigationItems"
    :mobile-items="mobileItems"
    :active-key="activeItem?.key"
    :link-component="RouterLink"
    aria-label="주요 계산기"
    @select="trackNavigation"
  />
</template>

<style scoped>
@media (max-width: 47.99rem) {
  .house-secondary-nav {
    display: none;
  }
}
</style>
