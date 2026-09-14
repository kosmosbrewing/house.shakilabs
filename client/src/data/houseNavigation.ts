import type { PrimaryNavigationItem } from "@shakilabs/ui";

/** 2차 내비(PrimaryNavigation)와 모바일 드로어(AppHeader)가 공유하는 단일 출처.
 * v3 §3.3-1 — 목록을 두 곳에 복제하지 않는다. */
export const HOUSE_NAVIGATION_ITEMS: readonly PrimaryNavigationItem[] = [
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
