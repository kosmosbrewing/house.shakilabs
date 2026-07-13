<script setup lang="ts">
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";

defineProps<{
  faqs: ReadonlyArray<{ q: string; a: string }>;
}>();
</script>

<template>
  <FaqAccordionPanel title="중개보수 체크포인트" :items="faqs" />
</template>
