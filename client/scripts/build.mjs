import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { SEO_ROUTES, SITEMAP_ROUTES } from "./seo-routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const sitemapPath = resolve(projectRoot, "public", "sitemap.xml");
const viteSsgBin = resolve(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vite-ssg.cmd" : "vite-ssg"
);

const basePriority = {
  "/": "1.0",
  "/delay-interest": "0.8",
  "/jeonse-vs-wolse": "0.8",
  "/brokerage-fee": "0.8",
  "/first-home": "0.8",
  "/housing-subscription": "0.8",
  "/property-tax": "0.8",
  "/capital-gains-tax": "0.9",
  "/acquisition-tax": "0.9",
  "/jeonse-wolse-rate": "0.8",
  "/rental-yield": "0.8",
  "/about": "0.4",
  "/terms": "0.3",
  "/privacy": "0.3",
};

function getRouteConfig(path) {
  if (basePriority[path]) {
    return {
      changefreq: path === "/" ? "weekly" : ["about", "terms", "privacy"].some((s) => path.includes(s)) ? "monthly" : "monthly",
      priority: basePriority[path],
    };
  }
  return { changefreq: "monthly", priority: "0.5" };
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
  const baseUrl = "https://shakilabs.com/house";
  const urls = SITEMAP_ROUTES.map((path) => {
    const { changefreq, priority } = getRouteConfig(path);
    const loc = path === "/" ? baseUrl : `${baseUrl}${path}`;
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

const validationResult = spawnSync(
  process.execPath,
  [resolve(projectRoot, "scripts", "validate-static-output.mjs")],
  {
    cwd: projectRoot,
    stdio: "inherit",
  }
);

process.exit(validationResult.status ?? 1);
