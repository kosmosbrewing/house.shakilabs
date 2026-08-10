import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEO_ROUTES,
  SITEMAP_ROUTES,
  PARAM_ROUTES,
  canonicalPathFor,
} from "./seo-routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const repositoryRoot = resolve(projectRoot, "..");
const distRoot = resolve(projectRoot, "dist");
const canonicalBase = "https://shakilabs.com/house";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function routeOutputPath(route) {
  return route === "/"
    ? resolve(distRoot, "index.html")
    : resolve(distRoot, `${route.slice(1)}.html`);
}

function validateVercelConfig(configPath) {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const indexRewrites = (config.rewrites ?? []).filter(
    (rewrite) => rewrite.destination === "/index.html"
  );

  assert(config.cleanUrls === true, `${configPath}: cleanUrls must be true`);
  assert(indexRewrites.length === 0, `${configPath}: index.html catch-all rewrite is forbidden`);
}

function validateRoute(route) {
  const outputPath = routeOutputPath(route);
  assert(existsSync(outputPath), `Missing static output for ${route}: ${outputPath}`);

  const html = readFileSync(outputPath, "utf8");
  // Amount variants must canonicalize to their base calculator (doorway
  // consolidation); every other route stays self-canonical.
  const canonicalPath = canonicalPathFor(route);
  const expectedCanonical =
    canonicalPath === "/" ? canonicalBase : `${canonicalBase}${canonicalPath}`;

  assert(html.includes(`<link rel="canonical" href="${expectedCanonical}">`),
    `Invalid canonical for ${route}: expected ${expectedCanonical}`);
  // og:url and hreflang must agree with canonical, otherwise the consolidation
  // signal is contradicted by the very tags crawlers cross-check.
  assert(html.includes(`<meta property="og:url" content="${expectedCanonical}">`),
    `og:url must match canonical for ${route}: expected ${expectedCanonical}`);
  // noindex would fight the canonical signal — consolidated variants stay
  // indexable and simply defer to their base page.
  assert(!/name="robots" content="noindex/.test(html),
    `Consolidated routes must not be noindex: ${route}`);
  assert(/<title>[^<]+<\/title>/.test(html), `Missing title for ${route}`);
  assert(html.includes('id="app"'), `Missing app root for ${route}`);

  // The shell noscript fallback carries its own <h1>; if build.mjs ever stops
  // stripping it, every static page silently ships two headings again.
  assert(!/<noscript>/i.test(html),
    `Rendered route must not retain the shell noscript: ${route}`);
  const h1Count = html.match(/<h1\b/gi)?.length ?? 0;
  assert(h1Count === 1, `Expected one H1 for ${route}, found ${h1Count}`);

  // 404에서 로더를 걷어내는 정규식이 지나치게 넓어지면 정상 라우트의 광고까지
  // 조용히 사라진다. 수익 배선이 살아 있는지 반대 방향으로도 못 박는다.
  assert(/pagead2\.googlesyndication\.com/.test(html),
    `Content route must keep the AdSense loader: ${route}`);
}

function validateSitemap() {
  const sitemap = readFileSync(resolve(distRoot, "sitemap.xml"), "utf8");
  const actualUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expectedUrls = SITEMAP_ROUTES.map((route) =>
    route === "/" ? canonicalBase : `${canonicalBase}${route}`
  );
  const variantUrls = new Set(
    PARAM_ROUTES.map((route) => `${canonicalBase}${route}`)
  );

  assert(JSON.stringify(actualUrls) === JSON.stringify(expectedUrls),
    "Sitemap must contain exactly the self-canonical routes");
  assert(actualUrls.every((url) => !variantUrls.has(url)),
    "Sitemap must not list canonicalized amount-variant routes");
}

validateVercelConfig(resolve(repositoryRoot, "vercel.json"));
validateVercelConfig(resolve(projectRoot, "vercel.json"));
// validateRoute also runs for PARAM_ROUTES: their static HTML must keep
// existing (soft-404 guard) even though they are absent from the sitemap.
SEO_ROUTES.forEach(validateRoute);
validateSitemap();

const notFoundPath = resolve(distRoot, "404.html");
assert(existsSync(notFoundPath), "Missing custom 404.html output");
const notFoundHtml = readFileSync(notFoundPath, "utf8");
assert(notFoundHtml.includes('content="noindex,nofollow"'), "404.html must be noindex,nofollow");
assert(!/<noscript>/i.test(notFoundHtml), "404.html must not retain the shell noscript");
// 콘텐츠가 없는 화면의 광고는 Google Valuable Inventory 정책 위반이다. noindex는 색인만
// 막을 뿐 정책은 로더의 존재로 판단하고, 로더가 실리면 자동 광고가 슬롯을 직접 심는다.
assert(!/adsbygoogle|googlesyndication/i.test(notFoundHtml),
  "404.html must not load the AdSense script (Valuable Inventory policy)");
assert(notFoundHtml.includes('href="/house'), "404.html must contain a recovery link");

console.log(
  `Validated ${SEO_ROUTES.length} prerendered routes ` +
    `(${SITEMAP_ROUTES.length} sitemap + ${PARAM_ROUTES.length} canonicalized variants) ` +
    "and custom 404 output."
);
