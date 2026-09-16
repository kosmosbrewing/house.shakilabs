<script setup lang="ts">
// v3 AppShell(BL-003/004) — 앱 자체 헤더 마크업을 패키지 ShGlobalHeader로 교체한다.
// 검정 고정 배경·56px 높이·로고→포털 홈(/)은 패키지가 강제하므로 앱은 유틸(테마 토글)만 채운다.
// 0.3.24부터 팁 티커를 #tip 슬롯으로 헤더에 되돌린다 — 패키지가 팁을 out-of-flow로
// 렌더해 텍스트 길이와 무관하게 56px 고정 높이를 유지하므로 BL-005가 재발하지 않는다.
import { computed, onMounted, ref } from "vue";
import { Moon, Sun } from "lucide-vue-next";
import { RouterLink, useRoute } from "vue-router";
import { ShButton, ShGlobalHeader } from "@shakilabs/ui";
import { HOUSE_NAVIGATION_ITEMS } from "@/data/houseNavigation";
import TickerBar from "@/components/common/TickerBar.vue";
import { tickerMessages } from "@/data/tickerMessages";

const THEME_STORAGE_KEY = "house-calculator:theme:v1";
type ThemeMode = "light" | "dark";

// 모바일 드로어(v3 §3.3-1)에 실을 도구 목록 — 2차 내비(PrimaryNavigation)와 같은
// 출처(HOUSE_NAVIGATION_ITEMS)를 쓴다. 목록을 복제하지 않는다.
const route = useRoute();
const navItems = HOUSE_NAVIGATION_ITEMS;
const navActiveKey = computed(() => {
  if (route.path === "/") return "home";
  return (
    navItems.find(
      (item) => item.key !== "home" && (route.path === item.to || route.path.startsWith(`${item.to}/`)),
    )?.key ?? ""
  );
});

const theme = ref<ThemeMode>("light");

function applyTheme(next: ThemeMode): void {
  theme.value = next;
  document.documentElement.classList.toggle("dark", next === "dark");
  localStorage.setItem(THEME_STORAGE_KEY, next);
}

function toggleTheme(): void {
  applyTheme(theme.value === "dark" ? "light" : "dark");
}

onMounted(() => {
  theme.value = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
});
</script>

<template>
  <ShGlobalHeader
    :nav-items="navItems"
    :nav-active-key="navActiveKey"
    nav-title="부동산 도구"
    :link-component="RouterLink"
  >
    <template #tip>
      <TickerBar :messages="tickerMessages" />
    </template>
    <template #utility>
      <ShButton
        type="button"
        variant="secondary"
        size="sm"
        class="design-system-theme-toggle shrink-0"
        :aria-label="theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'"
        @click="toggleTheme"
      >
        <Moon v-if="theme === 'dark'" class="h-4 w-4" />
        <Sun v-else class="h-4 w-4" />
      </ShButton>
    </template>
  </ShGlobalHeader>
</template>
