<script setup lang="ts">
import type { Component } from "vue";
import { RouterLink } from "vue-router";
import { Clock, Scale, Landmark, ShieldCheck, Award, Building2, ArrowRight, Repeat } from "lucide-vue-next";
import { ShSurface, ShText } from "@shakilabs/ui";
import { ActionCard } from "@/components/ui/action-card";
import RelatedServices from "@/components/common/RelatedServices.vue";
import SEOHead from "@/components/common/SEOHead.vue";

type ToolItem = {
  title: string;
  desc: string;
  to: string;
  icon: Component;
};

const tools: ToolItem[] = [
  {
    title: "보증금 반환 지연이자",
    desc: "약정 이율, 민법상 5%, 소장 등 송달 이후 12%를 구분해 계산합니다.",
    to: "/delay-interest",
    icon: Clock,
  },
  {
    title: "재산세·보유세",
    desc: "시세 기준으로 재산세와 종부세를 시뮬레이션합니다.",
    to: "/property-tax",
    icon: Building2,
  },
  {
    title: "전월세 전환율",
    desc: "법정 상한 전환율 대비 적정 월세를 판정합니다.",
    to: "/jeonse-wolse-rate",
    icon: Repeat,
  },
  {
    title: "전세 vs 월세",
    desc: "보증금 기회비용을 반영해 손익분기 월세를 계산합니다.",
    to: "/jeonse-vs-wolse",
    icon: Scale,
  },
  {
    title: "주택 중개보수",
    desc: "매매·전세·월세의 상한요율과 최대 보수를 계산합니다.",
    to: "/brokerage-fee",
    icon: Landmark,
  },
  {
    title: "주택 취득세",
    desc: "매매가와 보유 주택 수를 반영해 취득세를 추정합니다.",
    to: "/acquisition-tax",
    icon: Landmark,
  },
  {
    title: "양도소득세",
    desc: "취득가와 양도가를 기준으로 예상 양도세를 계산합니다.",
    to: "/capital-gains-tax",
    icon: Building2,
  },
  {
    title: "임대수익률",
    desc: "매입가와 임대 조건을 반영해 연 수익률을 계산합니다.",
    to: "/rental-yield",
    icon: Scale,
  },
  {
    title: "생애최초 혜택",
    desc: "취득세 감면과 디딤돌 한도를 동시에 체크합니다.",
    to: "/first-home",
    icon: ShieldCheck,
  },
  {
    title: "청약 가점",
    desc: "무주택기간, 부양가족, 가입기간 점수를 합산합니다.",
    to: "/housing-subscription",
    icon: Award,
  },
];
</script>

<template>
  <SEOHead
    title="주거 계산기"
    description="보증금 반환 지연이자, 재산세·보유세, 전월세 전환율 등 주거·부동산 계산기 10개를 한곳에서 제공합니다."
  />

  <div class="sh-container sh-container--page py-5 space-y-5">
    <ShSurface padding="none" class="overflow-hidden">
      <div class="retro-titlebar rounded-t-2xl">
        <ShText as="h1" variant="display">주거 계산기</ShText>
      </div>
      <div class="retro-panel-content space-y-4">
        <!-- 허브 도입은 한 문장. 허브 FAQ 8문항·"종합 가이드" 5절은 2026-11 UI 감사에서 뺐다(GA4 28일 허브 조회 2). -->
        <p class="text-body leading-relaxed text-muted-foreground">
          보증금 지연이자·전월세 전환율·취득세·양도세 등 주거 계산기 10개. 기본값이 들어 있어 바로 결과가 보입니다.
        </p>
        <div class="grid gap-3 md:grid-cols-3">
          <ActionCard
            v-for="tool in tools"
            :key="tool.to"
            as-child
          >
            <RouterLink :to="tool.to">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-heading font-bold text-foreground">{{ tool.title }}</p>
                  <p class="mt-2 text-caption leading-relaxed text-muted-foreground">{{ tool.desc }}</p>
                </div>
                <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/[12%] text-primary">
                  <component :is="tool.icon" class="h-5 w-5" />
                </span>
              </div>
              <p class="mt-3 inline-flex items-center gap-1 text-caption font-semibold text-primary">
                계산하기
                <ArrowRight class="h-3.5 w-3.5" />
              </p>
            </RouterLink>
          </ActionCard>
        </div>
      </div>
    </ShSurface>

    <RelatedServices />
  </div>
</template>
