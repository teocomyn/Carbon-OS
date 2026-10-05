import { HISTORY_STORAGE_KEY, MAX_HISTORY_ENTRIES } from "@/data/defaults";
import {
  readBrowserStorage,
  writeBrowserStorage,
  removeBrowserStorage,
} from "@/lib/browser-storage";
import { tryNormalizeAnswers } from "@/lib/answers";
import { calculateAssessment } from "@/lib/calculator";
import type {
  AssessmentAnswers,
  AssessmentResult,
  AssessmentSnapshot,
  AssessmentSource,
} from "@/lib/types";

const validSources: AssessmentSource[] = [
  "questionnaire",
  "manual",
  "imported",
];

export function isAssessmentSnapshot(
  value: unknown,
): value is AssessmentSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<AssessmentSnapshot>;
  return (
    typeof snapshot.id === "string" &&
    snapshot.id.length > 0 &&
    typeof snapshot.createdAt === "string" &&
    Number.isFinite(Date.parse(snapshot.createdAt)) &&
    validSources.includes(snapshot.source as AssessmentSource) &&
    typeof snapshot.goalKg === "number" &&
    Number.isFinite(snapshot.goalKg) &&
    snapshot.goalKg >= 500 &&
    snapshot.goalKg <= 100_000 &&
    Boolean(tryNormalizeAnswers(snapshot.answers)) &&
    Boolean(
      snapshot.result &&
        typeof snapshot.result === "object" &&
        typeof snapshot.result.totalKg === "number",
    )
  );
}

export function parseHistory(serialized: string | null): AssessmentSnapshot[] {
  if (!serialized) return [];
  try {
    const value: unknown = JSON.parse(serialized);
    if (!Array.isArray(value)) return [];
    return normalizeHistory(value.filter(isAssessmentSnapshot));
  } catch {
    return [];
  }
}

export function refreshSnapshotResult(
  snapshot: AssessmentSnapshot,
): AssessmentSnapshot | null {
  const answers = tryNormalizeAnswers(snapshot.answers);
  if (!answers) return null;
  // Stored totals are untrusted, even when their version string is current.
  const result = calculateAssessment(answers);
  result.calculatedAt = snapshot.createdAt;
  return { ...snapshot, answers, result };
}

export function normalizeHistory(
  entries: AssessmentSnapshot[],
): AssessmentSnapshot[] {
  const unique = new Map<string, AssessmentSnapshot>();
  for (const entry of entries) {
    if (!isAssessmentSnapshot(entry)) continue;
    const refreshed = refreshSnapshotResult(entry);
    if (refreshed) unique.set(entry.id, refreshed);
  }
  return [...unique.values()]
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime(),
    )
    .slice(-MAX_HISTORY_ENTRIES);
}

export function mergeHistories(
  local: AssessmentSnapshot[],
  remote: AssessmentSnapshot[],
) {
  return normalizeHistory([...local, ...remote]);
}

export function createAssessmentSnapshot({
  answers,
  result,
  goalKg,
  source,
  id,
}: {
  answers: AssessmentAnswers;
  result: AssessmentResult;
  goalKg: number;
  source: AssessmentSource;
  id?: string;
}): AssessmentSnapshot {
  return {
    id: id ?? crypto.randomUUID(),
    createdAt: result.calculatedAt,
    source,
    answers,
    result,
    goalKg,
  };
}

export function readLocalHistory() {
  if (typeof window === "undefined") return [];
  return parseHistory(readBrowserStorage(HISTORY_STORAGE_KEY));
}

export function writeLocalHistory(entries: AssessmentSnapshot[]) {
  const normalized = normalizeHistory(entries);
  writeBrowserStorage(HISTORY_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function addLocalSnapshot(snapshot: AssessmentSnapshot) {
  return writeLocalHistory([...readLocalHistory(), snapshot]);
}

export function clearLocalHistory() {
  removeBrowserStorage(HISTORY_STORAGE_KEY);
}

export function calculateProgress(entries: AssessmentSnapshot[]) {
  const ordered = normalizeHistory(entries);
  const first = ordered.at(0);
  const latest = ordered.at(-1);
  const best = ordered.reduce<AssessmentSnapshot | undefined>(
    (current, entry) =>
      !current || entry.result.totalKg < current.result.totalKg
        ? entry
        : current,
    undefined,
  );
  const changeKg =
    first && latest ? latest.result.totalKg - first.result.totalKg : 0;
  const changePercent =
    first && first.result.totalKg > 0
      ? (changeKg / first.result.totalKg) * 100
      : 0;
  return { first, latest, best, changeKg, changePercent };
}
