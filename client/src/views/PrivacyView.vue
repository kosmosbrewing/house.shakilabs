<script setup lang="ts">
import SEOHead from "@/components/common/SEOHead.vue";
import { useConstantsStore } from "@/stores/constants";

const constantsStore = useConstantsStore();
</script>

<template>
  <SEOHead
    title="개인정보 처리방침"
    description="shakilabs.com/house의 개인정보 처리방침입니다. 부동산 계산 입력값의 브라우저 내 처리 원칙, 쿠키와 제3자 광고(Google AdSense), 맞춤 광고 해제 방법을 안내합니다."
  />

  <div class="container py-5">
    <div class="retro-panel">
      <div class="retro-titlebar rounded-t-2xl">
        <h1 class="retro-title">개인정보 처리방침</h1>
      </div>

      <div class="retro-panel-content space-y-4">
        <p class="text-body text-muted-foreground">
          shakilabs.com/house(이하 "본 서비스")은 이용자의 개인정보를 중요하게 생각하며,
          개인정보 보호 관련 법령을 준수합니다. 본 방침은 서비스가 어떤 정보를 다루고,
          이용자가 어떤 권리를 행사할 수 있는지 설명합니다.
        </p>

        <h2 class="text-heading font-bold">1. 수집하지 않는 정보 — 계산 입력값</h2>
        <p class="text-body text-muted-foreground">
          매매 시세, 전세·월세 보증금, 공시가격, 대출 조건 등 이용자가 계산기에 입력하는 모든 값은
          이용자의 브라우저 안에서만 계산되며, 서버로 전송되거나 데이터베이스에 저장되지 않습니다.
          본 서비스는 회원가입 절차가 없어 이름, 이메일 주소, 연락처 같은 계정 정보도 수집하지 않습니다.
          일부 계산기는 편의를 위해 입력값을 이용자 기기의 브라우저 저장소(sessionStorage)에
          임시 보관할 수 있으나, 이 데이터는 기기 밖으로 나가지 않으며 브라우저 데이터 삭제로
          언제든 지울 수 있습니다.
        </p>

        <h2 class="text-heading font-bold">2. 자동으로 수집되는 정보</h2>
        <p class="text-body text-muted-foreground">
          서비스 개선과 트래픽 분석을 위해 방문 페이지, 접속 일시, 브라우저·기기 유형, 대략적인 접속
          지역 등 개인을 직접 식별할 수 없는 접속 기록이 Google Analytics를 통해 수집될 수 있습니다.
          이 정보는 익명화된 통계 형태로만 처리되며, 특정 개인을 추적하거나 식별하는 목적으로
          사용하지 않습니다.
        </p>

        <h2 class="text-heading font-bold">3. 쿠키와 제3자 광고 (Google AdSense)</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 무료 운영을 위해 Google AdSense 광고를 게재하며, 이와 관련해 다음 사항을
          알려드립니다.
        </p>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>
            Google을 포함한 제3자 광고 사업자는 쿠키를 사용하여 이용자가 본 서비스 또는 다른
            웹사이트를 방문한 기록을 기반으로 광고를 게재합니다.
          </li>
          <li>
            Google은 광고 쿠키를 사용해 이용자의 본 사이트 및 다른 사이트 방문 기록에 기반한
            맞춤 광고를 제공합니다.
          </li>
          <li>
            맞춤 광고는
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              class="retro-link"
            >Google 광고 설정(adssettings.google.com)</a>에서 해제할 수 있고,
            <a
              href="https://www.aboutads.info/choices"
              target="_blank"
              rel="noopener noreferrer"
              class="retro-link"
            >aboutads.info/choices</a>에서 제3자 광고 사업자의 맞춤 광고용 쿠키 사용을 일괄
            거부할 수 있습니다.
          </li>
          <li>
            브라우저 설정에서 쿠키 저장을 거부하거나 저장된 쿠키를 삭제할 수 있으며, 쿠키를
            거부해도 계산 기능 이용에는 제한이 없습니다.
          </li>
        </ul>

        <h2 class="text-heading font-bold">4. 수집 목적과 보관 기간</h2>
        <p class="text-body text-muted-foreground">
          자동 수집되는 접속 통계는 서비스 개선, 오류 진단, 콘텐츠 품질 향상, 광고 성과 측정
          목적으로만 이용됩니다. 익명 통계는 분석 도구의 기본 보존 기간이 지나면 자동 파기되며,
          본 서비스는 개인을 식별할 수 있는 정보를 직접 보관하지 않습니다.
        </p>

        <h2 class="text-heading font-bold">5. 이용자의 권리와 제3자 제공</h2>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>브라우저 설정에서 쿠키를 차단·삭제하고, 위 링크에서 맞춤 광고를 해제할 수 있습니다.</li>
          <li>Google Analytics 수집을 원하지 않는 경우 차단 브라우저 부가기능을 사용할 수 있습니다.</li>
          <li>보유가 추정되는 정보의 열람·정정·삭제 요청은 아래 문의처로 접수할 수 있습니다.</li>
        </ul>
        <p class="text-body text-muted-foreground">
          본 서비스는 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않으며, 법령에 근거한 경우를
          제외하고 수집된 정보를 제3자에게 제공하지 않습니다. 광고(Google AdSense)와 분석(Google
          Analytics) 도구는 각 사업자의 쿠키로 정보를 처리하며, 이 경우 해당 사업자의 개인정보
          처리방침이 적용됩니다.
        </p>

        <h2 class="text-heading font-bold">6. 방침의 변경과 문의</h2>
        <p class="text-body text-muted-foreground">
          본 방침이 변경되는 경우 이 페이지를 통해 게시합니다. 개인정보 관련 문의:
          <a :href="`mailto:${constantsStore.supportEmail}`" class="retro-link">
            {{ constantsStore.supportEmail }}
          </a>
        </p>
        <p class="text-body text-muted-foreground">운영: ShakiLabs · 문의: skdba1313@gmail.com</p>

        <p class="text-tiny text-muted-foreground mt-6">
          시행일: 2026년 3월 15일 · 최종 개정일: 2026년 8월 5일
        </p>
      </div>
    </div>
  </div>
</template>
