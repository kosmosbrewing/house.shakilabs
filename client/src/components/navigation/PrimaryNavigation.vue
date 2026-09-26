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

function isActive(item: PrimaryNavigationItem): boolean {
  if (item.key === "home") return route.path === "/";
  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}

const activeItem = computed(() => navigationItems.find(isActive));

function trackNavigation(item: PrimaryNavigationItem): void {
  trackEvent("nav_click", {
    from_tool: getPageGroup(route.path),
    to_tool: item.key,
    placement: "primary_nav",
  });
}
</script>

<template>
  <!-- 모바일(<48rem)에서는 패키지가 이 탭 줄을 숨기고 헤더 ☰가 같은 목록을 연다(0.3.38).
       ☰ 목록은 항상 DOM에 렌더되므로 크롤 경로는 끊기지 않는다. -->
  <ShPrimaryNavigation
    :items="navigationItems"
    :active-key="activeItem?.key"
    :link-component="RouterLink"
    aria-label="주요 계산기"
    @select="trackNavigation"
  />
</template>
