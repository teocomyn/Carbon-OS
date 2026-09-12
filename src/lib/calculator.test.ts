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

  it("uses a distinct diesel factor", () => {
    const petrol = calculateAssessment({
      ...defaultAnswers,
      carType: "petrol",
      carKm: 10_000,
      occupancy: 1,
    });
    const diesel = calculateAssessment({
      ...defaultAnswers,
      carType: "diesel",
      carKm: 10_000,
      occupancy: 1,
    });
    const petrolCar = petrol.categories
      .find((category) => category.category === "transport")!
      .lines.find((item) => item.id === "car")!;
    const dieselCar = diesel.categories
      .find((category) => category.category === "transport")!
      .lines.find((item) => item.id === "car")!;

    expect(dieselCar.factorValue).toBeGreaterThan(petrolCar.factorValue);
  });

  it("uses declared motorcycle kilometers in precise mode", () => {
    const result = calculateAssessment({
      ...defaultAnswers,
      mode: "precise",
      primaryMobility: "motorcycle",
      carType: "none",
      carKm: 0,
      motorcycleKm: 2_000,
    });
    const motorcycle = result.categories
      .find((category) => category.category === "transport")!
      .lines.find((item) => item.id === "motorcycle")!;

    expect(motorcycle.activity).toBe(2000);
    expect(motorcycle.estimated).toBe(false);
  });

  it("uses a lower long-haul factor than a short flight", () => {
    const short = calculateAssessment({
      ...defaultAnswers,
      carType: "none",
      carKm: 0,
      primaryMobility: "train",
      shortFlights: 1,
      longFlights: 0,
    });
    const longHaul = calculateAssessment({
      ...defaultAnswers,
      carType: "none",
      carKm: 0,
      primaryMobility: "train",
      shortFlights: 0,
      longFlights: 1,
    });
    const shortLine = short.categories
      .find((category) => category.category === "transport")!
      .lines.find((item) => item.id === "short-flights")!;
    const longLine = longHaul.categories
      .find((category) => category.category === "transport")!
      .lines.find((item) => item.id === "long-flights")!;

    expect(longLine.factorValue).toBeLessThan(shortLine.factorValue);
    expect(longLine.kgCo2e).toBeGreaterThan(shortLine.kgCo2e);
  });

  it("uses a higher regional train factor than TGV", () => {
    const tgv = calculateAssessment({
      ...defaultAnswers,
      trainKm: 2000,
      trainService: "tgv",
    });
    const regional = calculateAssessment({
      ...defaultAnswers,
      trainKm: 2000,
      trainService: "regional",
    });
    const trainLine = (result: typeof tgv) =>
      result.categories
        .find((category) => category.category === "transport")!
        .lines.find((item) => item.id === "train")!;

    expect(trainLine(regional).factorValue).toBeGreaterThan(
      trainLine(tgv).factorValue,
    );
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
