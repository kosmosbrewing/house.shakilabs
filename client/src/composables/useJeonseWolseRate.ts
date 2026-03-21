import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { buildQuery, isSameQuery, parseQueryInt, parseQueryFloat } from "@/lib/routeState";
import {
  DEFAULT_JEONSE_WOLSE_RATE_INPUT,
  sanitizeJeonseWolseRateInput,
} from "@/lib/housingValidators";
import { calculateJeonseWolseRate } from "@/utils/housingCalculator";
import type { JeonseWolseRateInput } from "@/utils/housingCalculator";

export function useJeonseWolseRate(initialOverride?: Partial<JeonseWolseRateInput>) {
  const route = useRoute();
  const router = useRouter();
  const form = ref({ ...DEFAULT_JEONSE_WOLSE_RATE_INPUT });

  watch(
    () => route.query,
    (query) => {
      form.value = sanitizeJeonseWolseRateInput({
        jeonseDeposit: parseQueryInt(query.jeonse) ?? initialOverride?.jeonseDeposit ?? DEFAULT_JEONSE_WOLSE_RATE_INPUT.jeonseDeposit,
        wolseDeposit: parseQueryInt(query.deposit) ?? initialOverride?.wolseDeposit ?? DEFAULT_JEONSE_WOLSE_RATE_INPUT.wolseDeposit,
        monthlyRent: parseQueryInt(query.rent) ?? initialOverride?.monthlyRent ?? DEFAULT_JEONSE_WOLSE_RATE_INPUT.monthlyRent,
        legalRateCap: parseQueryFloat(query.cap) ?? initialOverride?.legalRateCap ?? DEFAULT_JEONSE_WOLSE_RATE_INPUT.legalRateCap,
      });
    },
    { immediate: true },
  );

  const shareQuery = computed(() => buildQuery({
    jeonse: form.value.jeonseDeposit !== DEFAULT_JEONSE_WOLSE_RATE_INPUT.jeonseDeposit ? form.value.jeonseDeposit : null,
    deposit: form.value.wolseDeposit !== DEFAULT_JEONSE_WOLSE_RATE_INPUT.wolseDeposit ? form.value.wolseDeposit : null,
    rent: form.value.monthlyRent !== DEFAULT_JEONSE_WOLSE_RATE_INPUT.monthlyRent ? form.value.monthlyRent : null,
    cap: form.value.legalRateCap !== DEFAULT_JEONSE_WOLSE_RATE_INPUT.legalRateCap
      ? form.value.legalRateCap.toFixed(4)
      : null,
  }));

  watch(form, () => {
    if (!isSameQuery(route.query, shareQuery.value)) {
      void router.replace({ query: shareQuery.value });
    }
  }, { deep: true });

  const result = computed(() => calculateJeonseWolseRate(form.value));

  return {
    form,
    result,
    shareQuery,
  };
}
