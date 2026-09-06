<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { ShSiteFooter } from "@shakilabs/ui";
import { FOOTER_ALL_LINK, FOOTER_SECTIONS } from "@/data/footerNav";
import { useConstantsStore } from "@/stores/constants";
import { VERIFICATION_DATE_RANGE } from "@/data/verificationDates";

const constantsStore = useConstantsStore();
const year = new Date().getFullYear();
const SUPPORT_EMAIL = constantsStore.supportEmail;

const policyLinks = [
  { to: "/about", label: "사이트 안내" },
  { to: "/terms", label: "이용약관" },
  { to: "/privacy", label: "개인정보 처리방침" },
  // 블로그는 root(shakilabs.com/blog) 소유라 앱 라우터 밖이다 — href를 주면
  // ShSiteFooter가 RouterLink 대신 <a href>로 렌더해 /house/blog로 깨지지 않는다.
  { to: "", href: "/blog", label: "블로그" },
  { to: "", href: `mailto:${SUPPORT_EMAIL}`, label: "문의" },
];

// 확인일은 계산기마다 다르다 — 한 줄만 쓸 수 있는 자리라 단일 날짜 대신 범위를 적고
// 주제별 표기는 /about과 각 계산기의 "출처 및 기준"으로 넘긴다.
const note = computed(
  () =>
    `계산 기준 확인일: 주제별 ${VERIFICATION_DATE_RANGE.earliest}~${VERIFICATION_DATE_RANGE.latest}`
    + ` (계산기별 표기는 각 화면의 '출처 및 기준'과 사이트 안내 참고)`
    + ` | 실제 계약·소송 금액은 적용 시점과 협의 내용에 따라 달라질 수 있습니다.`
);
</script>

<template>
  <ShSiteFooter
    app="house"
    :sections="FOOTER_SECTIONS"
    :all-link="FOOTER_ALL_LINK"
    :policy-links="policyLinks"
    :note="note"
    site-label="shakilabs.com/house"
    :copyright="`Copyright © ${year} shakilabs.com`"
    :link-component="RouterLink"
  />
</template>
