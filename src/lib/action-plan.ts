import type { ActionPlanItem, ActionPlanStatus } from "@/lib/types";

const statuses: ActionPlanStatus[] = ["to_try", "in_progress", "completed"];
export const MAX_ACTIVE_ACTIONS = 3;
export const MAX_COMPLETED_ACTIONS = 20;

export function isActionPlanItem(value: unknown): value is ActionPlanItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ActionPlanItem>;
  return (
    (item.removed === undefined || typeof item.removed === "boolean") &&
    typeof item.scenarioId === "string" &&
    statuses.includes(item.status as ActionPlanStatus) &&
    typeof item.addedAt === "string" &&
    typeof item.updatedAt === "string" &&
    Number.isFinite(Date.parse(item.updatedAt)) &&
    Number.isFinite(Date.parse(item.addedAt)) &&
    (item.startedAt === null || typeof item.startedAt === "string") &&
    (item.completedAt === undefined ||
      item.completedAt === null ||
      typeof item.completedAt === "string")
  );
}

export function normalizeActionPlan(values: ActionPlanItem[]) {
  const unique = new Map<string, ActionPlanItem>();
  for (const item of values) {
    if (!isActionPlanItem(item)) continue;
    const normalized = {
      ...item,
      completedAt:
        item.completedAt ??
        (item.status === "completed" ? item.updatedAt : null),
    };
    const current = unique.get(item.scenarioId);
    if (
      !current ||
      Date.parse(normalized.updatedAt) > Date.parse(current.updatedAt) ||
      (Date.parse(normalized.updatedAt) === Date.parse(current.updatedAt) &&
        normalized.removed &&
        !current.removed)
    )
      unique.set(item.scenarioId, normalized);
  }
  const sorted = [...unique.values()].sort(
    (left, right) =>
      Date.parse(left.addedAt) - Date.parse(right.addedAt) ||
      left.scenarioId.localeCompare(right.scenarioId),
  );
  const active = sorted
    .filter((item) => !item.removed && item.status !== "completed")
    .slice(0, MAX_ACTIVE_ACTIONS);
  const completed = sorted
    .filter((item) => !item.removed && item.status === "completed")
    .sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt))
    .slice(-MAX_COMPLETED_ACTIONS);
  const retainedIds = new Set(
    [
      ...active,
      ...completed,
      ...sorted
        .filter((item) => item.removed)
        .sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt))
        .slice(-20),
    ].map((item) => item.scenarioId),
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
    if (item.removed || item.status !== "completed") return false;
    const completedAt = item.completedAt ?? item.updatedAt;
    return new Date(completedAt).getTime() >= threshold;
  });
}
