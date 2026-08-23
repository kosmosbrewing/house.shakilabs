// The route list exists in four places: the router (source of truth), the
// prerender/sitemap list in seo-routes.mjs, the sitemap priority table, and
// public/llms.txt. Three of those are hand-kept copies, and a copy that drifts
// produces no error anywhere — the page still builds, still prerenders and
// still returns 200 in production. It only disappears from the places crawlers
// read. These gates compare the copies against the router on every build.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SITEMAP_ROUTES,
  SITEMAP_PRIORITIES,
  canonicalUrlFor,
} from "./seo-routes.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Extract the declared paths from the router as { path, redirect } records.
// Extraction failures abort instead of falling back — a gate that silently
// checks zero routes is worse than no gate, because the green log reads as
// proof that the lists agree.
function parseRouterRoutes(source) {
  const start = source.indexOf("export const routes");
  assert(start !== -1,
    "router/index.ts: could not find `export const routes` — route extraction failed");

  const body = source.slice(start);
  const marks = [...body.matchAll(/path:\s*"([^"]+)"/g)].map((match) => ({
    path: match[1],
    index: match.index,
  }));
  assert(marks.length > 0,
    "router/index.ts: no `path:` declarations parsed — route extraction failed");

  return marks.map((mark, i) => ({
    path: mark.path,
    // Everything up to the next `path:` declaration belongs to this route.
    redirect: /redirect:/.test(body.slice(mark.index, marks[i + 1]?.index ?? body.length)),
  }));
}

// Every static route the router registers must be advertised in the sitemap,
// and every redirect route must not be.
//
// Why the first half: add a route, forget to list it, and the URL quietly
// vanishes from the sitemap and drops out of the indexing queue — with no way
// to notice short of counting the XML by hand.
//
// Why the second half: a redirect route has no page of its own, so its
// canonical consolidates elsewhere and listing it hands crawlers a URL that
// immediately points away. Checking only "everything registered must be listed"
// would happily pass the worse state where a route becomes a redirect while its
// sitemap entry stays behind.
function validateRouterRoutesAreListed(projectRoot, sitemapUrls) {
  const routerSource = readFileSync(
    resolve(projectRoot, "src", "router", "index.ts"),
    "utf8"
  );
  const routerRoutes = parseRouterRoutes(routerSource);
  const indexRoute = routerRoutes.find((route) => route.path === "/");

  assert(indexRoute, "router/index.ts must register an index route");
  assert(!indexRoute.redirect,
    "Index route must render its own view: a redirect home canonicalizes to the "
      + "target page, and a page that points its canonical elsewhere cannot be listed");

  for (const route of routerRoutes) {
    // Parameterised and catch-all routes are not static URLs; redirects are
    // excluded by the rule below.
    if (route.redirect || route.path.includes(":")) continue;
    assert(sitemapUrls.has(canonicalUrlFor(route.path)),
      `Router route is missing from the sitemap: ${canonicalUrlFor(route.path)}`);
  }

  for (const route of routerRoutes) {
    if (!route.redirect) continue;
    assert(!sitemapUrls.has(canonicalUrlFor(route.path)),
      `Redirect route must not be listed in the sitemap: ${canonicalUrlFor(route.path)}`);
  }

  return {
    staticCount: routerRoutes.filter((r) => !r.redirect && !r.path.includes(":")).length,
    redirectCount: routerRoutes.filter((route) => route.redirect).length,
  };
}

// Second copy: the sitemap priority table. Checked both ways so a leftover
// entry for a deleted route is caught alongside a missing one.
function validateSitemapPriorities() {
  const declared = Object.keys(SITEMAP_PRIORITIES).sort();
  const listed = [...SITEMAP_ROUTES].sort();
  assert(JSON.stringify(declared) === JSON.stringify(listed),
    "SITEMAP_PRIORITIES must declare exactly the sitemap routes; missing: "
      + `${listed.filter((r) => !declared.includes(r)).join(", ") || "none"}; `
      + `stale: ${declared.filter((r) => !listed.includes(r)).join(", ") || "none"}`);
}

// Third copy: llms.txt, and the one nobody looks at — /jeonse-risk was missing
// from it for as long as the page existed. The home and the policy pages are
// deliberately not link entries there, so only calculator routes are required;
// but every link it does carry must resolve to a sitemap URL, otherwise it
// advertises a page that is gone.
function validateLlmsTxt(distRoot, sitemapUrls) {
  const llms = readFileSync(resolve(distRoot, "llms.txt"), "utf8");
  const linked = new Set(
    [...llms.matchAll(/\]\((https:\/\/shakilabs\.com\/house[^)]*)\)/g)].map((m) => m[1])
  );
  assert(linked.size > 0, "llms.txt: no calculator links parsed — extraction failed");

  const nonCalculatorRoutes = new Set(["/", "/about", "/terms", "/privacy"]);
  for (const route of SITEMAP_ROUTES) {
    if (nonCalculatorRoutes.has(route)) continue;
    assert(linked.has(canonicalUrlFor(route)),
      `Calculator route is missing from llms.txt: ${canonicalUrlFor(route)}`);
  }
  for (const url of linked) {
    assert(sitemapUrls.has(url), `llms.txt links a URL that is not in the sitemap: ${url}`);
  }
  return linked.size;
}

export function validateRouteLists({ projectRoot, distRoot, sitemapUrls }) {
  const { staticCount, redirectCount } = validateRouterRoutesAreListed(projectRoot, sitemapUrls);
  validateSitemapPriorities();
  const llmsLinkCount = validateLlmsTxt(distRoot, sitemapUrls);
  return { staticCount, redirectCount, llmsLinkCount };
}
