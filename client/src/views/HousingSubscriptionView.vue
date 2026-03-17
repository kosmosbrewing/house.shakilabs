<script setup lang="ts">
import FreshBadge from "@/components/common/FreshBadge.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import HousingSubscriptionCalculator from "@/components/house/HousingSubscriptionCalculator.vue";
import {
  HOUSING_SUBSCRIPTION_FAQS,
  HOUSING_SUBSCRIPTION_UPDATED,
} from "@/data/housingSubscription";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOUSING_SUBSCRIPTION_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};
</script>

<template>
  <SEOHead
    title="청약 가점 계산기"
    description="무주택기간, 부양가족수, 청약통장 가입기간을 합산해 민영주택 청약 가점을 빠르게 계산합니다."
    :json-ld="faqJsonLd"
  />
  <div class="container space-y-5 py-5">
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">청약 가점 계산기</h1>
        <FreshBadge :message="`${HOUSING_SUBSCRIPTION_UPDATED} 확인`" />
      </div>
      <div class="retro-panel-content space-y-4">
        <p class="text-caption leading-relaxed text-muted-foreground">
          핵심 3개 항목만 빠르게 합산하는 민영주택 청약 가점 계산기입니다.
        </p>
        <HousingSubscriptionCalculator />
      </div>
    </div>

    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">자주 묻는 질문</h2>
      </div>
      <div class="retro-panel-content space-y-3">
        <details v-for="faq in HOUSING_SUBSCRIPTION_FAQS" :key="faq.q" class="retro-panel-muted p-4">
          <summary class="cursor-pointer list-none text-body font-semibold text-foreground">{{ faq.q }}</summary>
          <p class="mt-2 text-caption leading-relaxed text-muted-foreground">{{ faq.a }}</p>
        </details>
      </div>
    </div>
  </div>
</template>
