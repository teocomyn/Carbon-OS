import { describe, expect, it } from "vitest";
import { defaultAnswers } from "@/data/defaults";
import { calculateAssessment } from "@/lib/calculator";

describe("calculateAssessment", () => {
  it("keeps totals equal to category sums", () => {
    const result = calculateAssessment(defaultAnswers);
    expect(result.totalKg).toBeCloseTo(
      result.categories.reduce((sum, category) => sum + category.kgCo2e, 0),
      8,
    );
  });

  it("lowers transport emissions when switching to electric", () => {
    const thermal = calculateAssessment(defaultAnswers);
    const electric = calculateAssessment({
      ...defaultAnswers,
      carType: "electric",
    });
    const transport = (result: typeof thermal) =>
      result.categories.find((category) => category.category === "transport")!
        .kgCo2e;
    expect(transport(electric)).toBeLessThan(transport(thermal));
  });

  it("improves confidence with measured energy data", () => {
    const quick = calculateAssessment(defaultAnswers);
    const precise = calculateAssessment({
      ...defaultAnswers,
      mode: "precise",
      heatingKwh: 8000,
      electricityKwh: 2200,
    });
    expect(precise.confidenceScore).toBeGreaterThan(quick.confidenceScore);
    expect(precise.highKg - precise.lowKg).toBeLessThan(
      quick.highKg - quick.lowKg,
    );
  });

  it("shares a declared household heating consumption between occupants", () => {
    const result = calculateAssessment({
      ...defaultAnswers,
      mode: "precise",
      occupants: 2,
      heating: "gas",
      heatingKwh: 8000,
    });
    const heating = result.categories
      .find((category) => category.category === "housing")!
      .lines.find((item) => item.id === "heating")!;

    expect(heating.activity).toBe(4000);
    expect(heating.kgCo2e).toBeCloseTo(860, 5);
    expect(heating.estimated).toBe(false);
  });

  it("does not apply the heat-pump COP twice to declared electricity", () => {
    const result = calculateAssessment({
      ...defaultAnswers,
      mode: "precise",
      occupants: 2,
      heating: "heatpump",
      heatingKwh: 3000,
    });
    const heating = result.categories
      .find((category) => category.category === "housing")!
      .lines.find((item) => item.id === "heating")!;

    expect(heating.activity).toBe(1500);
    expect(heating.kgCo2e).toBeCloseTo(1500 * 0.0519, 5);
  });
});
