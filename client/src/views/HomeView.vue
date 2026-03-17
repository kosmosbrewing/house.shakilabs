<script setup lang="ts">
import RelatedServices from "@/components/common/RelatedServices.vue";
import SEOHead from "@/components/common/SEOHead.vue";
import { RouterLink } from "vue-router";
import { buttonVariants } from "@/components/ui/button";

const faqItems = [
  {
    q: "house.shakilabs.com에서는 어떤 계산을 할 수 있나요?",
    a: "보증금 반환 지연이자, 전세 vs 월세, 주택 중개보수, 생애최초 혜택, 청약가점까지 한 번에 확인할 수 있습니다.",
  },
  {
    q: "보증금 반환 지연이자는 언제 사용하면 되나요?",
    a: "임대인이 보증금을 제때 돌려주지 않아 예상 지연이자 규모를 먼저 가늠하고 싶을 때 참고용으로 사용할 수 있습니다.",
  },
  {
    q: "전세와 월세 비교는 어떤 기준으로 계산하나요?",
    a: "보증금의 기회비용과 월세 지출을 함께 반영해 손익분기 월세를 계산하는 방식입니다.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};
</script>

<template>
  <SEOHead
    title="주거 계산기"
    description="보증금 반환 지연이자, 전세 vs 월세, 주택 중개보수를 한 번에 계산하는 house.shakilabs.com입니다."
    :json-ld="faqJsonLd"
  />

  <div class="container py-5 space-y-5">
    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">주거 계산기 홈</h1>
      </div>
      <div class="retro-panel-content space-y-4">
        <p class="text-body leading-relaxed text-muted-foreground">
          주거 의사결정에서 자주 필요한 세 가지 계산을 한 번에 제공합니다. 각 계산기는 기본값이 바로 들어 있어
          모바일에서도 즉시 결과를 볼 수 있습니다.
        </p>
        <div class="grid gap-3 md:grid-cols-3">
          <RouterLink class="retro-panel-muted p-4 hover:border-primary/60" to="/delay-interest">
            <p class="text-heading font-bold">보증금 반환 지연이자</p>
            <p class="mt-2 text-caption leading-relaxed text-muted-foreground">
              연 12% 가정 기준의 예상 지연이자를 빠르게 확인합니다.
            </p>
          </RouterLink>
          <RouterLink class="retro-panel-muted p-4 hover:border-primary/60" to="/jeonse-vs-wolse">
            <p class="text-heading font-bold">전세 vs 월세</p>
            <p class="mt-2 text-caption leading-relaxed text-muted-foreground">
              보증금 기회비용을 반영해 손익분기 월세를 계산합니다.
            </p>
          </RouterLink>
          <RouterLink class="retro-panel-muted p-4 hover:border-primary/60" to="/brokerage-fee">
            <p class="text-heading font-bold">주택 중개보수</p>
            <p class="mt-2 text-caption leading-relaxed text-muted-foreground">
              매매·전세·월세의 상한요율과 최대 보수를 계산합니다.
            </p>
          </RouterLink>
          <RouterLink class="retro-panel-muted p-4 hover:border-primary/60" to="/first-home">
            <p class="text-heading font-bold">생애최초 혜택</p>
            <p class="mt-2 text-caption leading-relaxed text-muted-foreground">
              취득세 감면과 디딤돌 한도를 동시에 체크합니다.
            </p>
          </RouterLink>
          <RouterLink class="retro-panel-muted p-4 hover:border-primary/60" to="/housing-subscription">
            <p class="text-heading font-bold">청약 가점</p>
            <p class="mt-2 text-caption leading-relaxed text-muted-foreground">
              무주택기간, 부양가족, 가입기간 점수를 합산합니다.
            </p>
          </RouterLink>
        </div>
      </div>
    </div>

    <div class="retro-panel">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">바로 시작하기</h2>
      </div>
      <div class="retro-panel-content flex flex-wrap gap-2">
        <RouterLink :class="buttonVariants({ variant: 'default' })" to="/delay-interest">
          지연이자 계산
        </RouterLink>
        <RouterLink :class="buttonVariants({ variant: 'outline' })" to="/jeonse-vs-wolse">
          전세 vs 월세
        </RouterLink>
        <RouterLink :class="buttonVariants({ variant: 'outline' })" to="/brokerage-fee">
          중개보수 계산
        </RouterLink>
        <RouterLink :class="buttonVariants({ variant: 'outline' })" to="/first-home">
          생애최초 계산
        </RouterLink>
        <RouterLink :class="buttonVariants({ variant: 'outline' })" to="/housing-subscription">
          청약가점 계산
        </RouterLink>
      </div>
    </div>

    <div class="retro-panel overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <h2 class="retro-title">자주 묻는 질문</h2>
      </div>
      <div class="retro-panel-content space-y-3">
        <details
          v-for="faq in faqItems"
          :key="faq.q"
          class="retro-panel-muted p-4"
        >
          <summary class="cursor-pointer list-none text-body font-semibold text-foreground">
            {{ faq.q }}
          </summary>
          <p class="mt-2 text-caption leading-relaxed text-muted-foreground">
            {{ faq.a }}
          </p>
        </details>
      </div>
    </div>

    <RelatedServices />
  </div>
</template>
