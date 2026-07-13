<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import {
  ShPrimaryNavigation,
  type PrimaryNavigationItem,
} from "@shakilabs/ui";
import { trackEvent } from "@/lib/analytics";
import { getPageGroup } from "@/utils/pageTracking";

const route = useRoute();

const navigationItems: readonly PrimaryNavigationItem[] = [
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
  { key: "home", label: "부동산 도구", to: "/", href: "/house" },
];

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
  <ShPrimaryNavigation
    :items="navigationItems"
    :mobile-items="mobileItems"
    :active-key="activeItem?.key"
    :link-component="RouterLink"
    aria-label="주요 계산기"
    @select="trackNavigation"
  />
</template>
