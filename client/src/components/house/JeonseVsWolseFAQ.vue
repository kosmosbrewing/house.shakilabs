<script setup lang="ts">
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";

defineProps<{
  faqs: ReadonlyArray<{ q: string; a: string }>;
}>();
</script>

<template>
  <FaqAccordionPanel title="비교 팁" :items="faqs" />
</template>
