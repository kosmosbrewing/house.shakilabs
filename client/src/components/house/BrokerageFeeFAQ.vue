<script setup lang="ts">
defineProps<{
  faqs: ReadonlyArray<{ q: string; a: string }>;
}>();
</script>

<template>
  <div class="retro-panel overflow-hidden">
    <div class="retro-titlebar rounded-t-2xl">
      <h2 class="retro-title">중개보수 체크포인트</h2>
    </div>
    <div class="retro-panel-content space-y-3">
      <details v-for="faq in faqs" :key="faq.q" class="retro-details">
        <summary class="retro-details-summary">
          <span>{{ faq.q }}</span>
          <span class="retro-details-chevron">▾</span>
        </summary>
        <div class="px-3 py-3 text-body leading-relaxed text-muted-foreground">
          {{ faq.a }}
        </div>
      </details>
    </div>
  </div>
</template>
