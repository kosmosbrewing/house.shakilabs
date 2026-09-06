import { describe, expect, it } from "vitest";

import { VERIFICATION_DATES, VERIFICATION_DATE_RANGE } from "./verificationDates";

// 데이터 파일 원문을 그대로 읽어 확인일 선언을 훑는다. node:fs를 쓰면 타입체크가 깨지므로
// Vite의 raw import를 쓴다 — 새 계산기 파일이 추가돼도 glob이 자동으로 잡는다.
const dataSources = import.meta.glob("./*.ts", { eager: true, query: "?raw", import: "default" });

// 화면에 렌더되지 않는 레거시 상수 — 푸터·/about이 예전에 이 하나를 "법령·조례 확인일"로
// 공표하다가 다이제스트의 주제별 확인일과 어긋났다. 다시 배선하지 말 것.
const NOT_A_TOPIC_DATE = new Set(["HOUSE_DATA_UPDATED", "HOUSE_DATA_VERIFIED"]);

function declaredDates(): { name: string; date: string; file: string }[] {
  const found: { name: string; date: string; file: string }[] = [];
  for (const [file, source] of Object.entries(dataSources)) {
    if (file.endsWith(".test.ts") || typeof source !== "string") continue;
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
    const declared = declaredDates();
    expect(declared.length).toBeGreaterThan(5);
    // 날짜가 아니라 "상수 이름"으로 대조한다. 날짜로 대조하면 새 계산기의 확인일이
    // 우연히 기존 주제와 같은 날일 때 누락이 조용히 통과한다.
    const listed = new Map(VERIFICATION_DATES.map((entry) => [entry.constant, entry.date]));
    for (const { name, date, file } of declared) {
      if (NOT_A_TOPIC_DATE.has(name)) continue;
      expect(listed.has(name), `${file}의 ${name}이 VERIFICATION_DATES에 없다`).toBe(true);
      expect(listed.get(name), `${name}의 확인일이 목록과 어긋난다`).toBe(date);
    }
  });

  it("목록에 실린 상수가 실제로 데이터 파일에 존재한다", () => {
    const declared = new Set(declaredDates().map((entry) => entry.name));
    for (const entry of VERIFICATION_DATES) {
      expect(declared.has(entry.constant), `${entry.constant}이 데이터 파일에 없다`).toBe(true);
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
