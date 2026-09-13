import { useHead } from "@unhead/vue";
import { toValue, type MaybeRefOrGetter } from "vue";
import { useRoute } from "vue-router";
import { getSiteUrl } from "@/lib/site";

const CATEGORY = "주거 계산기";
const TITLE_SUFFIX = ` | ${CATEGORY} | ShakiLabs`;
const LEGACY_TITLE_SUFFIXES = [
  " | 오픈마켓 수수료 비교 계산기",
  " | 오픈마켓 수수료 계산기",
  " | 주거 계산기",
  " | ShakiLabs",
  TITLE_SUFFIX,
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
};

function normalizeTitle(rawTitle: string): string {
  const trimmed = rawTitle.trim();
  let baseTitle = trimmed;

  for (const suffix of LEGACY_TITLE_SUFFIXES) {
    if (baseTitle.endsWith(suffix)) {
      baseTitle = baseTitle.slice(0, -suffix.length).trimEnd();
      break;
    }
  }

  if (!baseTitle) {
    return `주거 계산기${TITLE_SUFFIX}`;
  }

  // 페이지 이름이 이미 카테고리로 시작하면 배지를 또 붙이지 않는다.
  // 홈이 "주거 계산기 | 주거 계산기 | ShakiLabs"로 중복 렌더되던 문제(라이브 실측).
  if (baseTitle === CATEGORY || baseTitle.startsWith(`${CATEGORY} `)) {
    return `${baseTitle} | ShakiLabs`;
  }

  return `${baseTitle}${TITLE_SUFFIX}`;
}

export function useSEO({
  title,
  description,
  ogImage,
  noindex = false,
  jsonLd,
  canonicalPath,
}: SEOOptions): void {
  const route = useRoute();

  useHead(() => {
    const resolvedTitle = normalizeTitle(toValue(title));
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
