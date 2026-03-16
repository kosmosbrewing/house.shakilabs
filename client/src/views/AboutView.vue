<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";
import { RouterLink } from "vue-router";
import { buttonVariants } from "@/components/ui/button";
import { useConstantsStore } from "@/stores/constants";

const constantsStore = useConstantsStore();
</script>

<template>
  <SEOHead
    title="서비스 안내"
    description="house.shakilabs.com은 주거 관련 핵심 계산을 빠르게 확인하는 무료 도구입니다."
  />

  <div class="container py-5 space-y-5">
    <div class="retro-panel">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">서비스 안내</h1>
      </div>

      <div class="retro-panel-content space-y-4">
        <h2 class="text-heading font-bold">house.shakilabs.com 소개</h2>
        <p class="text-body text-muted-foreground">
          house.shakilabs.com은 임차·매매 의사결정에서 자주 필요한 금액 계산을 빠르게 제공하는 무료 도구입니다.
          로그인 없이 바로 계산할 수 있고, 현재 입력값을 URL로 공유할 수 있습니다.
        </p>

        <h2 class="text-heading font-bold">주요 기능</h2>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>보증금 반환 지연이자 계산</li>
          <li>전세 vs 월세 손익분기 비교</li>
          <li>주택 중개보수 상한 계산</li>
          <li>카카오톡 공유, URL 파라미터 공유 지원</li>
        </ul>

        <h2 class="text-heading font-bold">데이터 기준</h2>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>법령·조례 확인일: {{ constantsStore.feeDataUpdated }}</li>
          <li>보증금 지연이자는 소송촉진 등에 관한 특례법상 연 12% 가정</li>
          <li>중개보수는 서울시 주택 중개보수 표 기준</li>
        </ul>
        <p class="text-body text-muted-foreground">
          전세 vs 월세 비교는 사용자가 입력한 기회비용 금리에 따라 결과가 달라집니다.
          실제 계약·소송 금액은 전문가 확인을 권장합니다.
        </p>

        <h2 class="text-heading font-bold">문의</h2>
        <p class="text-body text-muted-foreground">
          오류 제보나 기능 건의는
          <a :href="`mailto:${constantsStore.supportEmail}`" class="retro-link">{{ constantsStore.supportEmail }}</a>으로
          보내주세요.
        </p>
      </div>
    </div>

    <div class="text-center">
      <RouterLink :class="buttonVariants({ variant: 'default' })" to="/">
        홈으로 돌아가기
      </RouterLink>
    </div>
  </div>
</template>
