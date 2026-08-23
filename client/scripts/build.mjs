import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  SEO_ROUTES,
  SITEMAP_ROUTES,
  SITEMAP_PRIORITIES,
  canonicalUrlFor,
} from "./seo-routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const sitemapPath = resolve(projectRoot, "public", "sitemap.xml");
const viteSsgBin = resolve(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vite-ssg.cmd" : "vite-ssg"
);

// No fallback branch on purpose: an unknown route used to silently ship at 0.5,
// which is how /jeonse-risk ended up ranked below every sibling calculator.
// validate-static-output.mjs asserts SITEMAP_PRIORITIES covers SITEMAP_ROUTES,
// so a missing entry is a build failure instead of a quiet demotion.
function getRouteConfig(path) {
  const priority = SITEMAP_PRIORITIES[path];
  if (!priority) {
    throw new Error(`No sitemap priority declared for ${path} (see scripts/seo-routes.mjs)`);
  }
  return { changefreq: path === "/" ? "weekly" : "monthly", priority };
}

function resolveBuildDate() {
  const candidate = process.env.BUILD_DATE?.trim();
  if (candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    return candidate;
  }

  return new Date().toISOString().slice(0, 10);
}

function renderSitemap(buildDate) {
  // Amount-variant routes (PARAM_ROUTES) are intentionally absent: they
  // canonicalize to their base calculator, so advertising them would point
  // crawlers at URLs that immediately hand ranking signals elsewhere.
  const urls = SITEMAP_ROUTES.map((path) => {
    const { changefreq, priority } = getRouteConfig(path);
    const loc = canonicalUrlFor(path);
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${buildDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function routeOutputPath(route) {
  return route === "/"
    ? resolve(projectRoot, "dist", "index.html")
    : resolve(projectRoot, "dist", `${route.slice(1)}.html`);
}

// index.html carries a no-JS fallback <noscript> for the SPA shell, and
// vite-ssg copies that template into every prerendered page. On a prerendered
// route the real content is already in the HTML, so the leftover fallback only
// duplicates the page heading — every route shipped two <h1> elements. Strip it
// after the render so each static page keeps exactly one H1.
function removeRenderedNoscriptFallbacks() {
  for (const route of [...SEO_ROUTES, "/404"]) {
    const outputPath = routeOutputPath(route);
    if (!existsSync(outputPath)) continue;

    const html = readFileSync(outputPath, "utf8");
    writeFileSync(
      outputPath,
      html.replace(/\n?\s*<noscript>[\s\S]*?<\/noscript>/i, ""),
      "utf8"
    );
  }
}

// Google "Valuable Inventory": 게시자 콘텐츠가 없는 화면에는 광고를 두면 안 된다.
// 404는 다른 모든 라우트와 같은 셸에서 만들어지므로 index.html의 AdSense 로더를
// 그대로 물려받는다. NotFoundView 자체에는 AdSlot이 없지만, 로더만 실려도 AdSense
// 자동 광고가 본문 58자짜리 화면에 ins 슬롯을 직접 심는다(라이브 실측 ins=1).
// noindex는 색인만 막을 뿐이고 정책은 로더의 존재 여부로 판단하므로, 404 산출물에서만
// 로더 태그를 걷어낸다. 정상 라우트의 광고 배선은 건드리지 않는다.
function removeAdsenseLoaderFromNotFound() {
  const outputPath = routeOutputPath("/404");
  if (!existsSync(outputPath)) return;

  const html = readFileSync(outputPath, "utf8");
  writeFileSync(
    outputPath,
    html.replace(
      /\n?\s*<script[^>]*(?:pagead2\.googlesyndication\.com|adsbygoogle\.js)[^>]*><\/script>/gi,
      ""
    ),
    "utf8"
  );
}

const buildDate = resolveBuildDate();

mkdirSync(dirname(sitemapPath), { recursive: true });
writeFileSync(sitemapPath, renderSitemap(buildDate), "utf8");

const result = spawnSync(viteSsgBin, ["build"], {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    BUILD_DATE: buildDate,
  },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

removeRenderedNoscriptFallbacks();
removeAdsenseLoaderFromNotFound();

const validationResult = spawnSync(
  process.execPath,
  [resolve(projectRoot, "scripts", "validate-static-output.mjs")],
  {
    cwd: projectRoot,
    stdio: "inherit",
  }
);

process.exit(validationResult.status ?? 1);
