import { mergeActionPlans, parseActionPlan } from "@/lib/action-plan";
import {
  mergeHistories,
  readLocalHistory,
  writeLocalHistory,
} from "@/lib/history";
import {
  readBrowserStorage,
  writeBrowserStorage,
  removeBrowserStorage,
} from "@/lib/browser-storage";
import {
  ACTION_PLAN_STORAGE_KEY,
  GOAL_STORAGE_KEY,
  STORAGE_KEY,
  QUESTIONNAIRE_DRAFT_KEY,
} from "@/data/defaults";
import { enrichActionPlan } from "@/lib/plan-helpers";
import { parseQuestionnaireDraft } from "@/lib/questionnaire-draft";
import type { ActionPlanItem, AssessmentSnapshot, Scenario } from "@/lib/types";

export type CloudSyncState = {
  deletedAt?: string | null;
  history: AssessmentSnapshot[];
  goalKg: number | null;
  actionPlan: ActionPlanItem[];
};

export function afterCloudDeletion(
  state: CloudSyncState,
  deletedAt: string | null | undefined,
): CloudSyncState {
  if (!deletedAt) return state;
  const cutoff = Date.parse(deletedAt);
  return {
    ...state,
    deletedAt,
    history: state.history.filter(
      (entry) =>
        entry.source !== "imported" && Date.parse(entry.createdAt) > cutoff,
    ),
    actionPlan: state.actionPlan.filter(
      (entry) => Date.parse(entry.updatedAt) > cutoff,
    ),
  };
}

// A response can arrive after another local edit. Merge against storage NOW,
// not against the state captured when the network request began.
export function applyCloudSyncLocally(
  cloud: CloudSyncState,
  goalAtSyncStart: string | null,
  scenarios: Scenario[],
) {
  const local = afterCloudDeletion(
    {
      history: readLocalHistory(),
      actionPlan: parseActionPlan(readBrowserStorage(ACTION_PLAN_STORAGE_KEY)),
      goalKg: null,
    },
    cloud.deletedAt,
  );
  const history = writeLocalHistory(
    mergeHistories(local.history, cloud.history),
  );
  if (cloud.deletedAt && !history.length) {
    removeBrowserStorage(STORAGE_KEY);
    const draft = parseQuestionnaireDraft(
      readBrowserStorage(QUESTIONNAIRE_DRAFT_KEY),
      Number.MAX_SAFE_INTEGER,
    );
    if (!draft || Date.parse(draft.updatedAt) <= Date.parse(cloud.deletedAt))
      removeBrowserStorage(QUESTIONNAIRE_DRAFT_KEY);
  }
  const actionPlan = enrichActionPlan(
    mergeActionPlans(local.actionPlan, cloud.actionPlan),
    scenarios,
  );
  writeBrowserStorage(ACTION_PLAN_STORAGE_KEY, JSON.stringify(actionPlan));
  const currentGoal = readBrowserStorage(GOAL_STORAGE_KEY);
  if (
    currentGoal === goalAtSyncStart &&
    cloud.goalKg &&
    cloud.goalKg >= 500 &&
    cloud.goalKg <= 100_000
  )
    writeBrowserStorage(GOAL_STORAGE_KEY, String(cloud.goalKg));
  const storedGoal = Number(readBrowserStorage(GOAL_STORAGE_KEY));
  return {
    history,
    actionPlan,
    goalKg: storedGoal >= 500 && storedGoal <= 100_000 ? storedGoal : null,
  };
}

let syncQueue: Promise<unknown> = Promise.resolve();
let syncEpoch = 0;

export function syncHistoryWithCloud(
  history: AssessmentSnapshot[],
  goalKg: number,
  actionPlan: ActionPlanItem[],
  preferCloudGoal = false,
) {
  // Serialize the entire read/merge/write cycle, not just the POST.
  // Recover the queue after failures so a retry can still run.
  const epoch = syncEpoch;
  const task = syncQueue
    .catch(() => undefined)
    .then(async () => {
      if (epoch !== syncEpoch) return null;
      const cloud = await performSync(
        history,
        goalKg,
        actionPlan,
        preferCloudGoal,
        epoch,
      );
      return epoch === syncEpoch ? cloud : null;
    });
  syncQueue = task;
  return task;
}

export function deleteCloudHistory() {
  // Invalidate pending uploads and delete only after the in-flight upload ends.
  syncEpoch += 1;
  const task = syncQueue
    .catch(() => undefined)
    .then(() => fetch("/api/sync", { method: "DELETE" }));
  syncQueue = task;
  return task;
}

async function performSync(
  history: AssessmentSnapshot[],
  goalKg: number,
  actionPlan: ActionPlanItem[],
  preferCloudGoal = false,
  epoch = syncEpoch,
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
    deletedAt?: string | null;
  };
  if (!cloud.configured || !cloud.authenticated) return null;
  if (epoch !== syncEpoch) return null;
  const local = afterCloudDeletion(
    { history, actionPlan, goalKg },
    cloud.deletedAt,
  );
  const merged = mergeHistories(local.history, cloud.history);
  const resolvedGoal =
    preferCloudGoal && cloud.goalKg && cloud.goalKg >= 500
      ? cloud.goalKg
      : cloud.deletedAt && !local.history.length && !local.actionPlan.length
        ? (cloud.goalKg ?? 5000)
        : goalKg;

  const mergedPlan = mergeActionPlans(local.actionPlan, cloud.actionPlan ?? []);
  const response = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deletedAt: cloud.deletedAt ?? null,
      history: merged,
      goalKg: resolvedGoal,
      actionPlan: mergedPlan,
    }),
  });
  if (response.status === 401 || response.status === 503)
    throw new Error("sync_session_or_service_unavailable");
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
