import { describe, expect, it } from "vitest";
import { signedTone } from "./chartTone";

describe("signedTone", () => {
  it("음수 손실은 손실색으로 칠한다", () => {
    expect(signedTone(-80_000)).toBe("fee");
    expect(signedTone(-1)).toBe("fee");
  });

  it("0과 양수는 수익색을 유지한다", () => {
    expect(signedTone(0)).toBe("profit");
    expect(signedTone(1)).toBe("profit");
    expect(signedTone(3_600_000)).toBe("profit");
  });

  it("유한하지 않은 값은 수익색으로 떨어진다", () => {
    expect(signedTone(Number.NaN)).toBe("profit");
    expect(signedTone(Number.POSITIVE_INFINITY)).toBe("profit");
  });
});
