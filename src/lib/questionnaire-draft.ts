import { assessmentAnswersSchema } from "@/lib/validation";
import type { AssessmentAnswers } from "@/lib/types";

export interface QuestionnaireDraft {
  answers: AssessmentAnswers;
  index: number;
  touchedSteps: number[];
  estimatedSteps: number[];
  updatedAt: string;
}

export function parseQuestionnaireDraft(
  serialized: string | null,
  stepCount: number,
): QuestionnaireDraft | null {
  if (!serialized) return null;

  try {
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== "object") return null;
    const draft = value as Partial<QuestionnaireDraft>;
    const answers = assessmentAnswersSchema.safeParse(draft.answers);

    if (!answers.success || !Number.isInteger(draft.index)) return null;

    const normalizeSteps = (steps: unknown) =>
      Array.isArray(steps)
        ? [...new Set(steps)]
            .filter(
              (step): step is number =>
                Number.isInteger(step) && step >= 0 && step < stepCount,
            )
            .sort((left, right) => left - right)
        : [];

    return {
      answers: answers.data,
      index: Math.min(Math.max(draft.index ?? 0, 0), stepCount - 1),
      touchedSteps: normalizeSteps(draft.touchedSteps),
      estimatedSteps: normalizeSteps(draft.estimatedSteps),
      updatedAt:
        typeof draft.updatedAt === "string"
          ? draft.updatedAt
          : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}
