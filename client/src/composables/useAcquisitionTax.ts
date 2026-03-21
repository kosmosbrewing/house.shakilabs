import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { buildQuery, isSameQuery, parseQueryBoolean, parseQueryFloat, parseQueryInt } from "@/lib/routeState";
import {
  DEFAULT_ACQUISITION_TAX_INPUT,
  sanitizeAcquisitionTaxInput,
} from "@/lib/housingValidators";
import { calculateAcquisitionTax } from "@/utils/housingCalculator";

export function useAcquisitionTax(initialOverride?: Partial<import("@/utils/housingCalculator").AcquisitionTaxInput>) {
  const route = useRoute();
  const router = useRouter();
  const form = ref({ ...DEFAULT_ACQUISITION_TAX_INPUT });

  watch(
    () => route.query,
    (query) => {
      form.value = sanitizeAcquisitionTaxInput({
        purchasePrice: parseQueryInt(query.price) ?? initialOverride?.purchasePrice ?? DEFAULT_ACQUISITION_TAX_INPUT.purchasePrice,
        homeCount: parseQueryInt(query.homes) ?? initialOverride?.homeCount ?? DEFAULT_ACQUISITION_TAX_INPUT.homeCount,
        isRegulatedArea: parseQueryBoolean(query.regulated, initialOverride?.isRegulatedArea ?? DEFAULT_ACQUISITION_TAX_INPUT.isRegulatedArea),
        exclusiveArea: parseQueryFloat(query.area) ?? initialOverride?.exclusiveArea ?? DEFAULT_ACQUISITION_TAX_INPUT.exclusiveArea,
      });
    },
    { immediate: true }
  );

  const shareQuery = computed(() => buildQuery({
    price: form.value.purchasePrice !== DEFAULT_ACQUISITION_TAX_INPUT.purchasePrice ? form.value.purchasePrice : null,
    homes: form.value.homeCount !== DEFAULT_ACQUISITION_TAX_INPUT.homeCount ? form.value.homeCount : null,
    regulated: form.value.isRegulatedArea !== DEFAULT_ACQUISITION_TAX_INPUT.isRegulatedArea ? form.value.isRegulatedArea : null,
    area: form.value.exclusiveArea !== DEFAULT_ACQUISITION_TAX_INPUT.exclusiveArea ? form.value.exclusiveArea : null,
  }));

  watch(form, () => {
    if (!isSameQuery(route.query, shareQuery.value)) {
      void router.replace({ query: shareQuery.value });
    }
  }, { deep: true });

  const result = computed(() => calculateAcquisitionTax(form.value));

  return {
    form,
    result,
    shareQuery,
  };
}
