<script setup lang="ts">
// 계산기 대표 수치의 단일 문법(BL-020, docs/RESULT_DESIGN_BACKLOG):
// 라벨(13px muted) → 금액(text-display 26px, font-numeral = GmarketSans, tabular-nums)
// → 선택적 보조 문장(14px muted). 브랜드/의미색은 이 히어로 수치에만 쓰고
// 아래 stat 그리드 값은 중립색으로 남긴다.
//
// 카운트업은 여기에만 있다. 뷰마다 rAF를 복사하지 마라 — 8개 계산기가 같은
// 구현을 쓴다. 규칙(v3 디자인 시스템 8.6, 참조 구현 02.finance ResultHero.vue):
//  - 유일한 트리거는 "포맷된 문자열이 바뀔 때". 로드·하이드레이션·테마 토글·
//    리사이즈, 그리고 같은 숫자로 끝나는 재계산은 재실행하지 않는다.
//  - displayValue는 최종 포맷값으로 초기화한다. 그래서 프리렌더 HTML과 첫
//    클라이언트 렌더 모두 완성된 숫자를 보여준다(0이 아니다).
//  - 값이 바뀌면 화면에 찍혀 있던 숫자에서 새 값으로 700ms ease-out. 애니메이션
//    도중 값이 또 바뀌면 0이 아니라 현재 표시값에서 이어간다.
//  - prefers-reduced-motion이면 애니메이션 없이 즉시 최종값.
//  - 숫자가 없는 값(예: "법정 상한 초과" 같은 판정 문구)은 그대로 정적 표시.
import { onBeforeUnmount, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    value: string;
    /** 의미색 유틸리티. 계산기마다 세금=text-fee, 수익률=text-primary 등으로 다르다 */
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
    const progress = Math.min(1, (now - start) / DURATION_MS);
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

// 첫 값으로 화면 숫자를 심는다. 여기서는 애니메이션하지 않는다 — 첫 페인트는 이미 최종값이다.
liveNumbers = numbersOf(tokenize(props.value));

watch(
  () => props.value,
  (next, previous) => {
    // 포맷 문자열이 같으면 화면상 달라진 게 없다 → 애니메이션 없음(8.6)
    if (next === previous) return;
    animateTo(next, liveNumbers ?? []);
  }
);

onBeforeUnmount(cancelRaf);
</script>

<template>
  <div data-result-hero class="text-center py-3">
    <p class="text-caption uppercase tracking-wide text-muted-foreground mb-1">{{ label }}</p>
    <p class="text-display font-bold font-numeral tabular-nums" :class="valueClass">
      {{ displayValue }}
    </p>
    <p v-if="$slots.secondary" class="text-body text-muted-foreground mt-1.5">
      <slot name="secondary" />
    </p>
  </div>
</template>
