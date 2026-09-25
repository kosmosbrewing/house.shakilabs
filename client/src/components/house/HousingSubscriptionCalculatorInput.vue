<script setup lang="ts">
import type { HousingSubscriptionInput } from "@/utils/housingCalculator";

const form = defineModel<HousingSubscriptionInput>({ required: true });
</script>

<template>
  <section class="retro-panel-muted space-y-4 p-4">
    <div class="grid gap-4 md:grid-cols-3">
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">무주택기간(년)</span>
        <input v-model.number="form.homelessYears" class="retro-input" min="0" max="30" step="1" type="number" />
      </label>
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">부양가족 수</span>
        <input v-model.number="form.dependents" class="retro-input" min="0" max="6" step="1" type="number" />
      </label>
      <label class="space-y-1.5">
        <span class="text-caption font-semibold text-foreground">통장 가입기간(년)</span>
        <input v-model.number="form.accountYears" class="retro-input" min="0" max="30" step="0.5" type="number" />
      </label>
    </div>
  </section>
</template>
