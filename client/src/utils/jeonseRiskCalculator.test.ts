import { describe, expect, it } from "vitest";
import { calculateJeonseRisk } from "./jeonseRiskCalculator";

const base = {
  marketPrice: 500_000_000,
  jeonseDeposit: 350_000_000,
  seniorDebt: 0,
  isMetropolitan: true,
};

describe("calculateJeonseRisk", () => {
  it("전세가율·부채비율과 위험 등급을 계산한다", () => {
    const result = calculateJeonseRisk(base);
    expect(result.jeonseRatio).toBeCloseTo(0.7);
    expect(result.debtRatio).toBeCloseTo(0.7);
    expect(result.riskLevel).toBe("caution");
  });

  it("위험 등급 경계값 — 70/80/90%", () => {
    expect(calculateJeonseRisk({ ...base, jeonseDeposit: 349_999_999 }).riskLevel).toBe("safe");
    expect(calculateJeonseRisk({ ...base, jeonseDeposit: 400_000_000 }).riskLevel).toBe("danger");
    expect(calculateJeonseRisk({ ...base, jeonseDeposit: 450_000_000 }).riskLevel).toBe("severe");
  });

  it("선순위 채권은 부채비율에 합산된다", () => {
    const result = calculateJeonseRisk({ ...base, jeonseDeposit: 300_000_000, seniorDebt: 150_000_000 });
    expect(result.jeonseRatio).toBeCloseTo(0.6);
    expect(result.debtRatio).toBeCloseTo(0.9);
    expect(result.riskLevel).toBe("severe");
  });

  it("HUG 가입 상한 = 시세×90% − 선순위, 지역 한도로 캡", () => {
    const noDebt = calculateJeonseRisk(base);
    expect(noDebt.hugMaxDeposit).toBe(450_000_000);
    expect(noDebt.isHugEligible).toBe(true);

    const withDebt = calculateJeonseRisk({ ...base, seniorDebt: 200_000_000 });
    expect(withDebt.hugMaxDeposit).toBe(250_000_000);
    expect(withDebt.isHugEligible).toBe(false);

    const bigHouse = calculateJeonseRisk({
      ...base,
      marketPrice: 1_000_000_000,
      jeonseDeposit: 750_000_000,
    });
    expect(bigHouse.hugMaxDeposit).toBe(700_000_000);
    expect(bigHouse.isHugEligible).toBe(false);

    const nonMetro = calculateJeonseRisk({
      ...base,
      marketPrice: 1_000_000_000,
      jeonseDeposit: 600_000_000,
      isMetropolitan: false,
    });
    expect(nonMetro.hugLimit).toBe(500_000_000);
    expect(nonMetro.isHugEligible).toBe(false);
  });

  it("낙찰가율 75% 가정 회수·부족분을 추정한다", () => {
    const result = calculateJeonseRisk({ ...base, jeonseDeposit: 400_000_000 });
    expect(result.auctionProceeds).toBe(375_000_000);
    expect(result.auctionRecovery).toBe(375_000_000);
    expect(result.auctionShortfall).toBe(25_000_000);

    const withDebt = calculateJeonseRisk({
      ...base,
      jeonseDeposit: 300_000_000,
      seniorDebt: 200_000_000,
    });
    expect(withDebt.auctionRecovery).toBe(175_000_000);
    expect(withDebt.auctionShortfall).toBe(125_000_000);
  });

  it("시세 0이면 미지원 처리한다", () => {
    expect(calculateJeonseRisk({ ...base, marketPrice: 0 }).isSupported).toBe(false);
  });
});
