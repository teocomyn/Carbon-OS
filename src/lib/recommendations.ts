import { factorById } from "@/data/emission-factors";
import { calculateAssessment } from "@/lib/calculator";
import type { AssessmentAnswers, Scenario } from "@/lib/types";

export function buildScenarios(answers: AssessmentAnswers): Scenario[] {
  const current = calculateAssessment(answers);
  const scenarios: Scenario[] = [];
  const add = (scenario: Scenario) => {
    if (scenario.savingKg > 20) scenarios.push({ ...scenario, savingKg: Math.max(0, scenario.savingKg) });
  };

  if (answers.carType !== "none" && answers.carType !== "electric") {
    const before = current.categories.find((c) => c.category === "transport")!.kgCo2e;
    const after = calculateAssessment({ ...answers, carType: "electric" }).categories.find((c) => c.category === "transport")!.kgCo2e;
    add({ id: "electric-car", title: "Passer à l’électrique au prochain renouvellement", description: "À kilométrage identique, avec le mix électrique français.", savingKg: before - after, effort: "Élevé", cost: "Investissement", icon: "zap" });
  }
  if (answers.shortFlights + answers.longFlights > 0) {
    const saving = Math.max(
      answers.longFlights > 0 ? 14000 * factorById.flight.value : 1200 * factorById.flight.value,
      0,
    );
    add({ id: "flight", title: answers.longFlights ? "Éviter un aller-retour long-courrier" : "Remplacer un vol européen par le train", description: "Le levier le plus immédiat dans votre mobilité aérienne.", savingKg: saving, effort: "Modéré", cost: "Neutre", icon: "plane" });
  }
  if (answers.beefFrequency > 0.5) {
    add({ id: "beef", title: "Réduire le bœuf de 80 %", description: "Remplacer les portions par des protéines végétales ou de la volaille.", savingKg: answers.beefFrequency * 0.15 * 52 * (factorById.beef.value - factorById["plant-food"].value) * 0.8, effort: "Faible", cost: "Économie", icon: "sprout" });
  }
  if (["gas", "fuel", "electric"].includes(answers.heating)) {
    const before = current.categories.find((c) => c.category === "housing")!.kgCo2e;
    const after = calculateAssessment({ ...answers, heating: "heatpump" }).categories.find((c) => c.category === "housing")!.kgCo2e;
    add({ id: "heatpump", title: "Étudier une pompe à chaleur", description: "À prioriser avec l’isolation et un dimensionnement professionnel.", savingKg: before - after, effort: "Élevé", cost: "Investissement", icon: "home" });
  }
  if (answers.carType !== "none" && answers.carKm > 2000) {
    const replacedKm = answers.carKm * 0.25;
    const carFactor = factorById[`car-${answers.carType}`]?.value ?? factorById["car-petrol"].value;
    add({ id: "train", title: "Basculer 25 % des kilomètres vers le train", description: "Ciblez d’abord les trajets interurbains réguliers.", savingKg: replacedKm * (carFactor / Math.max(answers.occupancy, 1) - factorById["train-tgv"].value), effort: "Modéré", cost: "Neutre", icon: "train" });
  }
  if (answers.secondHand !== "often") {
    const purchases = current.categories.find((c) => c.category === "purchases")!.kgCo2e;
    add({ id: "second-hand", title: "Choisir la seconde main en priorité", description: "Commencer par les vêtements, le mobilier et l’électronique.", savingKg: purchases * 0.2, effort: "Faible", cost: "Économie", icon: "repeat" });
  }
  if (answers.deviceYears < 5) {
    const purchases = current.categories.find((c) => c.category === "purchases")!.kgCo2e;
    add({ id: "devices", title: "Garder vos appareils 5 ans", description: "Protéger, réparer et différer le prochain renouvellement.", savingKg: purchases * 0.12, effort: "Faible", cost: "Économie", icon: "smartphone" });
  }

  return scenarios.sort((a, b) => b.savingKg - a.savingKg);
}
