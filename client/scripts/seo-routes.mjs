// 파라미터 단위: 만 원 (URL 파라미터 × 10,000 = 원화)
export const BROKERAGE_PRICES = [10000, 30000, 50000, 70000, 100000];
export const JEONSE_DEPOSITS = [10000, 20000, 30000, 50000];
export const DELAY_DEPOSITS = [1000, 2000, 3000, 5000, 7000, 10000, 15000, 20000, 25000, 30000, 40000, 50000];
export const PROPERTY_TAX_PRICES = [20000, 30000, 40000, 50000, 60000, 70000, 80000, 100000, 120000, 150000, 200000];
export const CAPITAL_GAINS_SELL_PRICES = [50000, 80000, 120000, 200000];
export const ACQUISITION_PRICES = [30000, 60000, 90000, 120000, 150000];
export const RENTAL_YIELD_PRICES = [30000, 50000, 70000, 100000, 150000];
export const JEONSE_WOLSE_RATE_DEPOSITS = [10000, 20000, 30000, 50000];

// Doorway-variant consolidation (AdSense "low value content" remediation).
// A full pairwise audit of all 8 amount-variant families found every pair above
// 0.96 text similarity against its base calculator — even the two families that
// already build per-preset copy from the calculation engine (seoParamGuides.ts:
// /delay-interest 0.966, /property-tax 0.968). At that level the variants read
// as doorway pages, so they are consolidated instead of enriched: canonical
// points at the base calculator and the variants leave the sitemap.
// This is reversible — once a variant grows genuinely distinct body content,
// drop it from PARAM_ROUTES and it returns to the sitemap as self-canonical.
export const PARAM_ROUTES = [
  ...BROKERAGE_PRICES.map((p) => `/brokerage-fee/${p}`),
  ...JEONSE_DEPOSITS.map((d) => `/jeonse-vs-wolse/${d}`),
  ...JEONSE_WOLSE_RATE_DEPOSITS.map((d) => `/jeonse-wolse-rate/${d}`),
  ...DELAY_DEPOSITS.map((d) => `/delay-interest/${d}`),
  ...PROPERTY_TAX_PRICES.map((p) => `/property-tax/${p}`),
  ...CAPITAL_GAINS_SELL_PRICES.map((p) => `/capital-gains-tax/${p}`),
  ...ACQUISITION_PRICES.map((p) => `/acquisition-tax/${p}`),
  ...RENTAL_YIELD_PRICES.map((p) => `/rental-yield/${p}`),
];

// PARAM_ROUTES stay in SEO_ROUTES on purpose: vite-ssg prerenders from this
// list, and without a static HTML file Vercel would serve the SPA shell for
// these URLs — a soft-404 for crawlers. Never remove them from SEO_ROUTES.
export const SEO_ROUTES = [
  "/",
  "/delay-interest",
  "/jeonse-vs-wolse",
  "/jeonse-risk",
  "/jeonse-wolse-rate",
  "/brokerage-fee",
  "/first-home",
  "/housing-subscription",
  "/property-tax",
  "/capital-gains-tax",
  "/acquisition-tax",
  "/rental-yield",
  "/about",
  "/terms",
  "/privacy",
  ...PARAM_ROUTES,
];

// The sitemap advertises only self-canonical pages; consolidated variants
// canonicalize away and must not be handed to crawlers as entry points.

// 색인 소거(2026-10-16, 사용자 승인): 62일 활성 사용자 8명 미만 + 네이버 TOP 30 밖인 계산기·가이드.
// 도구는 그대로 쓰이고(내부 링크 유지) 사이트맵·색인에서만 뺀다. 네이버 클릭이 월 10+ 되면 다시 넣는다.
// validate-noindex.mjs가 사이트맵 ⇔ noindex 없음 / 사이트맵 밖 self-canonical ⇔ noindex를 빌드마다 대조한다.
export const NOINDEX_ROUTES = ["/brokerage-fee", "/capital-gains-tax", "/first-home", "/housing-subscription", "/jeonse-vs-wolse", "/rental-yield"];
export const SITEMAP_ROUTES = SEO_ROUTES.filter(
  (route) => !PARAM_ROUTES.includes(route) && !NOINDEX_ROUTES.includes(route),
);

// Sitemap priority per listed route. This used to live in build.mjs behind a
// lookup that fell back to 0.5 for anything it did not know, which made it a
// second hand-kept copy of the route list: /jeonse-risk was never added, so a
// full calculator shipped at 0.5 while every sibling sat at 0.8, and nothing
// complained. Keeping the table next to SEO_ROUTES lets the build gate assert
// that the two cover exactly the same routes, so the fallback can go away.
// 색인 소거 라우트(NOINDEX_ROUTES)는 사이트맵에 없으므로 여기에도 없다 — 게이트가 양방향으로 대조한다.
export const SITEMAP_PRIORITIES = {
  "/": "1.0",
  "/delay-interest": "0.8",
  "/jeonse-risk": "0.8",
  "/jeonse-wolse-rate": "0.8",
  "/property-tax": "0.8",
  "/acquisition-tax": "0.9",
  "/about": "0.4",
  "/terms": "0.3",
  "/privacy": "0.3",
};

export const CANONICAL_BASE = "https://shakilabs.com/house";

// cleanUrls redirects "/house/" to "/house", so the home is addressed without a
// trailing slash everywhere. canonical, og:url and the sitemap <loc> must all
// derive the URL through this one helper or the cross-checks end up comparing
// strings that were never meant to match.
export function canonicalUrlFor(route) {
  return route === "/" ? CANONICAL_BASE : `${CANONICAL_BASE}${route}`;
}

// Canonical target of a prerendered route: amount variants point at their base
// calculator (e.g. /property-tax/30000 -> /property-tax); everything else is
// self-canonical.
export function canonicalPathFor(route) {
  return PARAM_ROUTES.includes(route)
    ? route.slice(0, route.lastIndexOf("/"))
    : route;
}
