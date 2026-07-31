// 손익 축(domain="signed") 차트의 톤 결정 규칙.
// 왜 함수로 빼는가: @shakilabs/ui ShMetricBars는 항목에 tone이 명시되면
// 자동 음수색(negativeTone)보다 그 값을 우선한다. 그래서 부호가 갈리는 값에
// 정적 tone을 넘기면 손실이 수익색으로 칠해진다. 부호 있는 값은 반드시 이 함수를 거친다.
export type Tone = "primary" | "fee" | "profit" | "muted";

/** 음수(손실)면 손실색(fee), 그 외에는 수익색(profit). NaN·Infinity는 수익색으로 둔다. */
export function signedTone(value: number): Tone {
  return Number.isFinite(value) && value < 0 ? "fee" : "profit";
}
