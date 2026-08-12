import { describe, expect, it } from "vitest";
import { defaultAnswers } from "@/data/defaults";
import { calculateAssessment } from "@/lib/calculator";
import {
  calculateProgress,
  createAssessmentSnapshot,
  mergeHistories,
  parseHistory,
} from "@/lib/history";

function snapshot(
  id: string,
  totalOffset = 0,
  createdAt = "2026-08-12T10:00:00.000Z",
) {
  const result = calculateAssessment(defaultAnswers);
  result.totalKg += totalOffset;
  result.calculatedAt = createdAt;
  return createAssessmentSnapshot({
    id,
    answers: defaultAnswers,
    result,
    goalKg: 3500,
    source: "questionnaire",
  });
}

describe("assessment history", () => {
  it("rejects invalid persisted data", () => {
    expect(parseHistory("not-json")).toEqual([]);
    expect(parseHistory(JSON.stringify([{ id: "incomplete" }]))).toEqual([]);
  });

  it("merges local and remote snapshots without duplicating ids", () => {
    const first = snapshot("first");
    const second = snapshot("second", -500, "2026-09-12T10:00:00.000Z");
    expect(
      mergeHistories([first], [first, second]).map((item) => item.id),
    ).toEqual(["first", "second"]);
  });

  it("calculates progress between the first and latest snapshots", () => {
    const first = snapshot("first");
    const latest = snapshot("latest", -500, "2026-09-12T10:00:00.000Z");
    const progress = calculateProgress([first, latest]);
    expect(progress.changeKg).toBeCloseTo(-500, 5);
    expect(progress.changePercent).toBeLessThan(0);
    expect(progress.best?.id).toBe("latest");
  });
});
