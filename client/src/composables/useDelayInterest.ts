import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { buildQuery, isSameQuery, parseQueryFloat, parseQueryInt } from "@/lib/routeState";
import {
  DEFAULT_DELAY_INTEREST_INPUT,
  sanitizeDelayInterestInput,
} from "@/lib/housingValidators";
import { calculateDelayInterest } from "@/utils/housingCalculator";

export function useDelayInterest(initialOverride?: Partial<import("@/utils/housingCalculator").DelayInterestInput>) {
  const route = useRoute();
  const router = useRouter();
  const form = ref(DEFAULT_DELAY_INTEREST_INPUT);

  watch(
    () => route.query,
    (query) => {
      form.value = sanitizeDelayInterestInput({
        depositAmount: parseQueryInt(query.deposit) ?? initialOverride?.depositAmount ?? DEFAULT_DELAY_INTEREST_INPUT.depositAmount,
        overdueDays: parseQueryInt(query.days) ?? initialOverride?.overdueDays ?? DEFAULT_DELAY_INTEREST_INPUT.overdueDays,
        annualRate: parseQueryFloat(query.rate) ?? initialOverride?.annualRate ?? DEFAULT_DELAY_INTEREST_INPUT.annualRate,
      });
    },
    { immediate: true }
  );

  const shareQuery = computed(() => buildQuery({
    deposit: form.value.depositAmount !== DEFAULT_DELAY_INTEREST_INPUT.depositAmount ? form.value.depositAmount : null,
    days: form.value.overdueDays !== DEFAULT_DELAY_INTEREST_INPUT.overdueDays ? form.value.overdueDays : null,
    rate: form.value.annualRate !== DEFAULT_DELAY_INTEREST_INPUT.annualRate ? form.value.annualRate.toFixed(4) : null,
  }));

  watch(form, () => {
    if (!isSameQuery(route.query, shareQuery.value)) {
      void router.replace({ query: shareQuery.value });
    }
  }, { deep: true });

  const result = computed(() => calculateDelayInterest(form.value));

  return {
    form,
    result,
    shareQuery,
  };
}
