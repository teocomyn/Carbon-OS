import { describe, expect, it } from "vitest";
import { defaultAnswers } from "@/data/defaults";
import { calculateAssessment } from "@/lib/calculator";
import { createAssessmentSnapshot } from "@/lib/history";
import { buildProgressStory, isAssessmentDue } from "@/lib/progress-story";

function snapshot(
  id: string,
  createdAt: string,
  transportChange = 0,
  housingChange = 0,
) {
  const answers = {
    ...defaultAnswers,
    carKm: defaultAnswers.carKm + transportChange,
    surface: defaultAnswers.surface + housingChange,
  };
  const result = calculateAssessment(answers);
  result.calculatedAt = createdAt;
  return createAssessmentSnapshot({
    id,
    answers,
    result,
    goalKg: 3500,
    source: "questionnaire",
  });
}

describe("progress story", () => {
  it("compares the latest assessment with the immediately previous one", () => {
    const first = snapshot("first", "2026-01-01T10:00:00.000Z", 900);
    const previous = snapshot("previous", "2026-04-01T10:00:00.000Z", 500);
    const latest = snapshot("latest", "2026-07-01T10:00:00.000Z", 100);
    const story = buildProgressStory([first, previous, latest]);

    const change = latest.result.totalKg - previous.result.totalKg;
    expect(change).toBeLessThan(0);
    expect(story?.changeKg).toBeCloseTo(change, 5);
    expect(story?.primaryCategory?.category).toBe("transport");
    expect(story?.primaryCategory?.changeKg).toBeCloseTo(change, 5);
  });

  it("keeps an increase understandable and schedules a three-to-six-month check-in", () => {
    const previous = snapshot("previous", "2026-01-15T10:00:00.000Z");
    const latest = snapshot("latest", "2026-04-15T10:00:00.000Z", 0, 250);
    const story = buildProgressStory([previous, latest]);

    const change = latest.result.totalKg - previous.result.totalKg;
    expect(change).toBeGreaterThan(0);
    expect(story?.changeKg).toBeCloseTo(change, 5);
    expect(story?.primaryCategory?.category).toBe("housing");
    expect(story?.nextAssessmentStart.startsWith("2026-07-15")).toBe(true);
    expect(story?.nextAssessmentEnd.startsWith("2026-10-15")).toBe(true);
  });

  it("marks an assessment as due after three months", () => {
    expect(
      isAssessmentDue(
        "2026-01-15T10:00:00.000Z",
        Date.parse("2026-04-15T10:00:00.000Z"),
      ),
    ).toBe(true);
    expect(
      isAssessmentDue(
        "2026-01-15T10:00:00.000Z",
        Date.parse("2026-03-15T10:00:00.000Z"),
      ),
    ).toBe(false);
  });
});
