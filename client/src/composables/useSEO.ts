import { useHead } from "@unhead/vue";
import { toValue, type MaybeRefOrGetter } from "vue";
import { useRoute } from "vue-router";
import { getSiteUrl } from "@/lib/site";

const CATEGORY = "주거 계산기";
const BRAND = "ShakiLabs";

// 네이버 CTR 측정(2026-10): 검색 결과 제목이 ~35자에서 잘린다. 기존 레시피
// `<페이지 제목> | 주거 계산기 | ShakiLabs`는 가운데 앱 이름 세그먼트가 20자 가까이
// 차지해 핵심 구절과 브랜드가 동시에 잘려 나갔다("…택배비 비…"). 계산기·도구
// 페이지는 그 세그먼트를 없애 `<페이지 제목> | ShakiLabs`로 단순화한다.
// 소개·약관·개인정보·404처럼 검색 유입이 목적이 아닌 페이지는 35자 절단이
// 문제되지 않으므로 앱 이름을 남긴다 — 그렇지 않으면 "이용약관 | ShakiLabs"가
// 앱 12개에서 전부 똑같아져 도메인 안에서 제목이 중복된다.
const CALCULATOR_SUFFIX = ` | ${BRAND}`;
const POLICY_SUFFIX = ` · ${CATEGORY} | ${BRAND}`;
const LEGACY_TITLE_SUFFIXES = [
  ` | ${CATEGORY} | ${BRAND}`, // 이전 레시피(가운데 앱 이름 포함) — 가장 먼저 걸러야 일부만 벗겨지지 않는다
  POLICY_SUFFIX,
  " | 오픈마켓 수수료 비교 계산기",
  " | 오픈마켓 수수료 계산기",
  " | 주거 계산기",
  CALCULATOR_SUFFIX,
] as const;

type SEOOptions = {
  title: MaybeRefOrGetter<string>;
  description: MaybeRefOrGetter<string>;
  ogImage?: MaybeRefOrGetter<string | undefined>;
  noindex?: MaybeRefOrGetter<boolean | undefined>;
  jsonLd?: MaybeRefOrGetter<
    Record<string, unknown> | Record<string, unknown>[] | undefined
  >;
  /**
   * Overrides the path used for canonical / hreflang / og:url.
   * Amount-variant routes (e.g. /property-tax/30000) pass their base page
   * ("/property-tax") because the prerendered body is near-identical across
   * variants — canonical consolidation instead of noindex, so ranking signals
   * merge into the base calculator. Reversible: drop the override and the
   * route becomes self-canonical again.
   */
  canonicalPath?: MaybeRefOrGetter<string | undefined>;
  /**
   * 소개·이용약관·개인정보처리방침·404처럼 검색 유입이 목적이 아닌 페이지용.
   * true면 `<페이지 제목> · 주거 계산기 | ShakiLabs`로 앱 이름을 남긴다.
   * 계산기·도구·가이드 페이지는 기본값(false)을 쓴다.
   */
  policyPage?: MaybeRefOrGetter<boolean | undefined>;
};

function stripKnownSuffix(rawTitle: string): string {
  const trimmed = rawTitle.trim();
  for (const suffix of LEGACY_TITLE_SUFFIXES) {
    if (trimmed.endsWith(suffix)) {
      return trimmed.slice(0, -suffix.length).trimEnd();
    }
  }
  return trimmed;
}

function normalizeTitle(rawTitle: string, isPolicyPage: boolean): string {
  const baseTitle = stripKnownSuffix(rawTitle) || CATEGORY;

  if (isPolicyPage) {
    // 페이지 제목이 이미 카테고리 자체면("주거 계산기") 또 붙이지 않는다 —
    // 홈이 "주거 계산기 · 주거 계산기 | ShakiLabs"로 중복되던 문제의 재발 방지.
    if (baseTitle === CATEGORY) {
      return `${CATEGORY}${CALCULATOR_SUFFIX}`;
    }
    return `${baseTitle}${POLICY_SUFFIX}`;
  }

  return `${baseTitle}${CALCULATOR_SUFFIX}`;
}

export function useSEO({
  title,
  description,
  ogImage,
  noindex = false,
  jsonLd,
  canonicalPath,
  policyPage = false,
}: SEOOptions): void {
  const route = useRoute();

  useHead(() => {
    const resolvedTitle = normalizeTitle(toValue(title), Boolean(toValue(policyPage)));
    const resolvedDescription = toValue(description);
    const resolvedNoindex = Boolean(toValue(noindex));
    const resolvedOgImage = toValue(ogImage);
    const resolvedJsonLd = toValue(jsonLd);
    const resolvedJsonLdArray = Array.isArray(resolvedJsonLd)
      ? resolvedJsonLd.filter(
          (entry): entry is Record<string, unknown> =>
            Boolean(entry) && typeof entry === "object"
        )
      : resolvedJsonLd && typeof resolvedJsonLd === "object"
        ? [resolvedJsonLd]
        : [];
    const siteUrl = getSiteUrl().replace(/\/+$/, "");
    // canonical/hreflang/og:url must always agree, so they all derive from the
    // same resolved path (consolidation override first, route path otherwise).
    const currentPath = toValue(canonicalPath) || route.path || "/";
    const currentUrl = currentPath === "/" ? siteUrl : `${siteUrl}${currentPath}`;

    return {
      htmlAttrs: {
        lang: "ko",
      },
      title: resolvedTitle,
      link: currentUrl
        ? [
            { rel: "canonical", href: currentUrl },
            { rel: "alternate", hreflang: "ko", href: currentUrl },
            { rel: "alternate", hreflang: "x-default", href: currentUrl },
          ]
        : [],
      meta: [
        { name: "description", content: resolvedDescription },
        { property: "og:title", content: resolvedTitle },
        { property: "og:description", content: resolvedDescription },
        { name: "twitter:title", content: resolvedTitle },
        { name: "twitter:description", content: resolvedDescription },
        ...(currentUrl ? [{ property: "og:url", content: currentUrl }] : []),
        ...(resolvedNoindex ? [{ name: "robots", content: "noindex,nofollow" }] : []),
        ...(resolvedOgImage
          ? [
              { property: "og:image", content: resolvedOgImage },
              { name: "twitter:image", content: resolvedOgImage },
            ]
          : []),
      ],
      script: resolvedJsonLdArray.map((entry, index) => ({
        key: `json-ld-${index}`,
        type: "application/ld+json",
        textContent: JSON.stringify(entry),
      })),
    };
  });
}
