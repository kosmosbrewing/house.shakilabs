import { z } from "zod";

// 입력 기억(ShMemoryControl) 저장본 검증 — 저장소·TTL(8시간)·키는 패키지가 소유하고,
// 앱은 "무엇을 저장/복원할지"만 정한다. sessionStorage 값은 누구나 심을 수 있으므로
// 복원 값도 사용자 입력과 똑같이 Zod로 먼저 통과시킨다(finance CalculatorMemoryControl과 같은 스키마).
export const memoryDraftSchema = z.object({
  path: z
    .string()
    .min(1)
    // 길이 상한이 없으면 심어진 거대한 문자열이 그대로 router로 들어간다
    .max(2_000)
    .startsWith("/")
    // `//evil.example.com`은 "/"로 시작해도 외부 주소다 — 스키마 단계에서 끊는다
    .refine((value) => !value.startsWith("//"), { message: "protocol-relative path" }),
  savedAt: z.number().int().nonnegative(),
});

export type MemoryDraft = z.infer<typeof memoryDraftSchema>;

/** 스키마를 통과하고 경로(쿼리·해시 제외)가 이 도구의 경로와 정확히 같을 때만 돌려준다. */
export function parseMemoryDraft(payload: unknown, routePath: string): MemoryDraft | null {
  const parsed = memoryDraftSchema.safeParse(payload);
  if (!parsed.success) return null;
  return parsed.data.path.split(/[?#]/, 1)[0] === routePath ? parsed.data : null;
}

/** 분석에는 입력값이 아니라 경과 구간만 보낸다. */
export function ageBucket(savedAt: number, now = Date.now()): "under_15m" | "under_1h" | "under_8h" {
  const age = now - savedAt;
  if (age < 15 * 60 * 1000) return "under_15m";
  if (age < 60 * 60 * 1000) return "under_1h";
  return "under_8h";
}
