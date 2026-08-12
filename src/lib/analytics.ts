"use client";

import { track } from "@vercel/analytics";

export type QuestionnaireChapter =
  | "profil"
  | "deplacements"
  | "logement"
  | "quotidien";

type CarbonEvent =
  | { name: "Accueil consulté" }
  | { name: "CTA bilan cliqué" }
  | { name: "Questionnaire démarré" }
  | {
      name: "Questionnaire abandonné";
      data: { chapitre: QuestionnaireChapter };
    }
  | {
      name: "Questionnaire terminé";
      data: { mode: "rapide" | "précis"; dureeSecondes: number };
    }
  | { name: "Résultat consulté" }
  | { name: "Action sélectionnée"; data: { action: string } }
  | { name: "Objectif défini" }
  | { name: "Compte activé" }
  | {
      name: "Second bilan réalisé";
      data: { delai: "moins_30_jours" | "plus_30_jours" };
    };

export function secondAssessmentDelay(firstAssessmentAt: string) {
  const elapsed = Date.now() - new Date(firstAssessmentAt).getTime();
  return elapsed <= 30 * 24 * 60 * 60 * 1_000
    ? ("moins_30_jours" as const)
    : ("plus_30_jours" as const);
}

export function trackCarbonEvent(event: CarbonEvent) {
  if (typeof window === "undefined") return;
  const privacyNavigator = navigator as Navigator & {
    globalPrivacyControl?: boolean;
  };
  if (
    privacyNavigator.globalPrivacyControl === true ||
    navigator.doNotTrack === "1" ||
    localStorage.getItem("va-disable") === "1"
  )
    return;

  if ("data" in event) track(event.name, event.data);
  else track(event.name);
}

export function roundedDurationSeconds(startedAt: number) {
  const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1_000));
  return Math.round(seconds / 5) * 5;
}
