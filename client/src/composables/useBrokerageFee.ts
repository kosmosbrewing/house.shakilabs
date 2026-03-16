import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { buildQuery, isSameQuery, parseQueryInt, queryFirst } from "@/lib/routeState";
import {
  DEFAULT_BROKERAGE_FEE_INPUT,
  sanitizeBrokerageFeeInput,
} from "@/lib/housingValidators";
import { calculateBrokerageFee } from "@/utils/housingCalculator";

export function useBrokerageFee() {
  const route = useRoute();
  const router = useRouter();
  const form = ref(DEFAULT_BROKERAGE_FEE_INPUT);

  watch(
    () => route.query,
    (query) => {
      form.value = sanitizeBrokerageFeeInput({
        dealType: queryFirst(query.type) ?? DEFAULT_BROKERAGE_FEE_INPUT.dealType,
        amount: parseQueryInt(query.amount) ?? DEFAULT_BROKERAGE_FEE_INPUT.amount,
        monthlyRent: parseQueryInt(query.rent) ?? DEFAULT_BROKERAGE_FEE_INPUT.monthlyRent,
      });
    },
    { immediate: true }
  );

  const shareQuery = computed(() => buildQuery({
    type: form.value.dealType !== DEFAULT_BROKERAGE_FEE_INPUT.dealType ? form.value.dealType : null,
    amount: form.value.amount !== DEFAULT_BROKERAGE_FEE_INPUT.amount ? form.value.amount : null,
    rent: form.value.monthlyRent !== DEFAULT_BROKERAGE_FEE_INPUT.monthlyRent ? form.value.monthlyRent : null,
  }));

  watch(form, () => {
    if (!isSameQuery(route.query, shareQuery.value)) {
      void router.replace({ query: shareQuery.value });
    }
  }, { deep: true });

  const result = computed(() => calculateBrokerageFee(form.value));

  return {
    form,
    result,
    shareQuery,
  };
}
