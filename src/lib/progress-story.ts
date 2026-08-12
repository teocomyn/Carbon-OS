import { normalizeHistory } from "@/lib/history";
import type { AssessmentSnapshot, EmissionCategory } from "@/lib/types";

export interface CategoryProgressChange {
  category: EmissionCategory;
  label: string;
  previousKg: number;
  latestKg: number;
  changeKg: number;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next.toISOString();
}

export function recommendedAssessmentWindow(from: string) {
  const date = new Date(from);
  return {
    start: addMonths(date, 3),
    end: addMonths(date, 6),
  };
}

export function buildProgressStory(entries: AssessmentSnapshot[]) {
  const ordered = normalizeHistory(entries);
  const previous = ordered.at(-2);
  const latest = ordered.at(-1);
  if (!previous || !latest) return null;

  const previousCategories = new Map(
    previous.result.categories.map((category) => [category.category, category]),
  );
  const categoryChanges = latest.result.categories
    .map((category): CategoryProgressChange => {
      const previousCategory = previousCategories.get(category.category);
      const previousKg = previousCategory?.kgCo2e ?? 0;
      return {
        category: category.category,
        label: category.label,
        previousKg,
        latestKg: category.kgCo2e,
        changeKg: category.kgCo2e - previousKg,
      };
    })
    .sort((left, right) => Math.abs(right.changeKg) - Math.abs(left.changeKg));
  const changeKg = latest.result.totalKg - previous.result.totalKg;
  const changePercent =
    previous.result.totalKg > 0
      ? (changeKg / previous.result.totalKg) * 100
      : 0;

  const nextAssessment = recommendedAssessmentWindow(latest.createdAt);
  return {
    previous,
    latest,
    changeKg,
    changePercent,
    categoryChanges,
    primaryCategory: categoryChanges[0] ?? null,
    nextAssessmentStart: nextAssessment.start,
    nextAssessmentEnd: nextAssessment.end,
  };
}
