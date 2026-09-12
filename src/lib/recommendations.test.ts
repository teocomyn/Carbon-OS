import { describe, expect, it } from "vitest";
import { defaultAnswers } from "@/data/defaults";
import {
  applyScenarioToAnswers,
  buildScenarios,
  identifiedScenarioPotential,
  simulateCombinedScenarios,
} from "@/lib/recommendations";

describe("recommendations", () => {
  it("does not add overlapping scenario savings", () => {
    const answers = {
      ...defaultAnswers,
      carType: "petrol" as const,
      carKm: 12_000,
    };
    const scenarios = buildScenarios(answers);
    const ids = scenarios
      .filter((scenario) => scenario.id === "electric-car" || scenario.id === "train")
      .map((scenario) => scenario.id);
    const summed = scenarios
      .filter((scenario) => ids.includes(scenario.id))
      .reduce((total, scenario) => total + scenario.savingKg, 0);
    const combined = simulateCombinedScenarios(answers, ids);

    expect(ids.length).toBe(2);
    expect(combined.savingKg).toBeLessThan(summed);
    expect(combined.savingKg).toBeGreaterThan(20);
  });

  it("applies a flight reduction without inventing a new trip", () => {
    const next = applyScenarioToAnswers(
      { ...defaultAnswers, longFlights: 1, shortFlights: 2 },
      "flight",
    );
    expect(next.longFlights).toBe(0);
    expect(next.shortFlights).toBe(2);
  });

  it("caps identified potential below the sum of overlapping levers", () => {
    const answers = {
      ...defaultAnswers,
      carType: "petrol" as const,
      carKm: 12_000,
    };
    const scenarios = buildScenarios(answers);
    const summed = scenarios.reduce(
      (total, scenario) => total + scenario.savingKg,
      0,
    );
    const combined = identifiedScenarioPotential(answers, scenarios);

    expect(scenarios.length).toBeGreaterThan(1);
    expect(combined.savingKg).toBeLessThan(summed);
    expect(combined.savingKg).toBeGreaterThan(20);
  });

  it("skips electric-car savings when the car is already electric", () => {
    const scenarios = buildScenarios({
      ...defaultAnswers,
      carType: "electric",
    });
    expect(scenarios.some((scenario) => scenario.id === "electric-car")).toBe(
      false,
    );
  });
});
