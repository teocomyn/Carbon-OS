import { defaultAnswers, STORAGE_KEY } from "@/data/defaults";
import type { AssessmentAnswers } from "@/lib/types";
import { assessmentAnswersSchema } from "@/lib/validation";

function clampDietMeat(answers: AssessmentAnswers): AssessmentAnswers {
  if (answers.diet !== "vegan" && answers.diet !== "vegetarian") return answers;
  if (answers.beefFrequency === 0) return answers;
  return { ...answers, beefFrequency: 0 };
}

export function tryNormalizeAnswers(value: unknown): AssessmentAnswers | null {
  const direct = assessmentAnswersSchema.safeParse(value);
  if (direct.success) return clampDietMeat(direct.data);
  if (!value || typeof value !== "object") return null;
  const parsed = assessmentAnswersSchema.safeParse({
    ...defaultAnswers,
    ...value,
  });
  return parsed.success ? clampDietMeat(parsed.data) : null;
}

export function normalizeAnswers(value: unknown): AssessmentAnswers {
  return tryNormalizeAnswers(value) ?? defaultAnswers;
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
  try {
    return parseStoredAnswers(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}
