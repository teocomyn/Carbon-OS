import type { ActionPlanItem, ActionPlanStatus } from "@/lib/types";

const statuses: ActionPlanStatus[] = ["to_try", "in_progress", "completed"];

export function isActionPlanItem(value: unknown): value is ActionPlanItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ActionPlanItem>;
  return (
    typeof item.scenarioId === "string" &&
    statuses.includes(item.status as ActionPlanStatus) &&
    typeof item.addedAt === "string" &&
    typeof item.updatedAt === "string" &&
    (item.startedAt === null || typeof item.startedAt === "string")
  );
}

export function normalizeActionPlan(values: ActionPlanItem[]) {
  const unique = new Map<string, ActionPlanItem>();
  for (const item of values) {
    const current = unique.get(item.scenarioId);
    if (!current || item.updatedAt > current.updatedAt)
      unique.set(item.scenarioId, item);
  }
  return [...unique.values()]
    .sort((left, right) => left.addedAt.localeCompare(right.addedAt))
    .slice(0, 3);
}

export function parseActionPlan(serialized: string | null) {
  if (!serialized) return [];
  try {
    const value: unknown = JSON.parse(serialized);
    return Array.isArray(value)
      ? normalizeActionPlan(value.filter(isActionPlanItem))
      : [];
  } catch {
    return [];
  }
}

export function mergeActionPlans(
  local: ActionPlanItem[],
  remote: ActionPlanItem[],
) {
  return normalizeActionPlan([...local, ...remote]);
}
