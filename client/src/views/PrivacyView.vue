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

        <h2 class="text-heading font-bold">1. 수집하지 않는 정보 — 이 서비스가 받는 계산 입력값</h2>
        <p class="text-body text-muted-foreground">
          본 서비스의 계산기가 이용자에게 요구하는 값은 아래가 전부입니다. 모두 주거·부동산 금액을
          다루는 숫자이며, 이름·주민등록번호·주소·연락처처럼 개인을 식별하는 항목은 어떤 계산기도
          입력받지 않습니다. 아래 값은 전부 이용자의 브라우저 안에서만 계산되고, 서버로 전송되거나
          데이터베이스에 저장되지 않습니다.
        </p>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>보증금 반환 지연이자 — 보증금, 반환 지연 일수, 적용 연이율</li>
          <li>전세 vs 월세·전월세 전환율 — 전세 보증금, 월세 보증금과 월세액, 보증금 기회비용 금리, 대출 금리</li>
          <li>주택 중개보수 — 거래금액, 거래 유형(매매·임대차), 주택 유형</li>
          <li>재산세·종합부동산세 — 공시가격, 보유 주택 수, 1세대 1주택 여부</li>
          <li>취득세·양도소득세 — 취득가, 양도가, 보유·거주 기간, 필요경비, 다주택 여부</li>
          <li>청약 가점 — 무주택 기간, 부양가족 수, 청약통장 가입 기간</li>
          <li>깡통전세 위험 진단 — 보증금, 주택 시세, 선순위 채권액</li>
          <li>임대수익률 — 매매가, 보증금, 월세, 대출금액과 금리, 공실률</li>
        </ul>
        <p class="text-body text-muted-foreground">
          본 서비스는 회원가입 절차가 없어 계정 정보도 수집하지 않습니다. 이용자의 브라우저가 본
          서비스의 서버에 보내는 요청은 세율·요율 상수를 내려받는 조회 요청 한 가지뿐이며, 이 요청에는
          위 입력값이 실리지 않습니다.
        </p>

        <h2 class="text-heading font-bold">2. 계산 결과 URL 공유 시 주의사항</h2>
        <p class="text-body text-muted-foreground">
          본 서비스는 입력한 조건을 URL에 담아 그대로 공유할 수 있습니다. 예를 들어 보증금 3억 원으로
          계산한 화면의 주소에는 그 금액이 경로나 파라미터로 남습니다. 이는 공인중개사·임대인과 같은
          화면을 두고 이야기하라고 만든 기능이지만, 그 링크를 공개 게시판이나 단체 대화방에 올리면
          해당 금액도 함께 공개된다는 뜻입니다. 링크를 공유하기 전에 주소에 남은 조건을 확인해 주세요.
          본 서비스는 그 URL을 서버에 기록하지 않습니다.
        </p>

        <h2 class="text-heading font-bold">3. 이 탭에만 남는 입력 기억 기능</h2>
        <p class="text-body text-muted-foreground">
          보유세(재산세·종합부동산세) 계산기에는 이용자가 직접 켜야 동작하는 "이 탭에 입력 기억하기"
          기능이 있습니다. 이 기능을 켠 경우에만 브라우저의 sessionStorage에
          <code>house:property-tax-session-draft:v1</code> 키로 값이 저장되며, 저장되는 내용은
          공시가격 같은 금액 자체가 아니라 결과 화면을 다시 여는 주소와 저장 시각입니다. 보관 기간은
          최대 8시간이고 그 이후에는 불러오지 않으며, 탭을 닫거나 화면의 "입력 기억 끄기"를 누르면
          즉시 삭제됩니다. 이 값은 이용자 기기 밖으로 나가지 않습니다.
        </p>

        <h2 class="text-heading font-bold">4. 자동으로 수집되는 정보</h2>
        <p class="text-body text-muted-foreground">
          서비스 개선과 트래픽 분석을 위해 방문 페이지, 접속 일시, 브라우저·기기 유형, 대략적인 접속
          지역 등 개인을 직접 식별할 수 없는 접속 기록이 Google Analytics를 통해 수집될 수 있습니다.
          이때 전송되는 페이지 주소에서는 금액 구간이 제거됩니다. 예컨대 보증금 3억 원으로 연 화면인
          <code>/house/delay-interest/30000</code>은 금액 이후를 잘라낸
          <code>/house/delay-interest</code>로 정규화되어 기록되므로, 어떤 계산기가 얼마나 쓰이는지는
          알 수 있어도 개별 이용자가 어떤 금액을 넣었는지는 남지 않습니다.
        </p>
        <p class="text-body text-muted-foreground">
          또한 화면에서 오류가 발생하면 원인 파악을 위해 오류 메시지와 발생 위치가 오류 수집 도구
          Sentry로 전송될 수 있습니다. 이 도구는 개인 식별 정보를 함께 보내지 않도록 설정되어
          있습니다.
        </p>

        <h2 class="text-heading font-bold">5. 쿠키와 제3자 광고 (Google AdSense)</h2>
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

        <h2 class="text-heading font-bold">6. 수집 목적과 보관 기간</h2>
        <p class="text-body text-muted-foreground">
          자동 수집되는 접속 통계는 서비스 개선, 오류 진단, 콘텐츠 품질 향상, 광고 성과 측정
          목적으로만 이용됩니다. 익명 통계는 분석 도구의 기본 보존 기간이 지나면 자동 파기되며,
          본 서비스는 개인을 식별할 수 있는 정보를 직접 보관하지 않습니다. 계산 입력값은 애초에
          서버로 오지 않으므로 파기할 대상 자체가 없습니다.
        </p>

        <h2 class="text-heading font-bold">7. 이용자의 권리와 제3자 제공</h2>
        <ul class="text-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>브라우저 설정에서 쿠키를 차단·삭제하고, 위 링크에서 맞춤 광고를 해제할 수 있습니다.</li>
          <li>Google Analytics 수집을 원하지 않는 경우 차단 브라우저 부가기능을 사용할 수 있습니다.</li>
          <li>보유세 계산기의 "입력 기억 끄기"를 누르거나 탭을 닫으면 저장된 주소가 즉시 지워집니다.</li>
          <li>보유가 추정되는 정보의 열람·정정·삭제 요청은 아래 문의처로 접수할 수 있습니다.</li>
        </ul>
        <p class="text-body text-muted-foreground">
          본 서비스는 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않으며, 법령에 근거한 경우를
          제외하고 수집된 정보를 제3자에게 제공하지 않습니다. 광고(Google AdSense), 분석(Google
          Analytics), 오류 수집(Sentry) 도구는 각 사업자의 쿠키나 요청으로 정보를 처리하며, 이 경우
          해당 사업자의 개인정보 처리방침이 적용됩니다.
        </p>

        <h2 class="text-heading font-bold">8. 방침의 변경과 문의</h2>
        <p class="text-body text-muted-foreground">
          본 방침이 변경되는 경우 이 페이지를 통해 게시합니다. 개인정보 관련 문의:
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

<style scoped>
/* 앱에 code 스타일이 없어 브라우저 기본값이 그대로 나온다. 저장소 키·경로 예시가
   본문과 구분되도록 최소한만 입히고, 색은 토큰으로 두어 다크모드에서도 읽히게 한다. */
code {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
  border-radius: 0.25rem;
  padding: 0.05em 0.35em;
  font-size: 0.92em;
  /* 좁은 화면에서 컨테이너를 밀어내지 않도록, 단 필요할 때만 끊는다 */
  overflow-wrap: anywhere;
}
</style>
