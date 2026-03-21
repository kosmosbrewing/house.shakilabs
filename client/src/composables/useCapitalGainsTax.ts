import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { buildQuery, isSameQuery, parseQueryBoolean, parseQueryFloat, parseQueryInt } from "@/lib/routeState";
import {
  DEFAULT_CAPITAL_GAINS_TAX_INPUT,
  sanitizeCapitalGainsTaxInput,
} from "@/lib/housingValidators";
import { calculateCapitalGainsTax } from "@/utils/housingCalculator";

export function useCapitalGainsTax(initialOverride?: Partial<import("@/utils/housingCalculator").CapitalGainsTaxInput>) {
  const route = useRoute();
  const router = useRouter();
  const form = ref({ ...DEFAULT_CAPITAL_GAINS_TAX_INPUT });

  watch(
    () => route.query,
    (query) => {
      form.value = sanitizeCapitalGainsTaxInput({
        sellPrice: parseQueryInt(query.sell) ?? initialOverride?.sellPrice ?? DEFAULT_CAPITAL_GAINS_TAX_INPUT.sellPrice,
        buyPrice: parseQueryInt(query.buy) ?? initialOverride?.buyPrice ?? DEFAULT_CAPITAL_GAINS_TAX_INPUT.buyPrice,
        expenseRate: parseQueryFloat(query.expense) ?? initialOverride?.expenseRate ?? DEFAULT_CAPITAL_GAINS_TAX_INPUT.expenseRate,
        holdingYears: parseQueryInt(query.hold) ?? initialOverride?.holdingYears ?? DEFAULT_CAPITAL_GAINS_TAX_INPUT.holdingYears,
        residenceYears: parseQueryInt(query.reside) ?? initialOverride?.residenceYears ?? DEFAULT_CAPITAL_GAINS_TAX_INPUT.residenceYears,
        isOneHousehold: parseQueryBoolean(query.one, initialOverride?.isOneHousehold ?? DEFAULT_CAPITAL_GAINS_TAX_INPUT.isOneHousehold),
        isRegulatedArea: parseQueryBoolean(query.regulated, initialOverride?.isRegulatedArea ?? DEFAULT_CAPITAL_GAINS_TAX_INPUT.isRegulatedArea),
      });
    },
    { immediate: true }
  );

  const shareQuery = computed(() => buildQuery({
    sell: form.value.sellPrice !== DEFAULT_CAPITAL_GAINS_TAX_INPUT.sellPrice ? form.value.sellPrice : null,
    buy: form.value.buyPrice !== DEFAULT_CAPITAL_GAINS_TAX_INPUT.buyPrice ? form.value.buyPrice : null,
    expense: form.value.expenseRate !== DEFAULT_CAPITAL_GAINS_TAX_INPUT.expenseRate ? form.value.expenseRate : null,
    hold: form.value.holdingYears !== DEFAULT_CAPITAL_GAINS_TAX_INPUT.holdingYears ? form.value.holdingYears : null,
    reside: form.value.residenceYears !== DEFAULT_CAPITAL_GAINS_TAX_INPUT.residenceYears ? form.value.residenceYears : null,
    one: form.value.isOneHousehold !== DEFAULT_CAPITAL_GAINS_TAX_INPUT.isOneHousehold ? form.value.isOneHousehold : null,
    regulated: form.value.isRegulatedArea !== DEFAULT_CAPITAL_GAINS_TAX_INPUT.isRegulatedArea ? form.value.isRegulatedArea : null,
  }));

  watch(form, () => {
    if (!isSameQuery(route.query, shareQuery.value)) {
      void router.replace({ query: shareQuery.value });
    }
  }, { deep: true });

  const result = computed(() => calculateCapitalGainsTax(form.value));

  return {
    form,
    result,
    shareQuery,
  };
}
