<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";
import { RouterLink } from "vue-router";
import { buttonVariants } from "@/components/ui/button";
</script>

<template>
  <SEOHead
    title="주거 계산기"
    description="보증금 반환 지연이자, 전세 vs 월세, 주택 중개보수를 한 번에 계산하는 house.shakilabs.com입니다."
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
      </div>
    </div>
  </div>
</template>
