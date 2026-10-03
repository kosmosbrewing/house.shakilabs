// Shared formatters for the engine-derived digests.
//
// Every number in a digest sentence is an engine result, so no digit is typed by
// hand inside the prose. Routing all values through these helpers keeps the
// calculator and the prose from drifting apart ("표는 1,511,395원인데 산문은 151만원").
// Korean particles are chosen after the formatter, because "원" and "%" and "배"
// take different ones and a fixed particle would print "원로".

export interface Finding {
  h2: string;
  body: string;
}

// BRIEF-V8 house 결함: 문단이 250자를 넘으면 안 된다. 본문 자체(엔진이 만든 숫자·
// 문장)는 그대로 두고, SeoRichGuide.vue가 렌더링 시점에 이 함수로 ≤200자 문단으로
// 쪼갠다 — 문장 순서·숫자·단어는 하나도 바꾸지 않는다(재배열만).

/**
 * 문장 배열을 ≤maxChars 문단으로 그리디 포장한다. 다음 문장을 더했을 때만
 * maxChars를 넘으면 새 문단을 연다 — 문장은 절대 쪼개지 않는다. 문장 하나가
 * 이미 maxChars를 넘으면(드묾) 그 문장 혼자 한 문단이 된다.
 */
export function chunkSentences(sentences: string[], maxChars = 200): string[] {
  const paragraphs: string[] = [];
  let current = "";
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (current && candidate.length > maxChars) {
      paragraphs.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}

/**
 * 문장 경계("다./요./.)" 뒤에 공백)에서 나눈다. 소수점(4.5%)은 점 뒤에 공백이
 * 없어 안전하게 보존된다.
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 긴 본문 문자열을 문장 경계에서 쪼개 ≤maxChars 문단 배열로 만든다. */
export function chunkText(text: string, maxChars = 200): string[] {
  return chunkSentences(splitSentences(text), maxChars);
}

export function won(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

/** 0.0035 -> "0.35%" */
export function pct(ratio: number, digits = 2): string {
  return `${Number((ratio * 100).toFixed(digits)).toString()}%`;
}

/** A gap between two ratios is %p, not % — "0.4%와 0.5%의 차이 0.1%" reads wrong. */
export function pp(diff: number, digits = 2): string {
  return `${Number((diff * 100).toFixed(digits)).toString()}%p`;
}

/** 1,020,000 -> "102만원", 300,000,000 -> "3억원", 180,000,000 -> "1억 8,000만원" */
export function manwon(value: number): string {
  const sign = value < 0 ? "-" : "";
  const man = Math.round(Math.abs(value) / 10_000);
  if (man < 10_000) return `${sign}${man.toLocaleString("ko-KR")}만원`;
  const eok = Math.floor(man / 10_000);
  const rest = man % 10_000;
  return rest === 0 ? `${sign}${eok}억원` : `${sign}${eok}억 ${rest.toLocaleString("ko-KR")}만원`;
}

/** Signed change ratio between two engine runs: "+16.2%" / "-18.8%" */
export function delta(before: number, after: number, digits = 1): string {
  const ratio = ((after - before) / Math.abs(before)) * 100;
  const sign = ratio > 0 ? "+" : ratio < 0 ? "-" : "";
  return `${sign}${Math.abs(ratio).toFixed(digits)}%`;
}

export function times(a: number, b: number, digits = 1): string {
  return `${(a / b).toFixed(digits)}배`;
}

export function num(value: number, digits = 0): string {
  return Number(value.toFixed(digits)).toLocaleString("ko-KR");
}

/** 1.9 -> "1.9년" */
export function years(value: number): string {
  return `${Number(value.toFixed(2)).toString()}년`;
}

/** 84 -> "84㎡" */
export function squareMeter(value: number): string {
  return `${Number(value.toFixed(2)).toString()}㎡`;
}

function hasFinalConsonant(word: string): boolean {
  const last = word.charCodeAt(word.length - 1);
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  return isHangul && (last - 0xac00) % 28 !== 0;
}

function finalIsRieul(word: string): boolean {
  const last = word.charCodeAt(word.length - 1);
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  return isHangul && (last - 0xac00) % 28 === 8;
}

/** 은/는 */
export function eun(word: string): string {
  return `${word}${hasFinalConsonant(word) ? "은" : "는"}`;
}

/** 을/를 */
export function eul(word: string): string {
  return `${word}${hasFinalConsonant(word) ? "을" : "를"}`;
}

/** 이/가 */
export function ga(word: string): string {
  return `${word}${hasFinalConsonant(word) ? "이" : "가"}`;
}

/** (으)로 */
export function ro(word: string): string {
  return `${word}${hasFinalConsonant(word) && !finalIsRieul(word) ? "으로" : "로"}`;
}

/** 와/과 */
export function wa(word: string): string {
  return `${word}${hasFinalConsonant(word) ? "과" : "와"}`;
}

/** "A·B·C" */
export function list(items: string[]): string {
  return items.join("·");
}
