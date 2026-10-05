import { describe, expect, it } from "vitest";
import { defaultAnswers } from "@/data/defaults";
import { assessmentAnswersSchema } from "@/lib/validation";
import {
  normalizeAnswers,
  parseStoredAnswers,
  tryNormalizeAnswers,
} from "@/lib/answers";

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

  it("rejects unreadable or invalid objects instead of inventing a bilan", () => {
    expect(tryNormalizeAnswers(null)).toBeNull();
    expect(tryNormalizeAnswers({ carKm: "beaucoup" })).toBeNull();
  });

  it("rejects unreadable storage instead of inventing a bilan", () => {
    expect(parseStoredAnswers(null)).toBeNull();
    expect(parseStoredAnswers("{")).toBeNull();
    expect(parseStoredAnswers(JSON.stringify({ carKm: 10 }))).toBeNull();
  });

  it("migrates a real legacy payload missing a required field", () => {
    const legacy: Partial<typeof defaultAnswers> = {
      ...defaultAnswers,
      carKm: 1234,
    };
    delete legacy.occupancy;
    expect(assessmentAnswersSchema.safeParse(legacy).success).toBe(false);
    const migrated = parseStoredAnswers(JSON.stringify(legacy));
    expect(migrated?.occupancy).toBe(defaultAnswers.occupancy);
    expect(migrated?.carKm).toBe(1234);
  });

  it("does not recover empty objects, arrays or invalid complete payloads", () => {
    expect(tryNormalizeAnswers({})).toBeNull();
    expect(tryNormalizeAnswers([])).toBeNull();
    expect(tryNormalizeAnswers({ ...defaultAnswers, carKm: -1 })).toBeNull();
  });
});
