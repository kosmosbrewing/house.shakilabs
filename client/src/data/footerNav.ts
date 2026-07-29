import type { SiteFooterLink, SiteFooterSection } from "@shakilabs/ui";

/** 푸터 계산기 목록 — 라우터의 실제 경로만 담는다(리다이렉트 별칭 제외) */
export const FOOTER_SECTIONS: readonly SiteFooterSection[] = [
  {
    title: "전세·월세",
    links: [
    { to: "/delay-interest", label: "보증금 지연이자" },
    { to: "/jeonse-vs-wolse", label: "전세 vs 월세" },
    { to: "/jeonse-wolse-rate", label: "전월세 전환율" },
    { to: "/jeonse-risk", label: "깡통전세 진단" },
    ],
  },
  {
    title: "매매·세금",
    links: [
    { to: "/property-tax", label: "재산세·보유세" },
    { to: "/acquisition-tax", label: "취득세" },
    { to: "/capital-gains-tax", label: "양도소득세" },
    { to: "/brokerage-fee", label: "중개보수" },
    ],
  },
  {
    title: "청약·투자",
    links: [
    { to: "/first-home", label: "생애최초 혜택" },
    { to: "/housing-subscription", label: "청약 가점" },
    { to: "/rental-yield", label: "임대수익률" },
    ],
  },
];

export const FOOTER_ALL_LINK: SiteFooterLink = {
  to: "/",
  label: "전체 계산기 보기 →",
};
