import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
export const clientRoot = resolve(scriptRoot, "..");

// 히어로 수치가 만들어낼 수 있는 문자. 값은 전부 포맷터(formatWon/formatWonShort/
// formatPercent/formatManWon) 출력이고, 카운트업 중간 프레임과 입력에 따라 바뀌는
// 자릿수(`,`가 생겼다 없어진다)는 렌더 한 장에 다 나오지 않아 따로 합친다.
// U+2212(−)는 이 폰트에 글리프가 없어 폴백(Pretendard)이 글리프 단위로 받는다.
export const NUMERAL_CHARACTERS =
  "0123456789,.%+-~/()\u00B7 원억만천조년월일개회건세명점배급시간분초약";

// 브랜드 폰트 문자셋 = 빌드 산출물에서 GmarketSans로 그려지는 텍스트 ∪ 위 숫자셋.
// 소스 grep은 쓰지 않는다(주석·속성까지 세어 과대 수집된다 — docs/BRAND_FONT_SUBSET.md §3).
// 이 파일은 scripts/collect-brand-charset.mjs가 dist에서 만들고, 같은 스크립트의
// --check가 빌드마다 렌더 결과와 대조한다.
const brandCharacters = JSON.parse(
  readFileSync(resolve(scriptRoot, "brand-charset.json"), "utf8")
).characters;

// 제목(font-brand)과 히어로 수치에 쓰는 브랜드 폰트. 전체 UI 문자셋(≈850자)으로
// 자르면 111KB, 렌더 실측 문자셋이면 그 1/7이다.
// 플래그는 --no-hinting 하나뿐이다(레시피 §4) — `--layout-features=''`를 넣으면
// 커널링(GPOS)이 날아간다. 산출물은 이 플래그로도 재현 가능하다(같은 입력 = 같은 sha256).
export const brandFontJob = {
  source: resolve(clientRoot, "public/fonts/GmarketSansBold.woff"),
  output: resolve(clientRoot, "public/fonts/GmarketSansBold-brand-v1.woff2"),
  publicName: "GmarketSansBold-brand-v1.woff2",
  characters: brandCharacters,
  subsetArguments: ["--no-hinting"],
  maxBytes: 24 * 1024,
  preload: false,
};

export const fontJobs = [
  {
    source: resolve(clientRoot, "public/fonts/Pretendard-Regular.woff"),
    output: resolve(clientRoot, "public/fonts/Pretendard-Regular-subset.woff2"),
    publicName: "Pretendard-Regular-subset.woff2",
    maxBytes: 160 * 1024,
    preload: true,
  },
  {
    source: resolve(clientRoot, "public/fonts/Pretendard-SemiBold.woff"),
    output: resolve(clientRoot, "public/fonts/Pretendard-SemiBold-subset.woff2"),
    publicName: "Pretendard-SemiBold-subset.woff2",
    maxBytes: 160 * 1024,
    preload: false,
  },
  {
    source: resolve(clientRoot, "public/fonts/Pretendard-Bold.woff"),
    output: resolve(clientRoot, "public/fonts/Pretendard-Bold-subset.woff2"),
    publicName: "Pretendard-Bold-subset.woff2",
    maxBytes: 160 * 1024,
    preload: true,
  },
  brandFontJob,
];

const textExtensions = new Set([".css", ".html", ".js", ".json", ".mjs", ".ts", ".vue"]);
const contentRoots = [
  resolve(clientRoot, "src"),
  resolve(clientRoot, "scripts"),
  resolve(clientRoot, "index.html"),
  // 공유 UI 패키지에도 화면에 찍히는 한글이 있다(푸터 서비스 목록 등) — 빠지면 두부 글자
  resolve(clientRoot, "node_modules/@shakilabs/ui/dist/index.js"),
];

function listTextFiles(path) {
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(path, entry.name);
    return entry.isDirectory() ? listTextFiles(child) : [child];
  });
}

// 주석은 화면에 찍히지 않는다. 그런데 수집에 섞이면 "왜"를 적는 한국어 주석 하나가
// 서브셋을 바꿔 무관한 작업이 폰트 재생성·해시 게이트에서 멈춘다(반복 발생).
// 문자열 안의 `https://`도 잘리지만 URL은 ASCII라 한글 수집에는 영향이 없다 —
// 위험한 건 과소 수집뿐이므로 제거 전/후 한글 차집합을 검증한다(verify-fonts).
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

export function collectFontCharacters() {
  const characters = new Set();
  for (const path of contentRoots.flatMap(listTextFiles)) {
    if (!textExtensions.has(extname(path))) continue;
    for (const character of stripComments(readFileSync(path, "utf8"))) characters.add(character);
  }
  return [...characters].sort().join("");
}
