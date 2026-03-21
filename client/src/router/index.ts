import { nextTick } from "vue";
import type { Router, RouteRecordRaw } from "vue-router";
import { showAlert } from "@/composables/useAlert";
import { trackPageView } from "@/lib/analytics";
import { useAuthStore } from "@/stores/auth";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/HomeView.vue"),
  },
  {
    path: "/delay-interest",
    name: "DelayInterest",
    component: () => import("@/views/DelayInterestView.vue"),
  },
  {
    path: "/delay-interest/:deposit(\\d+)",
    name: "DelayInterestDeposit",
    component: () => import("@/views/DelayInterestView.vue"),
    props: (route) => ({
      initialDeposit: Number(route.params.deposit) * 10000,
    }),
  },
  {
    path: "/jeonse-vs-wolse",
    name: "JeonseVsWolse",
    component: () => import("@/views/JeonseVsWolseView.vue"),
  },
  {
    path: "/jeonse-vs-wolse/:deposit(\\d+)",
    name: "JeonseVsWolseDeposit",
    component: () => import("@/views/JeonseVsWolseView.vue"),
    props: (route) => ({
      initialDeposit: Number(route.params.deposit) * 10000,
    }),
  },
  {
    path: "/jeonse-wolse-rate",
    name: "JeonseWolseRate",
    component: () => import("@/views/JeonseWolseRateView.vue"),
  },
  {
    path: "/jeonse-wolse-rate/:deposit(\\d+)",
    name: "JeonseWolseRateDeposit",
    component: () => import("@/views/JeonseWolseRateView.vue"),
    props: (route) => ({
      initialDeposit: Number(route.params.deposit) * 10000,
    }),
  },
  {
    path: "/brokerage-fee",
    name: "BrokerageFee",
    component: () => import("@/views/BrokerageFeeView.vue"),
  },
  {
    path: "/brokerage-fee/:price(\\d+)",
    name: "BrokerageFeePrice",
    component: () => import("@/views/BrokerageFeeView.vue"),
    props: (route) => ({
      initialAmount: Number(route.params.price) * 10000,
    }),
  },
  {
    path: "/first-home",
    name: "FirstHome",
    component: () => import("@/views/FirstHomeView.vue"),
  },
  {
    path: "/housing-subscription",
    name: "HousingSubscription",
    component: () => import("@/views/HousingSubscriptionView.vue"),
  },
  {
    path: "/property-tax",
    name: "PropertyTax",
    component: () => import("@/views/PropertyTaxView.vue"),
  },
  {
    path: "/property-tax/:price(\\d+)",
    name: "PropertyTaxPrice",
    component: () => import("@/views/PropertyTaxView.vue"),
    props: (route) => ({
      initialPrice: Number(route.params.price) * 10000,
    }),
  },
  { path: "/conversion-rate", redirect: "/jeonse-wolse-rate" },
  { path: "/interest", redirect: "/delay-interest" },
  { path: "/jeonse", redirect: "/jeonse-vs-wolse" },
  { path: "/rent-compare", redirect: "/jeonse-vs-wolse" },
  { path: "/commission", redirect: "/brokerage-fee" },
  { path: "/score", redirect: "/housing-subscription" },
  { path: "/holding-tax", redirect: "/property-tax" },

  {
    path: "/capital-gains-tax",
    name: "CapitalGainsTax",
    component: () => import("@/views/CapitalGainsTaxView.vue"),
  },
  {
    path: "/capital-gains-tax/:sellPrice(\\d+)",
    name: "CapitalGainsTaxPrice",
    component: () => import("@/views/CapitalGainsTaxView.vue"),
    props: (route) => ({
      initialSellPrice: Number(route.params.sellPrice) * 10000,
    }),
  },

  {
    path: "/acquisition-tax",
    name: "AcquisitionTax",
    component: () => import("@/views/AcquisitionTaxView.vue"),
  },
  {
    path: "/acquisition-tax/:price(\\d+)",
    name: "AcquisitionTaxPrice",
    component: () => import("@/views/AcquisitionTaxView.vue"),
    props: (route) => ({
      initialPrice: Number(route.params.price) * 10000,
    }),
  },

  {
    path: "/rental-yield",
    name: "RentalYield",
    component: () => import("@/views/RentalYieldView.vue"),
  },
  {
    path: "/rental-yield/:price(\\d+)",
    name: "RentalYieldPrice",
    component: () => import("@/views/RentalYieldView.vue"),
    props: (route) => ({
      initialPrice: Number(route.params.price) * 10000,
    }),
  },

  {
    path: "/about",
    name: "About",
    component: () => import("@/views/AboutView.vue"),
  },
  {
    path: "/terms",
    name: "Terms",
    component: () => import("@/views/TermsView.vue"),
  },
  {
    path: "/privacy",
    name: "Privacy",
    component: () => import("@/views/PrivacyView.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFoundView.vue"),
  },
];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function createScrollBehavior(): Router["options"]["scrollBehavior"] {
  return (to, from, savedPosition) => {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: "smooth", top: 80 };
    // query parameter만 변경된 경우 스크롤 유지
    if (to.path === from.path) return false;
    return { top: 0 };
  };
}

export function setupRouterGuards(router: Router): void {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore();
    const needsAuthState = Boolean(to.meta.requiresAuth || to.meta.requiresAdmin || to.meta.guestOnly);

    if (needsAuthState && !authStore.isInitialized) {
      try {
        await authStore.loadUser({ throwOnError: true });
      } catch {
        if (isBrowser()) {
          showAlert("사용자 정보를 불러오지 못했습니다.", { type: "error" });
        }
        return false;
      }
    }

    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return "/";
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      if (isBrowser()) {
        showAlert("로그인이 필요합니다.", { type: "error" });
      }
      return "/";
    }

    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      if (isBrowser()) {
        showAlert("관리자 권한이 필요합니다.", { type: "error" });
      }
      return "/";
    }

    return true;
  });

  router.afterEach((to, _from, failure) => {
    if (failure || !isBrowser()) return;
    void nextTick(() => {
      trackPageView(to.fullPath, document.title);
    });
  });
}
