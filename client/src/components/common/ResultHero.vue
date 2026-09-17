<script setup lang="ts">
// 계산기 대표 수치의 단일 문법(BL-020, docs/RESULT_DESIGN_BACKLOG):
// 라벨(13px muted) → 금액(text-display 26px, font-brand = GmarketSans, tabular-nums)
// → 선택적 보조 문장(14px muted). 브랜드/의미색은 이 히어로 수치에만 쓰고
// 아래 stat 그리드 값은 중립색으로 남긴다.
//
// 카운트업은 여기에만 있다. 뷰마다 rAF를 복사하지 마라 — 8개 계산기가 같은
// 구현을 쓴다. 규칙(v3 디자인 시스템 8.6, 참조 구현 02.finance ResultHero.vue):
//  - 트리거는 두 가지다. (1) 페이지 로드 1회(0에서 시작) (2) 포맷된 문자열이
//    바뀔 때. 테마 토글·리사이즈, 그리고 같은 숫자로 끝나는 재계산은 재실행하지 않는다.
//  - displayValue는 최종 포맷값으로 초기화한다. 그래서 프리렌더 HTML과 첫
//    클라이언트 렌더 모두 완성된 숫자를 보여준다(0이 아니다). 로드 카운트업은
//    값이 조용해진 뒤(SETTLE_MS) 시작한다.
//  - 값이 바뀌면 화면에 찍혀 있던 숫자에서 새 값으로 700ms ease-out. 애니메이션
//    도중 값이 또 바뀌면 0이 아니라 현재 표시값에서 이어간다.
//  - prefers-reduced-motion이면 애니메이션 없이 즉시 최종값.
//  - 숫자가 없는 값(판정 문구 등)은 그대로 정적 표시.
//
// BL-020에서 마운트 애니메이션을 뺐던 이유는 하이드레이션 직후 재계산이 끼어들어
// `-121,973원`·`+-13,841원` 같은 프레임이 스쳤기 때문이다. 재현해 보니 진짜 원인은
// **rAF 진행도에 하한이 없던 것**이었다(아래 step() 주석). 그래서 금지 대신 고쳤다.
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    value: string;
    /** 의미색 유틸리티. 위험 상태가 없으면 액센트(text-primary), 한도 초과 등 진짜
     * 위험 상태면 text-status-danger — 계산기마다 다르다(2026-09-17 --fee 별칭 폐기) */
    valueClass?: string;
  }>(),
  { valueClass: "text-primary" }
);

const displayValue = ref(props.value);

const DURATION_MS = 700;
let rafId: number | null = null;
// 화면에 찍혀 있는 숫자. 애니메이션 도중 값이 바뀌어도 여기서 이어간다
let liveNumbers: number[] | null = null;

type Part = { text: string } | { value: number; decimals: number; grouped: boolean };

// "3,456,789원" -> [{value: 3456789, ...}, {text: "원"}]
// 문자열 안의 모든 숫자 구간이 비례해서 움직이고 접두/접미/부호는 그대로 통과한다.
function tokenize(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const match of text.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: text.slice(last, index) });
    const raw = match[0];
    parts.push({
      value: Number(raw.replace(/,/g, "")),
      decimals: raw.includes(".") ? raw.split(".")[1].length : 0,
      grouped: raw.includes(","),
    });
    last = index + raw.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

function numbersOf(parts: Part[]): number[] {
  return parts.filter((p): p is Exclude<Part, { text: string }> => "value" in p).map((p) => p.value);
}

function formatRun(value: number, part: { decimals: number; grouped: boolean }): string {
  const fixed = part.decimals > 0 ? value.toFixed(part.decimals) : String(Math.round(value));
  if (!part.grouped) return fixed;
  const [intPart, fracPart] = fixed.split(".");
  const grouped = Number(intPart).toLocaleString("ko-KR");
  return fracPart ? `${grouped}.${fracPart}` : grouped;
}

function renderParts(parts: Part[], numbers: number[]): string {
  let i = 0;
  return parts.map((p) => ("text" in p ? p.text : formatRun(numbers[i++], p))).join("");
}

