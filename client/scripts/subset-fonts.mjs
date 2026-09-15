import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { clientRoot, collectFontCharacters, fontJobs } from "./font-subset-config.mjs";

const characters = collectFontCharacters();
const temporaryRoot = mkdtempSync(join(tmpdir(), "shakilabs-fonts-"));
const characterFile = resolve(temporaryRoot, "characters.txt");
const manifestPath = resolve(clientRoot, "scripts/font-subset-manifest.json");

// 산출물에 실제로 들어간 글리프를 fontTools로 읽는다. 여기서만 파이썬을 부른다 —
// 이 스크립트는 사람이 직접 돌리는 생성기라 fontTools가 있고, 빌드 게이트가 도는
// Vercel·CI에는 없다. 그래서 "무엇이 담겼나"를 여기서 확정해 매니페스트에 적고,
// 게이트는 그 기록과 sha256으로 판정한다.
// document.fonts.check()는 쓰지 않는다 — 이 환경 Chromium은 무엇을 물어도 true다.
function readShippedCharacters(fontPath) {
  const result = spawnSync("python3", [
    "-c",
    "import sys, json\nfrom fontTools.ttLib import TTFont\nprint(json.dumps(sorted(TTFont(sys.argv[1]).getBestCmap())))",
    fontPath,
  ], { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error(`Cannot read cmap of ${fontPath}: ${result.error?.message ?? result.stderr.trim()}`);
  }
  return new Set(JSON.parse(result.stdout).map((code) => String.fromCodePoint(code)));
}

// 요청한 문자 중 산출물에 없는 것 = 원본 폰트에 글리프가 없는 문자다(이모지 등).
// 글리프 단위 폴백이 정상 동작이라 실패시키지 않되, 조용히 넘기지 않고 기록한다.
function describeSubsetCoverage(fontJob) {
  const shipped = readShippedCharacters(fontJob.output);
  const requested = [...fontJob.characters];
  const dropped = requested.filter((character) => !shipped.has(character));
  const sourceCharacters = readShippedCharacters(fontJob.source);
  const unexpected = dropped.filter((character) => sourceCharacters.has(character));
  if (unexpected.length > 0) {
    throw new Error(`${fontJob.publicName} dropped ${unexpected.length} glyphs the source font has: ${unexpected.join("")}`);
  }
  if (dropped.length > 0) {
    console.warn(`${fontJob.publicName}: ${dropped.join("")} absent from the source font (per-glyph fallback).`);
  }
  return {
    shippedCharacters: requested.filter((character) => shipped.has(character)).join(""),
    droppedCharacters: dropped.join(""),
  };
}

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}

try {
  writeFileSync(characterFile, characters);
  const fonts = fontJobs.map((fontJob) => {
    // 잡이 자기 문자셋을 선언하면 그것만 쓴다 — 숫자 전용 폰트를 UI 전체 한글로
    // 자르면 15KB짜리가 111KB가 된다.
    let jobCharacterFile = characterFile;
    if (fontJob.characters) {
      jobCharacterFile = resolve(temporaryRoot, `${fontJob.publicName}.txt`);
      writeFileSync(jobCharacterFile, fontJob.characters);
    }
    // 잡이 플래그를 선언하면 그것만 쓴다. 브랜드 폰트는 레시피 §4대로 --no-hinting
    // 하나뿐이다 — 아래 기본 플래그 뭉치는 Pretendard 서브셋이 쓰던 것이고,
    // 브랜드 폰트에까지 그대로 얹으면 레시피와 산출물이 어긋난다.
    const result = spawnSync("python3", [
      "-m",
      "fontTools.subset",
      fontJob.source,
      `--text-file=${jobCharacterFile}`,
      `--output-file=${fontJob.output}`,
      "--flavor=woff2",
      ...(fontJob.subsetArguments ?? [
        "--layout-features=*",
        "--name-IDs=*",
        "--name-legacy",
        "--name-languages=*",
        "--notdef-glyph",
        "--notdef-outline",
        "--recommended-glyphs",
        "--no-recalc-timestamp",
        "--drop-tables+=FFTM",
      ]),
    ], { encoding: "utf8" });

    if (result.error || result.status !== 0) {
      const detail = result.error?.message ?? result.stderr.trim();
      throw new Error(`Font subsetting failed for ${fontJob.publicName}: ${detail}`);
    }

    const content = readFileSync(fontJob.output);
    return {
      publicName: fontJob.publicName,
      bytes: content.byteLength,
      sha256: hash(content),
      // 자기 문자셋을 선언한 잡(브랜드 폰트)만 "실제로 담긴 글자"를 기록한다.
      // 빌드 게이트는 fontTools 없이 이 기록으로 커버리지를 판정한다.
      ...(fontJob.characters ? describeSubsetCoverage(fontJob) : {}),
    };
  });

  const manifest = {
    schemaVersion: 2,
    characterCount: [...characters].length,
    characterSha256: hash(characters),
    fonts,
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Generated ${fonts.length} fonts for ${manifest.characterCount} characters.`);
} finally {
  rmSync(temporaryRoot, { force: true, recursive: true });
}
