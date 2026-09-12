import { calculateAssessment } from "@/lib/calculator";
import type { AssessmentAnswers, Scenario } from "@/lib/types";

export function applyScenarioToAnswers(
  answers: AssessmentAnswers,
  scenarioId: string,
): AssessmentAnswers {
  switch (scenarioId) {
    case "electric-car":
      return answers.carType === "none" || answers.carType === "electric"
        ? answers
        : { ...answers, carType: "electric" };
    case "flight":
      return answers.longFlights > 0
        ? { ...answers, longFlights: answers.longFlights - 1 }
        : {
            ...answers,
            shortFlights: Math.max(0, answers.shortFlights - 1),
          };
    case "beef":
      return {
        ...answers,
        beefFrequency:
          answers.beefFrequency <= 0.5 ? 0 : answers.beefFrequency === 1.5 ? 0.5 : 1.5,
      };
    case "heatpump":
      return ["gas", "fuel", "electric"].includes(answers.heating)
        ? { ...answers, heating: "heatpump" }
        : answers;
    case "train": {
      if (answers.carType === "none" || answers.carKm <= 0) return answers;
      const shifted = Math.min(
        answers.carKm * 0.25,
        Math.max(0, 200_000 - answers.trainKm),
      );
      return {
        ...answers,
        carKm: answers.carKm - shifted,
        trainKm: answers.trainKm + shifted,
      };
    }
    case "second-hand":
      return { ...answers, secondHand: "often" };
    case "devices":
      return { ...answers, deviceYears: 5 };
    default:
      return answers;
  }
}

export function simulateCombinedScenarios(
  answers: AssessmentAnswers,
  scenarioIds: string[],
) {
  const uniqueIds = [...new Set(scenarioIds)];
  const next = uniqueIds.reduce(
    (current, id) => applyScenarioToAnswers(current, id),
    answers,
  );
  const before = calculateAssessment(answers);
  const after = calculateAssessment(next);
  return {
    answers: next,
    beforeKg: before.totalKg,
    afterKg: after.totalKg,
    savingKg: Math.max(0, before.totalKg - after.totalKg),
  };
}

export function identifiedScenarioPotential(
  answers: AssessmentAnswers,
  scenarios: Scenario[],
) {
  return simulateCombinedScenarios(
    answers,
    scenarios.map((scenario) => scenario.id),
  );
}

export function buildScenarios(answers: AssessmentAnswers): Scenario[] {
  const current = calculateAssessment(answers);
  const scenarios: Scenario[] = [];
  const add = (scenario: Scenario) => {
    if (scenario.savingKg > 20)
      scenarios.push({ ...scenario, savingKg: Math.max(0, scenario.savingKg) });
  };

  if (answers.carType !== "none" && answers.carType !== "electric") {
    const before = current.categories.find((c) => c.category === "transport")!
      .kgCo2e;
    const after = calculateAssessment({ ...answers, carType: "electric" })
      .categories.find((c) => c.category === "transport")!.kgCo2e;
    add({
      id: "electric-car",
      title: "Passer à l’électrique au prochain renouvellement",
      description: "À kilométrage identique, avec le mix électrique français.",
      savingKg: before - after,
      effort: "Élevé",
      cost: "Investissement",
      icon: "zap",
      rationale: `Vous parcourez environ ${Math.round(answers.carKm).toLocaleString("fr-FR")} km par an avec une voiture thermique : agir au prochain renouvellement évite de remplacer un véhicule trop tôt.`,
    });
  }
  if (answers.shortFlights + answers.longFlights > 0) {
    const simulated = simulateCombinedScenarios(answers, ["flight"]);
    add({
      id: "flight",
      title: answers.longFlights
        ? "Éviter un aller-retour long-courrier"
        : "Remplacer un vol européen par le train",
      description: "Le levier le plus immédiat dans votre mobilité aérienne.",
      savingKg: simulated.savingKg,
      effort: "Modéré",
      cost: "Neutre",
      icon: "plane",
      rationale:
        "Vous avez indiqué au moins un trajet en avion : c’est un poste ponctuel sur lequel une seule décision peut produire un effet important.",
    });
  }
  if (answers.beefFrequency > 0.5) {
    const simulated = simulateCombinedScenarios(answers, ["beef"]);
    add({
      id: "beef",
      title: "Réduire le bœuf d’un cran",
      description:
        "Remplacer les portions par des protéines végétales ou de la volaille.",
      savingKg: simulated.savingKg,
      effort: "Faible",
      cost: "Économie",
      icon: "sprout",
      rationale:
        "La fréquence déclarée fait du bœuf un levier alimentaire significatif, avec une mise en œuvre progressive et peu coûteuse.",
    });
  }
  if (["gas", "fuel", "electric"].includes(answers.heating)) {
    const before = current.categories.find((c) => c.category === "housing")!
      .kgCo2e;
    const after = calculateAssessment({ ...answers, heating: "heatpump" })
      .categories.find((c) => c.category === "housing")!.kgCo2e;
    add({
      id: "heatpump",
      title: "Étudier une pompe à chaleur",
      description:
        "À prioriser avec l’isolation et un dimensionnement professionnel.",
      savingKg: before - after,
      effort: "Élevé",
      cost: "Investissement",
      icon: "home",
      rationale: `Votre chauffage actuel (${answers.heating === "fuel" ? "fioul" : answers.heating === "gas" ? "gaz" : "électrique"}) laisse apparaître un potentiel important, à confirmer par un professionnel et après examen de l’isolation.`,
    });
  }
  if (answers.carType !== "none" && answers.carKm > 2000) {
    const simulated = simulateCombinedScenarios(answers, ["train"]);
    add({
      id: "train",
      title: "Basculer 25 % des kilomètres vers le train",
      description: "Ciblez d’abord les trajets interurbains réguliers.",
      savingKg: simulated.savingKg,
      effort: "Modéré",
      cost: "Neutre",
      icon: "train",
      rationale:
        "Votre kilométrage automobile permet de commencer par quelques trajets répétitifs, sans changer toute votre mobilité d’un coup.",
    });
  }
  if (answers.secondHand !== "often") {
    const simulated = simulateCombinedScenarios(answers, ["second-hand"]);
    add({
      id: "second-hand",
      title: "Choisir la seconde main en priorité",
      description: "Commencer par les vêtements, le mobilier et l’électronique.",
      savingKg: simulated.savingKg,
      effort: "Faible",
      cost: "Économie",
      icon: "repeat",
      rationale:
        "Vos achats ne sont pas encore majoritairement de seconde main : c’est un levier accessible, réversible et généralement économique.",
    });
  }
  if (answers.deviceYears < 5) {
    const simulated = simulateCombinedScenarios(answers, ["devices"]);
    add({
      id: "devices",
      title: "Garder vos appareils 5 ans",
      description: "Protéger, réparer et différer le prochain renouvellement.",
      savingKg: simulated.savingKg,
      effort: "Faible",
      cost: "Économie",
      icon: "smartphone",
      rationale: `Vous renouvelez actuellement vos appareils environ tous les ${answers.deviceYears} ans : prolonger leur durée de vie réduit fabrication et dépenses.`,
    });
  }

  return scenarios.sort((a, b) => b.savingKg - a.savingKg);
}
