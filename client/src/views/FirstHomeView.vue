<script setup lang="ts">
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";
import FirstHomeCalculator from "@/components/house/FirstHomeCalculator.vue";
import { FIRST_HOME_FAQS } from "@/data/firstHome";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FIRST_HOME_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};
</script>

<template>
  <SEOHead
    title="생애최초 주택 혜택 계산기"
    description="취득세 감면과 디딤돌 대출 한도를 기준으로 생애최초 주택 구입 혜택을 빠르게 계산합니다."
    :json-ld="faqJsonLd"
  />
  <div class="container space-y-5 py-5">
    <CalculatorPageHeader title="생애최초 주택 혜택 계산기" />

    <section class="retro-panel overflow-hidden" aria-labelledby="first-home-input-title">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 id="first-home-input-title" class="retro-title">주택 조건 입력</h2>
      </div>
      <div class="retro-panel-content space-y-4">
        <p class="text-caption leading-relaxed text-muted-foreground">
          취득세 감면과 디딤돌 기본 한도를 함께 보는 참고용 계산기입니다.
        </p>
        <FirstHomeCalculator />
      </div>
    </section>

    <FaqAccordionPanel :items="FIRST_HOME_FAQS" />
  </div>
</template>
