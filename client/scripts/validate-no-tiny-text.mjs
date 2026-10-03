// BRIEF-V8 house 결함: 13px 미만 글자(차트 범례 12px 제외)가 소스에 남아 있으면
// 안 된다. 선언 단위 검사가 아니라 — Tailwind 임의값 클래스와 CSS 미디어 규칙을
// 직접 긁어 N<12px(또는 0.6~0.7rem대) 유틸리티, 그리고 @media 안에서 !important로
// 13px 미만 font-size를 강제하는 규칙을 찾는다. "차트" 디렉터리(파일명·경로에
// chart가 들어간 것) 안의 눈금·범례 텍스트만 12px을 허용한다.
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isChartPath(path) {
  return /chart/i.test(path);
}

function collectFiles(dir, exts, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, exts, out);
    else if (exts.some((ext) => entry.name.endsWith(ext)) && !/\.test\.ts$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

// text-[Npx] with N<12 (10px·11px 등 — 12px은 차트 눈금 허용치라 통과시킨다)
const PX_BRACKET = /text-\[(\d+(?:\.\d+)?)px\]/g;
// text-[0.6xxxrem] ~ text-[0.7xxxrem] — 대략 9.6~12.8px, 13px 미만 임의값의 주류
const REM_BRACKET = /text-\[0\.[67]\d*rem\]/g;
// Tailwind 기본 text-xs(0.75rem=12px)도 13px 하한 미달
const TEXT_XS = /(?<![a-zA-Z0-9-])text-xs(?![a-zA-Z0-9-])/g;

export function validateNoTinyTextUtilities({ projectRoot }) {
  const srcDir = resolve(projectRoot, "src");
  const files = collectFiles(srcDir, [".vue", ".ts"]);
  assert(files.length > 0, "No source files collected — tiny-text scan failed");

  const violations = [];
  let checked = 0;

  for (const file of files) {
    const rel = file.slice(projectRoot.length + 1);
    const chartExempt = isChartPath(rel);
    const source = readFileSync(file, "utf8");

    for (const m of source.matchAll(PX_BRACKET)) {
      checked += 1;
      const n = Number(m[1]);
      if (chartExempt && n >= 12) continue;
      if (n < 12) violations.push(`${rel}: ${m[0]} (<12px)`);
    }
    for (const m of source.matchAll(REM_BRACKET)) {
      checked += 1;
      if (chartExempt) continue;
      violations.push(`${rel}: ${m[0]} (~${Math.round(parseFloat(m[0].match(/[\d.]+/)[0]) * 16 * 10) / 10}px)`);
    }
    for (const m of source.matchAll(TEXT_XS)) {
      checked += 1;
      if (chartExempt) continue;
      violations.push(`${rel}: ${m[0]} (0.75rem = 12px)`);
    }
  }

  // CSS: @media 블록 안에서 font-size를 13px 미만으로 !important 강제하는 규칙.
  // 중첩이 얕다는 전제로 중괄호 깊이만 추적한다(이 저장소의 CSS 관례와 일치).
  const cssFiles = collectFiles(srcDir, [".css"]);
  for (const file of cssFiles) {
    const rel = file.slice(projectRoot.length + 1);
    if (isChartPath(rel)) continue;
    const source = readFileSync(file, "utf8");
    let depth = 0;
    let mediaDepth = null;
    for (const line of source.split("\n")) {
      checked += 1;
      if (/@media/.test(line) && mediaDepth === null) mediaDepth = depth;
      for (const ch of line) {
        if (ch === "{") depth += 1;
        else if (ch === "}") {
          depth -= 1;
          if (mediaDepth !== null && depth <= mediaDepth) mediaDepth = null;
        }
      }
      if (mediaDepth === null) continue;
      const decl = line.match(/font-size:\s*([\d.]+)(px|rem)\s*!important/);
      if (!decl) continue;
      const px = decl[2] === "rem" ? parseFloat(decl[1]) * 16 : parseFloat(decl[1]);
      if (px < 13) violations.push(`${rel}: "${line.trim()}" (${px}px !important inside @media)`);
    }
  }

  assert(
    violations.length === 0,
    "Tiny text utilities (<13px outside chart dirs) found — raise to text-caption " +
      "(13px) or the app's ≥13px token:\n  " + violations.join("\n  ")
  );
  return checked;
}
