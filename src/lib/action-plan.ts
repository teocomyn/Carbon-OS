import type { ActionPlanItem, ActionPlanStatus } from "@/lib/types";

const statuses: ActionPlanStatus[] = ["to_try", "in_progress", "completed"];
export const MAX_ACTIVE_ACTIONS = 3;
export const MAX_COMPLETED_ACTIONS = 20;

export function isActionPlanItem(value: unknown): value is ActionPlanItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ActionPlanItem>;
  return (
    typeof item.scenarioId === "string" &&
    statuses.includes(item.status as ActionPlanStatus) &&
    typeof item.addedAt === "string" &&
    typeof item.updatedAt === "string" &&
    (item.startedAt === null || typeof item.startedAt === "string") &&
    (item.completedAt === undefined ||
      item.completedAt === null ||
      typeof item.completedAt === "string")
  );
}

export function normalizeActionPlan(values: ActionPlanItem[]) {
  const unique = new Map<string, ActionPlanItem>();
  for (const item of values) {
    const normalized = {
      ...item,
      completedAt:
        item.completedAt ??
        (item.status === "completed" ? item.updatedAt : null),
    };
    const current = unique.get(item.scenarioId);
    if (!current || normalized.updatedAt > current.updatedAt)
      unique.set(item.scenarioId, normalized);
  }
  const sorted = [...unique.values()].sort((left, right) =>
    left.addedAt.localeCompare(right.addedAt),
  );
  const active = sorted
    .filter((item) => item.status !== "completed")
    .slice(0, MAX_ACTIVE_ACTIONS);
  const completed = sorted
    .filter((item) => item.status === "completed")
    .slice(-MAX_COMPLETED_ACTIONS);
  const retainedIds = new Set(
    [...active, ...completed].map((item) => item.scenarioId),
  );
  return sorted.filter((item) => retainedIds.has(item.scenarioId));
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

export function completedActionsSince(values: ActionPlanItem[], since: string) {
  const threshold = new Date(since).getTime();
  return normalizeActionPlan(values).filter((item) => {
    if (item.status !== "completed") return false;
    const completedAt = item.completedAt ?? item.updatedAt;
    return new Date(completedAt).getTime() >= threshold;
  });
}
