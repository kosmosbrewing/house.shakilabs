<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";
import { buttonVariants } from "@/components/ui/button";
import { useConstantsStore } from "@/stores/constants";

const constantsStore = useConstantsStore();
</script>

<template>
  <SEOHead
    title="서비스 안내"
    description="shakilabs.com/house는 주거 관련 핵심 계산을 빠르게 확인하는 무료 도구입니다."
  />

  <div class="container py-5 space-y-5">
    <div class="retro-panel">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">서비스 안내</h1>
      </div>

      <div class="retro-panel-content space-y-4">
        <h2 class="text-heading font-bold">shakilabs.com/house 소개</h2>
        <p class="text-body text-muted-foreground">
          shakilabs.com/house는 임차·매매 의사결정에서 자주 필요한 금액 계산을 빠르게 제공하는 무료 도구입니다.
          로그인 없이 바로 계산할 수 있고, 현재 입력값을 URL로 공유할 수 있습니다.
        </p>

        <h2 class="text-heading font-bold">제공하는 계산기 11종</h2>
        <p class="text-body text-muted-foreground">
          주거 의사결정은 계약 단계마다 필요한 계산이 다릅니다. 그래서 계산기를 세 단계로 나눠 두었습니다.
        </p>
        <ul class="about-feature-list text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li><strong>전세·월세 단계</strong> — 보증금 반환 지연이자, 전세 vs 월세 손익분기, 전월세 전환율, 깡통전세 위험 진단</li>
          <li><strong>매매·세금 단계</strong> — 재산세·종합부동산세, 취득세, 양도소득세, 중개보수 상한</li>
          <li><strong>청약·투자 단계</strong> — 생애최초 주택 구입 혜택, 청약 가점, 임대수익률·자기자본수익률(ROE)</li>
        </ul>
        <p class="text-body text-muted-foreground">
          모든 계산기는 로그인 없이 즉시 동작하며, 입력값이 URL 파라미터로 남기 때문에
          링크만 보내면 상대방이 같은 조건의 결과를 그대로 볼 수 있습니다.
          공인중개사·임대인과 금액을 두고 이야기할 때 근거 화면을 그대로 공유하라고 만든 기능입니다.
        </p>

        <h2 class="text-heading font-bold">계산 기준과 검증 방식</h2>
        <p class="text-body text-muted-foreground">
          이 사이트의 세율·요율은 임의로 정한 값이 아니라 법령 원문과 지자체 고시에서 옮겨온 값입니다.
          각 계산기 하단의 "출처 및 기준" 영역에 근거 문서 링크와 확인일을 함께 표시하므로,
          결과를 믿기 전에 원문을 직접 열어 대조할 수 있습니다.
        </p>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>법령·조례 확인일: {{ constantsStore.feeDataUpdated }}</li>
          <li>보증금 지연이자 — 약정이 없으면 민법상 연 5%, 소장 등이 송달된 다음 날부터는 소송촉진법상 연 12%를 구분해 적용</li>
          <li>재산세·종합부동산세 — 공시가격에 공정시장가액비율을 적용하고, 1세대 1주택 기본공제 12억 원과 세부담 상한을 반영</li>
          <li>중개보수 — 서울시 주택 중개보수 요율표의 거래금액 구간별 상한요율·한도액 기준</li>
          <li>임대수익률 — 총수익률·순수익률·ROE를 분리 계산해 대출 레버리지 효과를 따로 확인</li>
        </ul>
        <p class="text-body text-muted-foreground">
          단, 계산 결과는 어디까지나 입력 전제에 따른 추정입니다.
          전세 vs 월세 비교는 사용자가 입력한 기회비용 금리에 따라 결론이 뒤집힐 수 있고,
          보유세는 실제 공시가격과 감면 여부에, 양도세는 보유·거주 기간과 다주택 여부에 따라 달라집니다.
          실제 계약·신고·소송 금액은 세무사, 공인중개사, 변호사 등 전문가 확인을 권장합니다.
        </p>

        <h2 class="text-heading font-bold">운영자 정보</h2>
        <div class="retro-panel-muted space-y-2 p-4">
          <p class="text-body font-bold text-foreground">운영: ShakiLabs · 문의: skdba1313@gmail.com</p>
          <p class="text-body text-muted-foreground">
            모든 계산식과 기준값은 지방세법·소송촉진법 등 관련 법령과
            위택스·주택도시보증공사(HUG)·금융감독원 같은 공공기관의 공시 자료에 대조해 검증하며,
            법령이나 조례가 바뀌면 확인일을 명시해 갱신합니다.
          </p>
        </div>

        <h2 class="text-heading font-bold">문의</h2>
        <p class="text-body text-muted-foreground">
          오류 제보나 기능 건의는
          <a :href="`mailto:${constantsStore.supportEmail}`" class="retro-link">{{ constantsStore.supportEmail }}</a>으로
          보내주세요.
        </p>
      </div>
    </div>

    <div class="text-center">
      <a :class="buttonVariants({ variant: 'default' })" href="/house">
        홈으로 돌아가기
      </a>
    </div>
  </div>
</template>
