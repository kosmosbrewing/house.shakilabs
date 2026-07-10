import { afterEach, describe, expect, it, vi } from "vitest";
import { createCalculatorAnalytics } from "@/utils/calculatorAnalytics";

describe("calculatorAnalytics", () => {
  afterEach(() => vi.useRealTimers());

  it("지원 결과가 있을 때만 result_view를 기록한다", () => {
    vi.useFakeTimers();
    const track = vi.fn();
    let supported = false;
    const analytics = createCalculatorAnalytics({
      calculatorId: () => "property_tax",
      pagePath: () => "/house/property-tax",
      track,
      canViewResult: () => supported,
      debounceMs: 100,
    });

    analytics.recordInteraction();
    vi.advanceTimersByTime(100);
    expect(track.mock.calls.map(([eventName]) => eventName)).toEqual([
      "calculator_start",
      "calculator_submit",
    ]);

    supported = true;
    analytics.recordInteraction();
    vi.advanceTimersByTime(100);
    expect(track.mock.calls[track.mock.calls.length - 1]?.[0]).toBe("result_view");
  });
});