function prefersReducedMotion(): boolean {
  return (
    typeof window === "undefined" ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function cancelRaf(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function animateTo(finalText: string, from: number[]): void {
  cancelRaf();
  const parts = tokenize(finalText);
  const targets = numbersOf(parts);
  if (targets.length === 0 || from.length !== targets.length || prefersReducedMotion()) {
    liveNumbers = targets;
    displayValue.value = finalText;
    return;
  }
  const start = performance.now();
  const step = (now: number): void => {
    // rAF 콜백의 타임스탬프는 **프레임 시작 시각**이라 직전에 찍은 performance.now()보다
    // 이를 수 있다. 하한을 안 걸면 progress가 음수가 되고 ease-out 곡선이 음수를 돌려줘
    // 첫 프레임에 `-24,127원`처럼 부호가 뒤집힌 값이 스친다(실측으로 확인).
    const progress = Math.min(1, Math.max(0, (now - start) / DURATION_MS));
    const eased = 1 - (1 - progress) ** 3; // ease-out cubic
    if (progress < 1) {
      liveNumbers = targets.map((t, i) => from[i] + (t - from[i]) * eased);
      displayValue.value = renderParts(parts, liveNumbers);
      rafId = requestAnimationFrame(step);
      return;
    }
    liveNumbers = targets;
    displayValue.value = finalText; // 마지막 프레임은 원본 문자열 그대로 — 포맷 드리프트 방지
    rafId = null;
  };
  rafId = requestAnimationFrame(step);
}

// 첫 값으로 화면 숫자를 심는다. 첫 페인트는 최종값 그대로다(프리렌더 HTML과 일치해야 한다).
// 로드 카운트업은 마운트 뒤에 시작한다.
liveNumbers = numbersOf(tokenize(props.value));

// 로드할 때마다 0에서 올라온다.
//
// 값이 확정되기 전에 시작하면 과도 값을 향해 달려간다 — 하이드레이션 직후 한 번 더
// 계산하는 라우트가 있기 때문이다. 그래서 **값이 조용해진 뒤에** 센다. 값이 바뀔 때마다
// 타이머를 다시 걸고 SETTLE_MS 동안 변화가 없으면 그때 0에서 최종값으로 한 번 센다.
// 그 전까지는 애니메이션 없이 즉시 표시해 과도 값이 화면에 머물지 않게 한다.
const SETTLE_MS = 220;
let loadAnimationDone = false;
let settleTimer: ReturnType<typeof setTimeout> | null = null;

function clearSettleTimer(): void {
  if (settleTimer !== null) {
    clearTimeout(settleTimer);
    settleTimer = null;
  }
}

function armLoadAnimation(): void {
  clearSettleTimer();
  settleTimer = setTimeout(() => {
    settleTimer = null;
    if (loadAnimationDone) return;
    loadAnimationDone = true;
    const targets = numbersOf(tokenize(props.value));
    if (targets.length === 0) return;
    animateTo(
      props.value,
      targets.map(() => 0)
    );
  }, SETTLE_MS);
}

onMounted(() => {
  if (prefersReducedMotion()) {
    loadAnimationDone = true;
    return;
  }
  armLoadAnimation();
});

watch(
  () => props.value,
  (next, previous) => {
    // 포맷 문자열이 같으면 화면상 달라진 게 없다 → 애니메이션 없음(8.6)
    if (next === previous) return;
    if (!loadAnimationDone) {
      // 아직 값이 확정되지 않았다. 과도 값을 향해 세지 않고 즉시 표시만 하고,
      // 조용해질 때까지 로드 애니메이션을 미룬다.
      cancelRaf();
      liveNumbers = numbersOf(tokenize(next));
      displayValue.value = next;
      armLoadAnimation();
      return;
    }
    animateTo(next, liveNumbers ?? []);
  }
);

onBeforeUnmount(() => {
  cancelRaf();
  clearSettleTimer();
});
</script>

<template>
  <div data-result-hero class="text-center py-3">
    <p class="text-caption uppercase tracking-wide text-muted-foreground mb-1">{{ label }}</p>
    <p class="text-display font-bold font-brand tabular-nums" :class="valueClass">
      {{ displayValue }}
    </p>
    <p v-if="$slots.secondary" class="text-body text-muted-foreground mt-1.5">
      <slot name="secondary" />
    </p>
  </div>
</template>
