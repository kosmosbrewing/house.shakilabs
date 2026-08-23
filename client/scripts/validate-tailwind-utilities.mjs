// Tailwind drops utilities it cannot resolve without saying anything: a slash
// opacity outside the `opacity` scale (5, 10, 20, 25, ... — 8 and 12 are not in
// it) and a colour name the theme never defined both compile clean and simply
// emit no rule. The element then renders with no background at all, which looks
// like a design choice rather than a bug. house shipped `bg-primary/8` on the
// site header of all 66 prerendered pages that way.
//
// The only reliable evidence is the built CSS, so every colour utility written
// in a template is looked up in the emitted stylesheet.
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function collectSourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(full, out);
    else if (/\.(vue|ts)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

const COLOR_PREFIX = "bg|text|border|ring|divide|fill|stroke|outline|placeholder|caret|accent|decoration";
// The lookbehind stops the prefix from matching mid-token: the animation
// utility `slide-in-from-top-4` contains a gradient-looking tail that is not a
// utility of its own, and flagging it would train people to ignore this gate.
const BOUNDARY = "(?<![a-zA-Z0-9-])";
// With a slash opacity — including gradient stops, where the tail is a real
// colour: e.g. a primary background at 12%, or a card background at 92%.
const WITH_OPACITY = new RegExp(
  `${BOUNDARY}(?:[a-z-]+:)*(?:${COLOR_PREFIX}|from|via|to)-[a-z][a-zA-Z0-9-]*\\/(?:\\d+|\\[[0-9.]+%?\\])`, "g"
);
// Without one, to catch colour names the theme never defined. Bare layout and
// typography utilities are not filtered out by name — they resolve to real
// rules, so the CSS lookup clears them on its own.
const PLAIN = new RegExp(
  `${BOUNDARY}(?:[a-z-]+:)*(?:${COLOR_PREFIX})-[a-z][a-zA-Z0-9-]*(?=["'\\s\`]|$)`, "g"
);

// Characters Tailwind escapes when it turns a class name into a selector.
const toSelector = (cls) => cls.replace(/[/[\]%.:]/g, (ch) => `\\${ch}`);

export function validateUtilitiesAreGenerated({ projectRoot, distRoot }) {
  const cssDir = resolve(distRoot, "assets");
  const cssFiles = readdirSync(cssDir).filter((name) => name.endsWith(".css"));
  assert(cssFiles.length > 0, "No built CSS found to validate utilities against");
  const css = cssFiles.map((name) => readFileSync(resolve(cssDir, name), "utf8")).join("\n");

  const files = collectSourceFiles(resolve(projectRoot, "src"));
  assert(files.length > 0, "No source files collected — utility extraction failed");

  const missing = [];
  let checked = 0;
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const found = new Set([...(source.match(WITH_OPACITY) ?? []), ...(source.match(PLAIN) ?? [])]);
    for (const cls of found) {
      checked += 1;
      // A variant-prefixed class keeps the base name in the selector, so match
      // the tail rather than anchoring on the leading dot.
      if (css.includes(`.${toSelector(cls)}`)) continue;
      if (new RegExp(`[.\\\\:]${toSelector(cls).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s,:{>~+\\[]`).test(css)) continue;
      missing.push(`${cls}  (${file.slice(projectRoot.length + 1)})`);
    }
  }

  assert(missing.length === 0,
    "These utilities were written in the templates but produced no CSS rule. "
      + "Off-scale slash opacity needs the arbitrary-value syntax (/[8%]); a colour "
      + "name must exist in tailwind.config.ts:\n  "
      + missing.join("\n  "));
  return checked;
}
