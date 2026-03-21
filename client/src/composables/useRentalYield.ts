import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { buildQuery, isSameQuery, parseQueryFloat, parseQueryInt } from "@/lib/routeState";
import {
  DEFAULT_RENTAL_YIELD_INPUT,
  sanitizeRentalYieldInput,
} from "@/lib/housingValidators";
import { calculateRentalYield } from "@/utils/housingCalculator";

export function useRentalYield(initialOverride?: Partial<import("@/utils/housingCalculator").RentalYieldInput>) {
  const route = useRoute();
  const router = useRouter();
  const form = ref({ ...DEFAULT_RENTAL_YIELD_INPUT });

  watch(
    () => route.query,
    (query) => {
      form.value = sanitizeRentalYieldInput({
        purchasePrice: parseQueryInt(query.price) ?? initialOverride?.purchasePrice ?? DEFAULT_RENTAL_YIELD_INPUT.purchasePrice,
        deposit: parseQueryInt(query.dep) ?? initialOverride?.deposit ?? DEFAULT_RENTAL_YIELD_INPUT.deposit,
        monthlyRent: parseQueryInt(query.rent) ?? initialOverride?.monthlyRent ?? DEFAULT_RENTAL_YIELD_INPUT.monthlyRent,
        loanAmount: parseQueryInt(query.loan) ?? initialOverride?.loanAmount ?? DEFAULT_RENTAL_YIELD_INPUT.loanAmount,
        loanRate: parseQueryFloat(query.rate) ?? initialOverride?.loanRate ?? DEFAULT_RENTAL_YIELD_INPUT.loanRate,
        monthlyExpense: parseQueryInt(query.exp) ?? initialOverride?.monthlyExpense ?? DEFAULT_RENTAL_YIELD_INPUT.monthlyExpense,
        vacancyRate: parseQueryFloat(query.vac) ?? initialOverride?.vacancyRate ?? DEFAULT_RENTAL_YIELD_INPUT.vacancyRate,
      });
    },
    { immediate: true },
  );

  const shareQuery = computed(() => buildQuery({
    price: form.value.purchasePrice !== DEFAULT_RENTAL_YIELD_INPUT.purchasePrice ? form.value.purchasePrice : null,
    dep: form.value.deposit !== DEFAULT_RENTAL_YIELD_INPUT.deposit ? form.value.deposit : null,
    rent: form.value.monthlyRent !== DEFAULT_RENTAL_YIELD_INPUT.monthlyRent ? form.value.monthlyRent : null,
    loan: form.value.loanAmount !== DEFAULT_RENTAL_YIELD_INPUT.loanAmount ? form.value.loanAmount : null,
    rate: form.value.loanRate !== DEFAULT_RENTAL_YIELD_INPUT.loanRate ? form.value.loanRate : null,
    exp: form.value.monthlyExpense !== DEFAULT_RENTAL_YIELD_INPUT.monthlyExpense ? form.value.monthlyExpense : null,
    vac: form.value.vacancyRate !== DEFAULT_RENTAL_YIELD_INPUT.vacancyRate ? form.value.vacancyRate : null,
  }));

  watch(form, () => {
    if (!isSameQuery(route.query, shareQuery.value)) {
      void router.replace({ query: shareQuery.value });
    }
  }, { deep: true });

  const result = computed(() => calculateRentalYield(form.value));

  return {
    form,
    result,
    shareQuery,
  };
}
