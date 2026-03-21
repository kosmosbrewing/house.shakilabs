import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  SEO_ROUTES,
  BROKERAGE_PRICES,
  JEONSE_DEPOSITS,
  JEONSE_WOLSE_RATE_DEPOSITS,
  DELAY_DEPOSITS,
  PROPERTY_TAX_PRICES,
  CAPITAL_GAINS_SELL_PRICES,
  ACQUISITION_PRICES,
  RENTAL_YIELD_PRICES,
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

const paramPaths = new Set([
  ...BROKERAGE_PRICES.map((p) => `/brokerage-fee/${p}`),
  ...JEONSE_DEPOSITS.map((d) => `/jeonse-vs-wolse/${d}`),
  ...JEONSE_WOLSE_RATE_DEPOSITS.map((d) => `/jeonse-wolse-rate/${d}`),
  ...DELAY_DEPOSITS.map((d) => `/delay-interest/${d}`),
  ...PROPERTY_TAX_PRICES.map((p) => `/property-tax/${p}`),
  ...CAPITAL_GAINS_SELL_PRICES.map((p) => `/capital-gains-tax/${p}`),
  ...ACQUISITION_PRICES.map((p) => `/acquisition-tax/${p}`),
  ...RENTAL_YIELD_PRICES.map((p) => `/rental-yield/${p}`),
]);

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
  if (paramPaths.has(path)) {
    return { changefreq: "monthly", priority: "0.7" };
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
  const baseUrl = "https://shakilabs.com/house";
  const urls = SEO_ROUTES.map((path) => {
    const { changefreq, priority } = getRouteConfig(path);
    const loc = path === "/" ? `${baseUrl}/` : `${baseUrl}${path}`;
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

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
