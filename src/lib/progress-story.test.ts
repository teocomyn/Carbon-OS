import { describe, expect, it } from "vitest";
import { defaultAnswers } from "@/data/defaults";
import { calculateAssessment } from "@/lib/calculator";
import { createAssessmentSnapshot } from "@/lib/history";
import { buildProgressStory } from "@/lib/progress-story";

function snapshot(
  id: string,
  createdAt: string,
  transportChange = 0,
  housingChange = 0,
) {
  const result = calculateAssessment(defaultAnswers);
  result.calculatedAt = createdAt;
  const transport = result.categories.find(
    (category) => category.category === "transport",
  )!;
  const housing = result.categories.find(
    (category) => category.category === "housing",
  )!;
  transport.kgCo2e += transportChange;
  housing.kgCo2e += housingChange;
  result.totalKg += transportChange + housingChange;
  return createAssessmentSnapshot({
    id,
    answers: defaultAnswers,
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

    expect(story?.changeKg).toBeCloseTo(-400, 5);
    expect(story?.primaryCategory?.category).toBe("transport");
    expect(story?.primaryCategory?.changeKg).toBeCloseTo(-400, 5);
  });

  it("keeps an increase understandable and schedules a three-to-six-month check-in", () => {
    const previous = snapshot("previous", "2026-01-15T10:00:00.000Z");
    const latest = snapshot("latest", "2026-04-15T10:00:00.000Z", 0, 250);
    const story = buildProgressStory([previous, latest]);

    expect(story?.changeKg).toBeCloseTo(250, 5);
    expect(story?.primaryCategory?.category).toBe("housing");
    expect(story?.nextAssessmentStart.startsWith("2026-07-15")).toBe(true);
    expect(story?.nextAssessmentEnd.startsWith("2026-10-15")).toBe(true);
  });
});
