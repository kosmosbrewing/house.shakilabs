import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { buildQuery, isSameQuery, parseQueryBoolean, parseQueryInt, queryFirst } from "@/lib/routeState";
import {
  DEFAULT_PROPERTY_TAX_INPUT,
  sanitizePropertyTaxInput,
} from "@/lib/housingValidators";
import { calculatePropertyTax } from "@/utils/housingCalculator";

export function usePropertyTax() {
  const route = useRoute();
  const router = useRouter();
  const form = ref({ ...DEFAULT_PROPERTY_TAX_INPUT });

  watch(
    () => route.query,
    (query) => {
      form.value = sanitizePropertyTaxInput({
        marketPrice: parseQueryInt(query.price) ?? DEFAULT_PROPERTY_TAX_INPUT.marketPrice,
        isUrbanArea: parseQueryBoolean(query.urban, DEFAULT_PROPERTY_TAX_INPUT.isUrbanArea),
        ownerAge: parseQueryInt(query.age) ?? DEFAULT_PROPERTY_TAX_INPUT.ownerAge,
        holdingYears: parseQueryInt(query.years) ?? DEFAULT_PROPERTY_TAX_INPUT.holdingYears,
        housingType: queryFirst(query.type) ?? DEFAULT_PROPERTY_TAX_INPUT.housingType,
      });
    },
    { immediate: true }
  );

  const shareQuery = computed(() => buildQuery({
    price: form.value.marketPrice !== DEFAULT_PROPERTY_TAX_INPUT.marketPrice ? form.value.marketPrice : null,
    urban: form.value.isUrbanArea !== DEFAULT_PROPERTY_TAX_INPUT.isUrbanArea ? form.value.isUrbanArea : null,
    age: form.value.ownerAge !== DEFAULT_PROPERTY_TAX_INPUT.ownerAge ? form.value.ownerAge : null,
    years: form.value.holdingYears !== DEFAULT_PROPERTY_TAX_INPUT.holdingYears ? form.value.holdingYears : null,
    type: form.value.housingType !== DEFAULT_PROPERTY_TAX_INPUT.housingType ? form.value.housingType : null,
  }));

  watch(form, () => {
    if (!isSameQuery(route.query, shareQuery.value)) {
      void router.replace({ query: shareQuery.value });
    }
  }, { deep: true });

  const result = computed(() => calculatePropertyTax(form.value));

  return {
    form,
    result,
    shareQuery,
  };
}
