import { normalizeActionPlan } from "@/lib/action-plan";
import type { ActionPlanItem, Scenario } from "@/lib/types";

export function resolvePlanScenario(
  item: ActionPlanItem,
  current?: Scenario,
): Scenario {
  return {
    id: item.scenarioId,
    title: item.title ?? current?.title ?? "Action personnelle",
    description:
      item.description ??
      current?.description ??
      "Une action conservée dans votre historique personnel.",
    savingKg: item.estimatedSavingKg ?? current?.savingKg ?? 0,
    effort: item.effort ?? current?.effort ?? "Modéré",
    cost: item.cost ?? current?.cost ?? "Neutre",
    icon: current?.icon ?? "sparkles",
    rationale:
      item.rationale ??
      current?.rationale ??
      "Vous aviez choisi cette action comme un levier pertinent pour votre situation.",
  };
}

export function enrichActionPlan(items: ActionPlanItem[], scenarios: Scenario[]) {
  return normalizeActionPlan(
    items.map((item) => {
      const scenario = scenarios.find(
        (candidate) => candidate.id === item.scenarioId,
      );
      if (!scenario) return item;
      return {
        ...item,
        title: item.title ?? scenario.title,
        description: item.description ?? scenario.description,
        estimatedSavingKg: item.estimatedSavingKg ?? scenario.savingKg,
        effort: item.effort ?? scenario.effort,
        cost: item.cost ?? scenario.cost,
        rationale: item.rationale ?? scenario.rationale,
      };
    }),
  );
}
