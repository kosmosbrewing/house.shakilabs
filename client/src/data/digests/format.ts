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
