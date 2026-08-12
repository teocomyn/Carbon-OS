import { describe, expect, it } from "vitest";
import { defaultAnswers } from "@/data/defaults";
import { calculateAssessment } from "@/lib/calculator";

describe("calculateAssessment", () => {
  it("keeps totals equal to category sums", () => {
    const result = calculateAssessment(defaultAnswers);
    expect(result.totalKg).toBeCloseTo(result.categories.reduce((sum, category) => sum + category.kgCo2e, 0), 8);
  });

  it("lowers transport emissions when switching to electric", () => {
    const thermal = calculateAssessment(defaultAnswers);
    const electric = calculateAssessment({ ...defaultAnswers, carType: "electric" });
    const transport = (result: typeof thermal) => result.categories.find((category) => category.category === "transport")!.kgCo2e;
    expect(transport(electric)).toBeLessThan(transport(thermal));
  });

  it("improves confidence with measured energy data", () => {
    const quick = calculateAssessment(defaultAnswers);
    const precise = calculateAssessment({ ...defaultAnswers, mode: "precise", heatingKwh: 8000, electricityKwh: 2200 });
    expect(precise.confidenceScore).toBeGreaterThan(quick.confidenceScore);
    expect(precise.highKg - precise.lowKg).toBeLessThan(quick.highKg - quick.lowKg);
  });
});
