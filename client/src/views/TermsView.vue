<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";
import { useConstantsStore } from "@/stores/constants";

const constantsStore = useConstantsStore();
</script>

<template>
  <SEOHead
    title="이용약관"
    description="shakilabs.com/house의 서비스 이용약관입니다. 서비스 제공 범위, 정보 제공의 한계(부동산·법률 자문 아님), 광고 게재, 면책 조항을 안내합니다."
  />

  <div class="container py-5">
    <div class="retro-panel">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">이용약관</h1>
      </div>

      <div class="retro-panel-content space-y-4">
        <p class="text-body text-muted-foreground">
          본 약관은 ShakiLabs(이하 "운영자")가 제공하는 주거·부동산 계산기 서비스
          shakilabs.com/house(이하 "본 서비스")의 이용 조건을 규정합니다. 서비스에 접속해 계산 기능을
          이용하는 경우 본 약관에 동의한 것으로 봅니다.
        </p>

        <h2 class="text-heading font-bold">1. 서비스의 내용</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 보증금 반환 지연이자, 전세 vs 월세 손익분기, 주택 중개보수 상한,
          취득세·재산세·양도소득세, 청약 가점, 깡통전세 위험 진단, 임대수익률 등 주거·부동산
          의사결정에 필요한 무료 계산 도구를 제공합니다. 회원가입 없이 누구나 이용할 수 있으며,
          입력한 값은 서버로 전송되지 않고 이용자의 브라우저 안에서만 처리됩니다. 서비스의 기능과
          콘텐츠는 품질 개선을 위해 사전 고지 없이 추가·변경·중단될 수 있습니다.
        </p>

        <h2 class="text-heading font-bold">2. 정보 제공의 한계 — 부동산·법률 자문이 아님</h2>
        <p class="text-body text-muted-foreground">
          본 서비스의 계산 결과와 가이드 콘텐츠는 이용자가 입력한 값과 공개된 법령·조례의 일반 기준에
          따라 산출되는 참고용 추정치입니다. 본 서비스는 부동산 중개, 세무·법률 자문, 금융상품
          자문·권유에 해당하지 않으며 이를 대체하지 않습니다. 실제 세액·수수료·이자·판결 금액은 계약
          내용, 개별 사실관계, 법령과 지자체 조례의 개정, 과세관청·법원의 판단에 따라 달라질 수
          있으므로, 계약·소송·투자 등 실제 의사결정 전에는 반드시 세무사·변호사·공인중개사 등 자격을
          갖춘 전문가 또는 관계기관의 확인을 거쳐야 합니다.
        </p>

        <p class="text-body text-muted-foreground">
          계산기별로 결과가 보장하지 않는 범위는 다음과 같습니다. 깡통전세 위험 진단은 보증금과 시세,
          선순위 채권액으로 회수 가능성을 가늠하는 지표일 뿐, 전세보증금 반환보증 가입 가부나 실제
          경매 배당 순위·배당액을 보장하지 않습니다. 청약 가점 계산은 무주택 기간·부양가족 수·통장
          가입 기간의 배점을 합산한 값이며 당첨 여부나 커트라인을 예측하지 않습니다. 보증금 반환
          지연이자는 약정 이율이 없는 경우를 전제한 계산으로, 임대차계약서에 별도 이율이 있으면 그
          약정이 우선합니다. 중개보수는 조례상 상한요율과 한도액에 따른 최대치이며 실제 보수는
          중개의뢰인과 개업공인중개사의 협의로 정해집니다.
        </p>

        <h2 class="text-heading font-bold">3. 계산 기준의 출처와 갱신</h2>
        <p class="text-body text-muted-foreground">
          본 서비스의 세율·요율·이율은 운영자가 임의로 정한 값이 아니라 민법, 소송촉진 등에 관한
          특례법, 지방세법, 종합부동산세법, 소득세법, 공인중개사법 시행규칙과 지자체 조례 등 공개된
          법령 원문과 고시에서 옮겨온 값입니다. 각 계산기 화면에는 근거 문서와 확인일을 함께
          표시하므로 이용자는 결과를 신뢰하기 전에 원문을 직접 대조할 수 있습니다. 법령·조례가
          개정되면 해당 상수를 갱신하고 확인일을 함께 올리지만, 개정 시점과 반영 시점 사이에는 시차가
          있을 수 있습니다. 운영자는 특정 시점의 기준값이 항상 최신임을 보장하지 않으며, 반영되지
          않은 개정 사항을 발견한 경우 아래 문의처로 알려주시면 확인 후 조치합니다.
        </p>

        <h2 class="text-heading font-bold">4. 계산 결과의 공유</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 입력 조건을 URL에 담아 공유하는 기능을 제공합니다. 이용자가 그 링크를 제3자에게
          전달하면 링크에 담긴 금액 조건도 함께 전달되므로, 공유 범위는 이용자가 판단하고 관리해야
          합니다. 공유된 링크로 표시되는 결과 역시 참고용 추정치이며, 이를 계약 조건의 합의나 금액
          확정의 근거로 삼은 결과에 대해 운영자는 책임을 지지 않습니다.
        </p>

        <h2 class="text-heading font-bold">5. 광고의 게재</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 무료 운영 재원을 마련하기 위해 Google AdSense 등 제3자 광고를 게재합니다.
          광고 영역은 본문 콘텐츠와 구분되어 표시되며, 광고에 소개되는 상품·서비스는 운영자와
          무관하고 운영자가 보증하지 않습니다. 이용자가 광고를 통해 광고주와 거래하는 경우 그 거래의
          책임은 이용자와 광고주에게 있습니다. 쿠키를 이용한 맞춤 광고와 해제 방법은 개인정보
          처리방침에서 안내합니다.
        </p>

        <h2 class="text-heading font-bold">6. 면책 조항</h2>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>운영자는 계산 결과와 콘텐츠의 정확성·완전성·최신성을 위해 노력하지만, 이를 법적으로 보증하지 않습니다.</li>
          <li>계산 결과는 실제 계약서·정산서·고지서·판결 결과와 차이가 있을 수 있으며, 법령·조례의 개정과 적용 시점에 따라 달라질 수 있습니다.</li>
          <li>계산 결과를 근거로 한 이용자의 계약·소송·투자 판단과 그로 인한 손해에 대해 운영자는 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.</li>
          <li>무료 서비스 특성상 시스템 점검, 장애, 불가항력으로 인한 일시적 중단에 대해서도 같으며, 중단에 따른 별도 보상은 제공되지 않습니다.</li>
        </ul>

        <h2 class="text-heading font-bold">7. 지식재산권과 이용자의 의무</h2>
        <p class="text-body text-muted-foreground">
          본 서비스의 디자인, 코드, 가이드 콘텐츠에 대한 권리는 운영자에게 있습니다. 계산 결과의
          공유·인용은 자유롭게 가능하나, 서비스 자체의 복제·재배포·2차 가공은 금지합니다. 이용자는
          과도한 자동화 접근(크롤링·스크래핑), 광고에 대한 부정 클릭 유도 등 서비스의 안정적인 운영을
          방해하는 행위를 해서는 안 되며, 위반으로 발생한 손해는 해당 이용자가 부담합니다.
        </p>

        <h2 class="text-heading font-bold">8. 약관의 변경과 준거법</h2>
        <p class="text-body text-muted-foreground">
          운영자는 필요한 경우 본 약관을 변경할 수 있으며, 변경된 약관은 이 페이지에 게시한 때부터
          효력이 발생합니다. 본 약관은 대한민국 법령에 따라 해석되고 적용되며, 분쟁이 협의로 해결되지
          않는 경우 민사소송법에 따른 관할 법원에서 해결합니다.
        </p>

        <h2 class="text-heading font-bold">9. 문의</h2>
        <p class="text-body text-muted-foreground">
          이용약관 관련 문의:
          <a :href="`mailto:${constantsStore.supportEmail}`" class="retro-link">
            {{ constantsStore.supportEmail }}
          </a>
        </p>
        <p class="text-body text-muted-foreground">운영: ShakiLabs · 문의: skdba1313@gmail.com</p>

        <p class="text-tiny text-muted-foreground mt-6">
          시행일: 2026년 3월 15일 · 최종 개정일: 2026년 8월 10일
        </p>
      </div>
    </div>
  </div>
</template>
