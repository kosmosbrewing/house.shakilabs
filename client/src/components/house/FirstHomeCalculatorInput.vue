<script setup lang="ts">
import { parseNumericInput } from "@/lib/utils";
import type { FirstHomeBenefitInput } from "@/utils/housingCalculator";

const form = defineModel<FirstHomeBenefitInput>({ required: true });
</script>

<template>
  <section class="retro-panel-muted space-y-4 p-4">
    <div class="grid gap-3 md:grid-cols-2">
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">주택 매수가</span>
        <input type="text" inputmode="numeric" class="retro-input" :value="form.homePrice.toLocaleString('ko-KR')" @input="form.homePrice = parseNumericInput(($event.target as HTMLInputElement).value)" />
      </label>
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">부부합산 연소득</span>
        <input type="text" inputmode="numeric" class="retro-input" :value="form.annualIncome.toLocaleString('ko-KR')" @input="form.annualIncome = parseNumericInput(($event.target as HTMLInputElement).value)" />
      </label>
    </div>

    <div class="grid gap-3 md:grid-cols-3">
      <label class="retro-panel flex items-center gap-2 px-3 py-3">
        <input v-model="form.isFirstHomeBuyer" class="retro-checkbox" type="checkbox" />
        <span class="text-caption font-semibold">생애최초 구입</span>
      </label>
      <label class="retro-panel flex items-center gap-2 px-3 py-3">
        <input v-model="form.isRegulatedArea" class="retro-checkbox" type="checkbox" />
        <span class="text-caption font-semibold">수도권·규제지역</span>
      </label>
      <label class="retro-panel flex items-center gap-2 px-3 py-3">
        <input v-model="form.isNewlywedOrMultiChild" class="retro-checkbox" type="checkbox" />
        <span class="text-caption font-semibold">신혼·2자녀 이상</span>
      </label>
    </div>
  </section>
</template>
