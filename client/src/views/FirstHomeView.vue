<script setup lang="ts">
import { computed, ref } from "vue";
import { ShCalculatorSplit } from "@shakilabs/ui";
import CalculatorPageHeader from "@/components/calculator/CalculatorPageHeader.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import FaqAccordionPanel from "@/components/common/FaqAccordionPanel.vue";
import SeoRichGuide from "@/components/common/SeoRichGuide.vue";
import { HOUSE_FIRST_HOME_GUIDE } from "@/data/seoGuides";
import CompareSourceFooter from "@/components/common/CompareSourceFooter.vue";
import FirstHomeCalculatorInput from "@/components/house/FirstHomeCalculatorInput.vue";
import FirstHomeCalculatorResult from "@/components/house/FirstHomeCalculatorResult.vue";
import FirstHomeCalculatorDetail from "@/components/house/FirstHomeCalculatorDetail.vue";
import PopularCalculators from "@/components/house/PopularCalculators.vue";
import { FIRST_HOME_FAQS, FIRST_HOME_SOURCES } from "@/data/firstHome";
import { mergeFaqs } from "@/lib/faqMerge";
import { DEFAULT_FIRST_HOME_INPUT, sanitizeFirstHomeInput } from "@/lib/housingValidators";
import { calculateFirstHomeBenefits } from "@/utils/housingCalculator";
import type { FirstHomeBenefitInput } from "@/utils/housingCalculator";

// 입력+결과 상태는 이 화면에서 소유한다(다른 계산기의 useXxx 합성 함수 패턴과 동일) —
// FirstHomeCalculatorInput/Result 두 컴포넌트가 형제로 나뉘어 있어 공통 부모가 들고 있어야 한다.
const form = ref<FirstHomeBenefitInput>({ ...DEFAULT_FIRST_HOME_INPUT });
const sanitized = computed(() => sanitizeFirstHomeInput(form.value));
const result = computed(() => calculateFirstHomeBenefits(sanitized.value));

// 화면에 실제 렌더되는 병합 FAQ와 구조화 데이터를 일치시킨다 (스키마 규칙)
const mergedFaqs = mergeFaqs(FIRST_HOME_FAQS, HOUSE_FIRST_HOME_GUIDE.faqs);

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: mergedFaqs.map((faq) => ({
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
  <div class="sh-container sh-container--tool space-y-5 py-5">
    <CalculatorPageHeader title="생애최초 주택 혜택 계산기" />

    <ShCalculatorSplit>
      <template #input>
        <section class="retro-panel overflow-hidden" aria-labelledby="first-home-input-title">
          <div class="retro-titlebar rounded-t-2xl">
            <h2 id="first-home-input-title" class="retro-title">주택 조건 입력</h2>
          </div>
          <div class="retro-panel-content space-y-4">
            <p class="text-caption leading-relaxed text-muted-foreground">
              취득세 감면과 디딤돌 기본 한도를 함께 보는 참고용 계산기입니다.
            </p>
            <FirstHomeCalculatorInput v-model="form" />
          </div>
        </section>
      </template>

      <template #result>
        <FirstHomeCalculatorResult :result="result" />
      </template>

      <template #below-input>
        <!-- 출처·기준 노트는 입력과 관련된 보조 블록(rule 2a) -->
        <CompareSourceFooter :sources="[...FIRST_HOME_SOURCES]" updated-at="2026-03-17" />
      </template>
    </ShCalculatorSplit>

    <!-- 결과 칸이 입력보다 300px 이상 길어져(rule 2) 상세 카드는 1×2 아래 전폭으로 내린다 -->
    <FirstHomeCalculatorDetail :result="result" />

    <PopularCalculators />


    <FaqAccordionPanel :items="mergedFaqs" />

    <SeoRichGuide
      :title="HOUSE_FIRST_HOME_GUIDE.title"
      :intro="HOUSE_FIRST_HOME_GUIDE.intro"
      :sections="HOUSE_FIRST_HOME_GUIDE.sections"
      :disclaimer="HOUSE_FIRST_HOME_GUIDE.disclaimer"
    />
  </div>
</template>
