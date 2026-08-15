import { describe, expect, it } from "vitest";
import {
  buildCarbonCoachInstructions,
  carbonCoachContextSchema,
  type CarbonCoachContext,
} from "@/lib/carbon-coach";

const context: CarbonCoachContext = {
  totalKg: 8_200,
  confidenceScore: 72,
  goalKg: 5_000,
  categories: [
    { label: "Déplacements", kgCo2e: 3_100, share: 38 },
    { label: "Logement", kgCo2e: 2_000, share: 24 },
  ],
  activeActions: [
    { title: "Prendre davantage le train", savingKg: 900, status: "En cours" },
  ],
  recommendations: [
    {
      title: "Réduire un trajet en avion",
      savingKg: 1_200,
      effort: "Modéré",
      cost: "Économie",
    },
  ],
};

describe("carbon coach", () => {
  it("construit un contexte agrégé compréhensible", () => {
    const instructions = buildCarbonCoachInstructions(context);

    expect(instructions).toContain("8 200 kg CO₂e/an");
    expect(instructions).toContain("Déplacements");
    expect(instructions).toContain("Prendre davantage le train");
    expect(instructions).toContain("non culpabilisant");
  });

  it("refuse les champs personnels inattendus", () => {
    const parsed = carbonCoachContextSchema.safeParse({
      ...context,
      email: "personne@example.com",
    });

    expect(parsed.success).toBe(false);
  });
});
