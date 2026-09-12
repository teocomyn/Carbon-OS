import { describe, expect, it } from "vitest";
import { enrichActionPlan, resolvePlanScenario } from "@/lib/plan-helpers";
import type { ActionPlanItem, Scenario } from "@/lib/types";

const scenario: Scenario = {
  id: "train",
  title: "Prendre le train",
  description: "Remplacer un trajet voiture.",
  savingKg: 200,
  effort: "Modéré",
  cost: "Neutre",
  icon: "train",
  rationale: "Trajets répétitifs.",
};

const item = (overrides: Partial<ActionPlanItem> = {}): ActionPlanItem => ({
  scenarioId: "train",
  status: "to_try",
  startedAt: null,
  completedAt: null,
  addedAt: "2026-09-12T10:00:00.000Z",
  updatedAt: "2026-09-12T10:00:00.000Z",
  ...overrides,
});

describe("plan helpers", () => {
  it("keeps stored titles when a scenario disappears", () => {
    const resolved = resolvePlanScenario(
      item({ title: "Action conservée", estimatedSavingKg: 120 }),
    );
    expect(resolved.title).toBe("Action conservée");
    expect(resolved.savingKg).toBe(120);
  });

  it("fills missing plan metadata from the current scenario", () => {
    const [enriched] = enrichActionPlan([item()], [scenario]);
    expect(enriched?.title).toBe("Prendre le train");
    expect(enriched?.estimatedSavingKg).toBe(200);
  });
});
