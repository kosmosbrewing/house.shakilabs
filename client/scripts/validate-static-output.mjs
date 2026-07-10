import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SEO_ROUTES } from "./seo-routes.mjs";

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
  const expectedCanonical = route === "/" ? canonicalBase : `${canonicalBase}${route}`;

  assert(html.includes(`<link rel="canonical" href="${expectedCanonical}">`),
    `Invalid canonical for ${route}: expected ${expectedCanonical}`);
  assert(/<title>[^<]+<\/title>/.test(html), `Missing title for ${route}`);
  assert(html.includes('id="app"'), `Missing app root for ${route}`);
}

validateVercelConfig(resolve(repositoryRoot, "vercel.json"));
validateVercelConfig(resolve(projectRoot, "vercel.json"));
SEO_ROUTES.forEach(validateRoute);

const notFoundPath = resolve(distRoot, "404.html");
assert(existsSync(notFoundPath), "Missing custom 404.html output");
const notFoundHtml = readFileSync(notFoundPath, "utf8");
assert(notFoundHtml.includes('content="noindex,nofollow"'), "404.html must be noindex,nofollow");

console.log(`Validated ${SEO_ROUTES.length} SEO routes and custom 404 output.`);
