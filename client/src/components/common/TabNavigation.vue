<script setup lang="ts">
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";

const route = useRoute();

const tabs = [
  { key: "home", label: "홈", to: "/" },
  { key: "delay", label: "보증금 지연이자", to: "/delay-interest" },
  { key: "compare", label: "전세 vs 월세", to: "/jeonse-vs-wolse" },
  { key: "brokerage", label: "중개보수", to: "/brokerage-fee" },
  { key: "first-home", label: "생애최초", to: "/first-home" },
  { key: "subscription", label: "청약가점", to: "/housing-subscription" },
  { key: "property-tax", label: "보유세", to: "/property-tax" },
] as const;

const activePath = computed(() => route.path);

function isActiveTab(key: (typeof tabs)[number]["key"]): boolean {
  if (key === "home") return activePath.value === "/";
  if (key === "delay") return activePath.value === "/delay-interest";
  if (key === "compare") return activePath.value === "/jeonse-vs-wolse";
  if (key === "brokerage") return activePath.value === "/brokerage-fee";
  if (key === "first-home") return activePath.value === "/first-home";
  if (key === "subscription") return activePath.value === "/housing-subscription";
  if (key === "property-tax") return activePath.value === "/property-tax";
  return false;
}
</script>

<template>
  <nav class="sticky top-0 z-50 border-b border-primary/20 bg-primary shadow-sm" aria-label="주요 메뉴">
    <div class="container">
      <div class="flex h-12 items-center gap-1 overflow-x-auto sm:gap-2" style="scrollbar-width: none">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.key"
          :to="tab.to"
          :aria-current="isActiveTab(tab.key) ? 'page' : undefined"
          :class="[
            'touch-target relative inline-flex h-12 shrink-0 items-center whitespace-nowrap px-2.5 text-caption font-semibold transition-all duration-200 sm:px-3 sm:text-body',
            isActiveTab(tab.key)
              ? 'text-white hover:text-white'
              : 'text-white/70 hover:text-white/90',
          ]"
        >
          {{ tab.label }}
          <span
            v-if="isActiveTab(tab.key)"
            class="absolute inset-x-1 bottom-0 h-[3px] rounded-full bg-white"
          />
        </RouterLink>
      </div>
    </div>
  </nav>
</template>
