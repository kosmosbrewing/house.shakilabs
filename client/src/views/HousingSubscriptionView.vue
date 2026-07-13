<script setup lang="ts">
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";
import HousingSubscriptionCalculator from "@/components/house/HousingSubscriptionCalculator.vue";
import { HOUSING_SUBSCRIPTION_FAQS } from "@/data/housingSubscription";

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
    <CalculatorPageHeader title="청약 가점 계산기" />

    <section class="retro-panel overflow-hidden" aria-labelledby="housing-subscription-input-title">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 id="housing-subscription-input-title" class="retro-title">청약 조건 입력</h2>
      </div>
      <div class="retro-panel-content space-y-4">
        <p class="text-caption leading-relaxed text-muted-foreground">
          핵심 3개 항목만 빠르게 합산하는 민영주택 청약 가점 계산기입니다.
        </p>
        <HousingSubscriptionCalculator />
      </div>
    </section>

    <FaqAccordionPanel :items="HOUSING_SUBSCRIPTION_FAQS" />
  </div>
</template>
