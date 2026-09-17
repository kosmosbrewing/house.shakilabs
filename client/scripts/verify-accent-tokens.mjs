// 카테고리 액센트 토큰 게이트 (DESIGN_CLEANUP_PLAN_2026-09-17.md §4.2).
// 순수 Node만 쓴다 — 브라우저(playwright 등)를 빌드 게이트에 넣으면 Vercel 빌드
// 이미지가 크로미움을 받아야 한다(§6-10 함정). index.html 소스와 빌드된 CSS를
// 텍스트로 파싱해서 계산만 한다.
//
// 검사 목록:
//  1. --primary/--accent/--secondary 실값이 §2.2 확정 표(house = 주거·자동차
//     그룹, 파랑)와 문자열 일치
//  2. --ring이 브랜드색이 아니라 ink(color.focus, --foreground와 동일)인지 확인.
//     조율자 정정(2026-09-17): 낡은 DESIGN_TOKENS.md "--ring = primary" 공식은
//     이 앱 세대의 정본이 아니다 — v3 §2.1의 color.focus는 color.ink와 같은
//     #0A0A0A/#F5F5F5. 미선언 시 @shakilabs/ui가 조용히 222 47% 20%(슬레이트)로
//     폴백하므로(함정 3) 존재 자체도 확인한다.
//  3. 라이트 --primary L 24~41%, 다크 L 45~72% 밴드 안
//  4. 의미색 4종(success/warning/danger/info)이 v3 고정 hex와 일치
//  5. 로컬 별칭(--fee 등, 2026-09-17에 폐기한 house 전용 빨강)이 빌드 CSS에 없음
//  6. primary vs 카드/캔버스, accent-foreground vs accent 틴트 대비 >= 4.5:1
//     (라이트·다크 각각. 카드·캔버스 색 자체도 index.html --card/--background에서
//     읽어온다 — 하드코딩하면 그 값이 드리프트해도 게이트가 못 잡는다)
//  7. status-warning vs --muted(카드 내부 배경) 대비 >= 4.5:1 — v3 고정 경고색
//     #B45309/#F0B429는 함대 기존값보다 밝아서 muted 위에서 아슬아슬할 수 있다
//     (조율자 함정 2, 다른 그룹에서 미달 실측).
//  8. primary-foreground(on-primary) vs accent 솔리드 면(=--accent-hsl, house는
//     --primary와 동일) 대비 — @shakilabs/ui MemoryControl 토글 트랙처럼 텍스트가
//     아닌 요소에 쓰이므로 WCAG 1.4.11 비텍스트 기준 3:1로 판정한다(조율자 함정 1).
//     house·car는 --accent-hsl을 --primary와 같은 값으로 유지하므로 이 자리에서
//     같은 값끼리 비교해 검증한다 — 대비 검사 행 자체를 지우지 않는다.
//
// 역방향 검증(§4 의무): --primary의 L을 24~41% 밴드 밖으로 1% 옮기고 이 스크립트를
// 돌려 red(비정상 종료)가 되는지 확인한 뒤 원복하고 커밋한다. 통과만 보고하는
// 게이트는 가짜다 — 2026-09-17 구현 시 수행, PR 설명에 결과를 남긴다.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(projectRoot, "dist");
const indexHtmlPath = resolve(projectRoot, "index.html");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ── §2.2 확정 표 — 주거·자동차 그룹(파랑). 재계산하지 않고 계획서 값을 그대로 쓴다.
// --ring은 이 표에 없다: 브랜드 액센트가 아니라 v3 §2.1 color.focus(ink)라서
// --foreground와 같은 값이어야 한다(아래 별도 검사). ──
const EXPECTED_HSL = {
  light: {
    primary: "214 74% 33%",
    accent: "214 72% 95%",
    secondary: "214 15% 91%",
  },
  dark: {
    primary: "213 94% 68%",
    accent: "213 74% 22%",
    secondary: "213 15% 20%",
  },
};

// v3 §2.1 의미색 고정 hex (전 앱 공통).
const EXPECTED_STATUS_HEX = {
  "status-success": { light: "#1b7a4a", dark: "#5dca8e" },
  "status-warning": { light: "#b45309", dark: "#f0b429" },
  "status-danger": { light: "#c62828", dark: "#f07171" },
  "status-info": { light: "#1d4e8c", dark: "#8bb4e8" },
};

