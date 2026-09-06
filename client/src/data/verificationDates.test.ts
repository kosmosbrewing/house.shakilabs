import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { VERIFICATION_DATES, VERIFICATION_DATE_RANGE } from "./verificationDates";

const dataRoot = dirname(fileURLToPath(import.meta.url));

// 화면에 렌더되지 않는 레거시 상수 — 푸터·/about이 예전에 이 하나를 "법령·조례 확인일"로
// 공표하다가 다이제스트의 주제별 확인일과 어긋났다. 다시 배선하지 말 것.
const NOT_A_TOPIC_DATE = new Set(["HOUSE_DATA_UPDATED", "HOUSE_DATA_VERIFIED"]);

function declaredDates(): { name: string; date: string; file: string }[] {
  const found: { name: string; date: string; file: string }[] = [];
  for (const file of readdirSync(dataRoot).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))) {
    const source = readFileSync(resolve(dataRoot, file), "utf8");
    for (const match of source.matchAll(/export const (\w*_(?:UPDATED|VERIFIED)) = "(\d{4}-\d{2}-\d{2})"/g)) {
      found.push({ name: match[1]!, date: match[2]!, file });
    }
  }
  return found;
}

describe("법령·조례 확인일", () => {
  it("계산기마다 다른 확인일을 하나로 뭉뚱그리지 않는다", () => {
    // 단일 날짜 표기가 성립하려면 전부 같은 날이어야 한다. 실제로는 그렇지 않으므로
    // 푸터·/about은 범위와 주제별 목록으로만 말해야 한다.
    expect(new Set(VERIFICATION_DATES.map((entry) => entry.date)).size).toBeGreaterThan(1);
  });

  it("데이터 파일이 선언한 확인일이 빠짐없이 목록에 실린다", () => {
    const listed = new Set(VERIFICATION_DATES.map((entry) => entry.date));
    for (const { name, date, file } of declaredDates()) {
      if (NOT_A_TOPIC_DATE.has(name)) continue;
      expect(listed.has(date), `${file}의 ${name}(${date})이 VERIFICATION_DATES에 없다`).toBe(true);
    }
  });

  it("주제가 중복되지 않고 범위가 실제 최소·최대와 같다", () => {
    const topics = VERIFICATION_DATES.map((entry) => entry.topic);
    expect(new Set(topics).size).toBe(topics.length);
    const dates = [...VERIFICATION_DATES.map((entry) => entry.date)].sort();
    expect(VERIFICATION_DATE_RANGE.earliest).toBe(dates[0]);
    expect(VERIFICATION_DATE_RANGE.latest).toBe(dates[dates.length - 1]);
  });
});
