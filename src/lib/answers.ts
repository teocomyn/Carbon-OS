import { defaultAnswers, STORAGE_KEY } from "@/data/defaults";
import type { AssessmentAnswers } from "@/lib/types";
import { assessmentAnswersSchema } from "@/lib/validation";

function clampDietMeat(answers: AssessmentAnswers): AssessmentAnswers {
  if (answers.diet !== "vegan" && answers.diet !== "vegetarian") return answers;
  if (answers.beefFrequency === 0) return answers;
  return { ...answers, beefFrequency: 0 };
}

export function normalizeAnswers(value: unknown): AssessmentAnswers {
  const direct = assessmentAnswersSchema.safeParse(value);
  if (direct.success) return clampDietMeat(direct.data);

  const merged =
    value && typeof value === "object"
      ? { ...defaultAnswers, ...value }
      : defaultAnswers;
  const parsed = assessmentAnswersSchema.safeParse(merged);
  return clampDietMeat(parsed.success ? parsed.data : defaultAnswers);
}

export function parseStoredAnswers(serialized: string | null) {
  if (!serialized) return null;
  try {
    const parsed = assessmentAnswersSchema.safeParse(JSON.parse(serialized));
    return parsed.success ? clampDietMeat(parsed.data) : null;
  } catch {
    return null;
  }
}

export function readStoredAnswers() {
  if (typeof window === "undefined") return null;
  return parseStoredAnswers(localStorage.getItem(STORAGE_KEY));
}

export function hasLocalAssessment() {
  return Boolean(readStoredAnswers());
}
