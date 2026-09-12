import { mergeActionPlans } from "@/lib/action-plan";
import { mergeHistories } from "@/lib/history";
import type { ActionPlanItem, AssessmentSnapshot } from "@/lib/types";

export type CloudSyncState = {
  history: AssessmentSnapshot[];
  goalKg: number | null;
  actionPlan: ActionPlanItem[];
};

export async function syncHistoryWithCloud(
  history: AssessmentSnapshot[],
  goalKg: number,
  actionPlan: ActionPlanItem[],
  preferCloudGoal = false,
) {
  const cloudResponse = await fetch("/api/sync", {
    headers: { Accept: "application/json" },
  });
  if (cloudResponse.status === 401 || cloudResponse.status === 503) return null;
  if (!cloudResponse.ok) throw new Error("sync_read_failed");
  const cloud = (await cloudResponse.json()) as {
    configured: boolean;
    authenticated: boolean;
    history: AssessmentSnapshot[];
    goalKg: number | null;
    actionPlan: ActionPlanItem[];
  };
  if (!cloud.configured || !cloud.authenticated) return null;
  const merged = mergeHistories(history, cloud.history);
  const resolvedGoal =
    preferCloudGoal && cloud.goalKg && cloud.goalKg >= 500
      ? cloud.goalKg
      : goalKg;

  const mergedPlan = mergeActionPlans(actionPlan, cloud.actionPlan ?? []);
  const response = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      history: merged,
      goalKg: resolvedGoal,
      actionPlan: mergedPlan,
    }),
  });
  if (response.status === 401 || response.status === 503) return null;
  if (!response.ok) throw new Error("sync_failed");
  return (await response.json()) as CloudSyncState;
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
