import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { buildQuery, isSameQuery, parseQueryFloat, parseQueryInt } from "@/lib/routeState";
import {
  DEFAULT_JEONSE_WOLSE_INPUT,
  sanitizeJeonseVsWolseInput,
} from "@/lib/housingValidators";
import { calculateJeonseVsWolse } from "@/utils/housingCalculator";

export function useJeonseVsWolse(initialOverride?: Partial<import("@/utils/housingCalculator").JeonseVsWolseInput>) {
  const route = useRoute();
  const router = useRouter();
  const form = ref(DEFAULT_JEONSE_WOLSE_INPUT);

  watch(
    () => route.query,
    (query) => {
      form.value = sanitizeJeonseVsWolseInput({
        jeonseDeposit: parseQueryInt(query.jeonse) ?? initialOverride?.jeonseDeposit ?? DEFAULT_JEONSE_WOLSE_INPUT.jeonseDeposit,
        wolseDeposit: parseQueryInt(query.deposit) ?? initialOverride?.wolseDeposit ?? DEFAULT_JEONSE_WOLSE_INPUT.wolseDeposit,
        monthlyRent: parseQueryInt(query.rent) ?? initialOverride?.monthlyRent ?? DEFAULT_JEONSE_WOLSE_INPUT.monthlyRent,
        annualOpportunityRate: parseQueryFloat(query.rate) ?? initialOverride?.annualOpportunityRate ?? DEFAULT_JEONSE_WOLSE_INPUT.annualOpportunityRate,
        analysisYears: parseQueryInt(query.years) ?? initialOverride?.analysisYears ?? DEFAULT_JEONSE_WOLSE_INPUT.analysisYears,
      });
    },
    { immediate: true }
  );

  const shareQuery = computed(() => buildQuery({
    jeonse: form.value.jeonseDeposit !== DEFAULT_JEONSE_WOLSE_INPUT.jeonseDeposit ? form.value.jeonseDeposit : null,
    deposit: form.value.wolseDeposit !== DEFAULT_JEONSE_WOLSE_INPUT.wolseDeposit ? form.value.wolseDeposit : null,
    rent: form.value.monthlyRent !== DEFAULT_JEONSE_WOLSE_INPUT.monthlyRent ? form.value.monthlyRent : null,
    rate: form.value.annualOpportunityRate !== DEFAULT_JEONSE_WOLSE_INPUT.annualOpportunityRate
      ? form.value.annualOpportunityRate.toFixed(4)
      : null,
    years: form.value.analysisYears !== DEFAULT_JEONSE_WOLSE_INPUT.analysisYears ? form.value.analysisYears : null,
  }));

  watch(form, () => {
    if (!isSameQuery(route.query, shareQuery.value)) {
      void router.replace({ query: shareQuery.value });
    }
  }, { deep: true });

  const result = computed(() => calculateJeonseVsWolse(form.value));

  return {
    form,
    result,
    shareQuery,
  };
}
