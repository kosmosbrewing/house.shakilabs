import { describe, expect, it } from "vitest";
import {
  buildPublicPagePath,
  getPageGroup,
  shouldTrackPageView,
} from "@/utils/pageTracking";

describe("pageTracking", () => {
  it("공개 서비스 경로를 앱 내부 경로에 붙인다", () => {
    expect(buildPublicPagePath("/house/", "/property-tax/30000?owners=1")).toBe(
      "/house/property-tax",
    );
    expect(buildPublicPagePath("/house", "/delay-interest/30000?days=30")).toBe(
      "/house/delay-interest",
    );
    expect(buildPublicPagePath("house", "/")).toBe("/house");
  });

  it("숫자 상세 경로와 쿼리를 같은 계산기 그룹으로 분류한다", () => {
    expect(getPageGroup("/delay-interest/30000?days=30")).toBe("delay-interest");
    expect(getPageGroup("/")).toBe("home");
  });

  it("첫 진입과 계산기 변경만 페이지뷰로 집계한다", () => {
    expect(shouldTrackPageView("/property-tax", "/", false)).toBe(true);
    expect(shouldTrackPageView("/property-tax/30000", "/property-tax", true)).toBe(false);
    expect(shouldTrackPageView("/property-tax?owners=2", "/property-tax", true)).toBe(false);
    expect(shouldTrackPageView("/jeonse-wolse-rate", "/property-tax", true)).toBe(true);
  });
});
