import type { PrimaryNavigationItem } from "@shakilabs/ui";

/** 2차 내비(PrimaryNavigation)와 모바일 드로어(AppHeader)가 공유하는 단일 출처.
 * v3 §3.3-1 — 목록을 두 곳에 복제하지 않는다. */
// 2026-11 UI 감사 §D: 탭 11개가 390px에서 세 줄로 접혔다. GA4 28일(보증금 이자 54, 전세·월세 6, 그 외 0~1)과
// 네이버 유입(전환율 1위)으로 6개만 남기고 나머지는 /·푸터·홈 카드로 간다.
export const HOUSE_NAVIGATION_ITEMS: readonly PrimaryNavigationItem[] = [
  { key: "delay-interest", label: "보증금 이자", to: "/delay-interest" },
  { key: "jeonse-wolse-rate", label: "전환율", to: "/jeonse-wolse-rate" },
  { key: "jeonse-vs-wolse", label: "전세·월세", to: "/jeonse-vs-wolse" },
  { key: "property-tax", label: "재산세", to: "/property-tax" },
  { key: "acquisition-tax", label: "취득세", to: "/acquisition-tax" },
  { key: "capital-gains-tax", label: "양도세", to: "/capital-gains-tax" },
  { key: "home", label: "부동산 도구", to: "/", href: "/house" },
];
