import { describe, expect, it } from "vitest";
import { normalizeAnswers, parseStoredAnswers } from "@/lib/answers";

describe("normalizeAnswers", () => {
  it("fills missing mobility fields from older payloads", () => {
    const answers = normalizeAnswers({
      mode: "quick",
      primaryMobility: "car",
      carType: "petrol",
      carKm: 8000,
      occupancy: 1,
      trainKm: 0,
      shortFlights: 0,
      longFlights: 0,
      homeType: "apartment",
      surface: 50,
      occupants: 2,
      insulation: "average",
      heating: "gas",
      heatingKwh: null,
      electricityKwh: null,
      renewableElectricity: false,
      diet: "vegan",
      beefFrequency: 4,
      foodWaste: "low",
      purchaseProfile: "low",
      secondHand: "often",
      deviceYears: 5,
      digitalHours: 2,
      servicesProfile: "low",
    });

    expect(answers.motorcycleKm).toBe(5000);
    expect(answers.trainService).toBe("mixed");
    expect(answers.beefFrequency).toBe(0);
  });

  it("rejects unreadable storage instead of inventing a bilan", () => {
    expect(parseStoredAnswers(null)).toBeNull();
    expect(parseStoredAnswers("{")).toBeNull();
    expect(parseStoredAnswers(JSON.stringify({ carKm: 10 }))).toBeNull();
  });
});