// 이번 정리에서 폐기한 house 전용 로컬 별칭. 새 별칭이 또 생기면 여기 추가한다.
const BANNED_ALIASES = ["fee"];
const COLOR_PREFIXES = [
  "bg", "text", "border", "ring", "divide", "fill", "stroke",
  "outline", "placeholder", "caret", "accent", "decoration",
];

// ── HSL 문자열 파싱/변환 유틸 (의존성 없이 직접 구현) ──
function parseHslTriplet(text) {
  const match = /^\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*$/.exec(text);
  assert(match, `HSL triplet expected "H S% L%", got: "${text}"`);
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
}

function hslToRgb({ h, s, l }) {
  const sf = s / 100;
  const lf = l / 100;
  const c = (1 - Math.abs(2 * lf - 1)) * sf;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lf - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (v) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function relativeLuminance({ r, g, b }) {
  const channel = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(rgbA, rgbB) {
  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── 블록 단위 CSS 파서: "SELECTOR {" 뒤 중괄호 깊이를 세어 매칭되는 "}"까지 자른다.
// 중첩 규칙이 없는 커스텀 프로퍼티 블록 전용이라 이 정도로 충분하다(정규식 하나로는
// 같은 선택자가 여러 번 나오는 실제 산출물 구조를 못 잡는다 — 실측으로 확인함). ──
function extractBlocks(css, selectorPattern) {
  const blocks = [];
  const re = new RegExp(`${selectorPattern}\\s*\\{`, "g");
  let match;
  while ((match = re.exec(css)) !== null) {
    const start = match.index + match[0].length;
    let depth = 1;
    let i = start;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth += 1;
      else if (css[i] === "}") depth -= 1;
      i += 1;
    }
    blocks.push(css.slice(start, i - 1));
  }
  return blocks;
}

function parseCustomProperties(blockText) {
  const props = {};
  // 마지막 선언은 세미콜론 없이 블록 끝(문자열 끝)에서 바로 끝날 수 있다 — 빌드된
  // CSS는 압축돼 있어 trailing semicolon을 생략한다(실측으로 확인). ";" 또는
  // 문자열 끝 둘 다 종료 지점으로 받는다.
  const re = /--([\w-]+)\s*:\s*([^;]+?)\s*(?:;|$)/g;
  let match;
  while ((match = re.exec(blockText)) !== null) {
    props[match[1]] = match[2].trim();
  }
  return props;
}

// ── 1) index.html 소스에서 :root / .dark 파싱 ──
assert(existsSync(indexHtmlPath), `index.html not found at ${indexHtmlPath}`);
const indexHtml = readFileSync(indexHtmlPath, "utf8");
const rootBlocks = extractBlocks(indexHtml, ":root");
const darkBlocks = extractBlocks(indexHtml, "\\.dark");
assert(rootBlocks.length > 0, "index.html: no :root { ... } block found");
assert(darkBlocks.length > 0, "index.html: no .dark { ... } block found");

// v3-appshell.css가 --accent-hsl/--accent-muted-hsl을 따로 선언한다(@shakilabs/ui
// 0.3.15 계약 — v3-appshell.css 자체 주석 참조). index.html만 읽으면 이 값을 놓친다.
const appshellCssPath = resolve(projectRoot, "src/assets/css/v3-appshell.css");
const appshellRootBlocks = existsSync(appshellCssPath)
  ? extractBlocks(readFileSync(appshellCssPath, "utf8"), ":root")
  : [];
const appshellDarkBlocks = existsSync(appshellCssPath)
  ? extractBlocks(readFileSync(appshellCssPath, "utf8"), "\\.dark")
  : [];

const rootTokens = Object.assign({}, ...rootBlocks.map(parseCustomProperties), ...appshellRootBlocks.map(parseCustomProperties));
const darkTokens = Object.assign({}, ...darkBlocks.map(parseCustomProperties), ...appshellDarkBlocks.map(parseCustomProperties));

const errors = [];

// ── 2) primary/accent/secondary 문자열 일치 ──
for (const [mode, tokens, expected] of [
  ["light", rootTokens, EXPECTED_HSL.light],
  ["dark", darkTokens, EXPECTED_HSL.dark],
]) {
  for (const [name, expectedValue] of Object.entries(expected)) {
    const actual = tokens[name];
    if (actual !== expectedValue) {
      errors.push(
        `[token] ${mode} --${name}: expected "${expectedValue}", got "${actual ?? "(missing)"}"`
      );
    }
  }
}

// ── 2b) --ring은 브랜드색이 아니라 ink(color.focus)다. --foreground와 같은 값이어야
// 하고, 존재 자체도 확인한다(미선언 시 패키지가 조용히 슬레이트로 폴백 — 함정 3). ──
for (const [mode, tokens] of [
  ["light", rootTokens],
  ["dark", darkTokens],
]) {
  if (!tokens.ring) {
    errors.push(`[ring] ${mode} --ring is not declared (package falls back to slate 222 47% 20% silently)`);
    continue;
  }
  if (tokens.ring !== tokens.foreground) {
    errors.push(
      `[ring] ${mode} --ring "${tokens.ring}" does not match --foreground "${tokens.foreground}" `
        + `(color.focus must equal color.ink per v3 §2.1, not the brand accent)`
    );
  }
}

// ── 3) --primary L 밴드 ──
if (rootTokens.primary) {
  const { l } = parseHslTriplet(rootTokens.primary);
  if (!(l >= 24 && l <= 41)) {
    errors.push(`[band] light --primary L=${l}% is outside the 24-41% band`);
  }
}
if (darkTokens.primary) {
  const { l } = parseHslTriplet(darkTokens.primary);
  if (!(l >= 45 && l <= 72)) {
    errors.push(`[band] dark --primary L=${l}% is outside the 45-72% band`);
  }
}

// ── 4) 빌드된 CSS 수집 (dist/assets/*.css 전부 이어붙인다) ──
assert(existsSync(distRoot), `dist/ not found at ${distRoot} — run the build first`);
const cssDir = resolve(distRoot, "assets");
assert(existsSync(cssDir), `dist/assets not found at ${cssDir}`);
const cssFiles = readdirSync(cssDir).filter((name) => name.endsWith(".css"));
assert(cssFiles.length > 0, "No built CSS found under dist/assets");
const builtCss = cssFiles.map((name) => readFileSync(resolve(cssDir, name), "utf8")).join("\n");

const cssRootBlocks = extractBlocks(builtCss, ":root");
const cssDarkBlocks = extractBlocks(builtCss, "\\.dark");
const cssRootTokens = Object.assign({}, ...cssRootBlocks.map(parseCustomProperties));
const cssDarkTokens = Object.assign({}, ...cssDarkBlocks.map(parseCustomProperties));

// ── 5) 의미색 4종 hex 일치 ──
for (const [varName, expectedHex] of Object.entries(EXPECTED_STATUS_HEX)) {
  for (const [mode, tokens, expected] of [
    ["light", cssRootTokens, expectedHex.light],
    ["dark", cssDarkTokens, expectedHex.dark],
  ]) {
    const raw = tokens[varName];
    if (!raw) {
      errors.push(`[status] ${mode} --${varName} not found in built CSS`);
      continue;
    }
    const actualHex = rgbToHex(hslToRgb(parseHslTriplet(raw))).toLowerCase();
    if (actualHex !== expected) {
      errors.push(`[status] ${mode} --${varName}: expected ${expected}, computed ${actualHex} (from "${raw}")`);
    }
  }
}

// ── 6) 로컬 별칭 부재 확인 ──
for (const alias of BANNED_ALIASES) {
  if (new RegExp(`--${alias}\\s*:`).test(builtCss)) {
    errors.push(`[alias] built CSS still declares --${alias} (should have been deleted)`);
  }
  for (const prefix of COLOR_PREFIXES) {
    const selector = `.${prefix}-${alias}`;
    if (builtCss.includes(`${selector}{`) || builtCss.includes(`${selector} {`)) {
      errors.push(`[alias] built CSS still generates ${selector} (banned local alias "${alias}")`);
    }
  }
}

// ── 7) 대비 검증: primary vs 카드/캔버스, accent-foreground vs accent 틴트 ──
// 카드·캔버스 색은 하드코딩하지 않고 index.html의 --card/--background에서 그대로 읽는다.
for (const [mode, tokens] of [
  ["light", rootTokens],
  ["dark", darkTokens],
]) {
  const primaryRgb = hslToRgb(parseHslTriplet(tokens.primary));
  const cardRgb = hslToRgb(parseHslTriplet(tokens.card));
  const canvasRgb = hslToRgb(parseHslTriplet(tokens.background));
  const accentFgRgb = hslToRgb(parseHslTriplet(tokens["accent-foreground"]));
  const accentRgb = hslToRgb(parseHslTriplet(tokens.accent));

  const primaryVsCard = contrastRatio(primaryRgb, cardRgb);
  const primaryVsCanvas = contrastRatio(primaryRgb, canvasRgb);
  const accentFgVsAccent = contrastRatio(accentFgRgb, accentRgb);

  if (primaryVsCard < 4.5) {
    errors.push(`[contrast] ${mode} primary vs card = ${primaryVsCard.toFixed(2)} (< 4.5)`);
  }
  if (primaryVsCanvas < 4.5) {
    errors.push(`[contrast] ${mode} primary vs canvas = ${primaryVsCanvas.toFixed(2)} (< 4.5)`);
  }
  if (accentFgVsAccent < 4.5) {
    errors.push(`[contrast] ${mode} accent-foreground vs accent tint = ${accentFgVsAccent.toFixed(2)} (< 4.5)`);
  }

  console.log(
    `verify-accent-tokens: ${mode} contrast — primary/card ${primaryVsCard.toFixed(2)}, `
      + `primary/canvas ${primaryVsCanvas.toFixed(2)}, accent-fg/accent ${accentFgVsAccent.toFixed(2)}`
  );
}

// ── 8) status-warning vs --muted (카드 내부 배경). v3 고정 경고색이 함대 기존값보다
// 밝아서 muted 위에서 아슬아슬할 수 있다(조율자 함정 2) — 의미색은 built CSS에서,
// muted는 index.html 소스에서 읽는다. ──
for (const [mode, cssTokens, srcTokens] of [
  ["light", cssRootTokens, rootTokens],
  ["dark", cssDarkTokens, darkTokens],
]) {
  const warningRaw = cssTokens["status-warning"];
  const mutedRaw = srcTokens.muted;
  if (!warningRaw || !mutedRaw) {
    errors.push(`[contrast] ${mode} warning-on-muted: missing --status-warning or --muted to compare`);
    continue;
  }
  const warningVsMuted = contrastRatio(hslToRgb(parseHslTriplet(warningRaw)), hslToRgb(parseHslTriplet(mutedRaw)));
  console.log(`verify-accent-tokens: ${mode} warning-on-muted = ${warningVsMuted.toFixed(2)}`);
  if (warningVsMuted < 4.5) {
    errors.push(`[contrast] ${mode} status-warning vs --muted = ${warningVsMuted.toFixed(2)} (< 4.5)`);
  }
}

// ── 9) primary-foreground(on-primary) vs accent 솔리드 면. @shakilabs/ui의
// --sh-color-accent는 --accent-hsl(house/car는 --primary와 동일 값으로 주입)을 읽고,
// MemoryControl 토글 트랙처럼 비텍스트 요소의 배경으로 쓰인다 — WCAG 1.4.11 3:1 기준
// (조율자 함정 1). --accent-hsl이 --primary와 다르게 드리프트하면 이 자리에서 값
// 불일치로도 잡힌다. ──
for (const [mode, tokens] of [
  ["light", rootTokens],
  ["dark", darkTokens],
]) {
  const accentHsl = tokens["accent-hsl"];
  if (!accentHsl) {
    errors.push(`[contrast] ${mode} --accent-hsl not found (package --sh-color-accent would fall back to --primary silently)`);
    continue;
  }
  if (accentHsl !== tokens.primary) {
    errors.push(
      `[contrast] ${mode} --accent-hsl "${accentHsl}" no longer matches --primary "${tokens.primary}" — `
        + `re-derive the on-primary-vs-accent-solid check below against the real value`
    );
  }
  const onPrimaryRgb = hslToRgb(parseHslTriplet(tokens["primary-foreground"]));
  const accentSolidRgb = hslToRgb(parseHslTriplet(accentHsl));
  const nonTextRatio = contrastRatio(onPrimaryRgb, accentSolidRgb);
  console.log(`verify-accent-tokens: ${mode} on-primary vs accent-solid (non-text, WCAG 1.4.11 >= 3:1) = ${nonTextRatio.toFixed(2)}`);
  if (nonTextRatio < 3) {
    errors.push(`[contrast] ${mode} primary-foreground vs accent-solid = ${nonTextRatio.toFixed(2)} (< 3, WCAG 1.4.11)`);
  }
}

if (errors.length > 0) {
  console.error("verify-accent-tokens: FAILED");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log("verify-accent-tokens: OK — primary/accent/secondary match §2.2, ring is ink (color.focus), "
  + "L bands in range, status colours match v3 hex, no banned local alias, all contrast checks pass.");
