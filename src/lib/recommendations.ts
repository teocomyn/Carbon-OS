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
    add({ id: "electric-car", title: "Passer à l’électrique au prochain renouvellement", description: "À kilométrage identique, avec le mix électrique français.", savingKg: before - after, effort: "Élevé", cost: "Investissement", icon: "zap", rationale: `Vous parcourez environ ${Math.round(answers.carKm).toLocaleString("fr-FR")} km par an avec une voiture thermique : agir au prochain renouvellement évite de remplacer un véhicule trop tôt.` });
  }
  if (answers.shortFlights + answers.longFlights > 0) {
    const saving = Math.max(
      answers.longFlights > 0 ? 14000 * factorById.flight.value : 1200 * factorById.flight.value,
      0,
    );
    add({ id: "flight", title: answers.longFlights ? "Éviter un aller-retour long-courrier" : "Remplacer un vol européen par le train", description: "Le levier le plus immédiat dans votre mobilité aérienne.", savingKg: saving, effort: "Modéré", cost: "Neutre", icon: "plane", rationale: "Vous avez indiqué au moins un trajet en avion : c’est un poste ponctuel sur lequel une seule décision peut produire un effet important." });
  }
  if (answers.beefFrequency > 0.5) {
    add({ id: "beef", title: "Réduire le bœuf de 80 %", description: "Remplacer les portions par des protéines végétales ou de la volaille.", savingKg: answers.beefFrequency * 0.15 * 52 * (factorById.beef.value - factorById["plant-food"].value) * 0.8, effort: "Faible", cost: "Économie", icon: "sprout", rationale: "La fréquence déclarée fait du bœuf un levier alimentaire significatif, avec une mise en œuvre progressive et peu coûteuse." });
  }
  if (["gas", "fuel", "electric"].includes(answers.heating)) {
    const before = current.categories.find((c) => c.category === "housing")!.kgCo2e;
    const after = calculateAssessment({ ...answers, heating: "heatpump" }).categories.find((c) => c.category === "housing")!.kgCo2e;
    add({ id: "heatpump", title: "Étudier une pompe à chaleur", description: "À prioriser avec l’isolation et un dimensionnement professionnel.", savingKg: before - after, effort: "Élevé", cost: "Investissement", icon: "home", rationale: `Votre chauffage actuel (${answers.heating === "fuel" ? "fioul" : answers.heating === "gas" ? "gaz" : "électrique"}) laisse apparaître un potentiel important, à confirmer par un professionnel et après examen de l’isolation.` });
  }
  if (answers.carType !== "none" && answers.carKm > 2000) {
    const replacedKm = answers.carKm * 0.25;
    const carFactor = factorById[`car-${answers.carType}`]?.value ?? factorById["car-petrol"].value;
    add({ id: "train", title: "Basculer 25 % des kilomètres vers le train", description: "Ciblez d’abord les trajets interurbains réguliers.", savingKg: replacedKm * (carFactor / Math.max(answers.occupancy, 1) - factorById["train-tgv"].value), effort: "Modéré", cost: "Neutre", icon: "train", rationale: "Votre kilométrage automobile permet de commencer par quelques trajets répétitifs, sans changer toute votre mobilité d’un coup." });
  }
  if (answers.secondHand !== "often") {
    const purchases = current.categories.find((c) => c.category === "purchases")!.kgCo2e;
    add({ id: "second-hand", title: "Choisir la seconde main en priorité", description: "Commencer par les vêtements, le mobilier et l’électronique.", savingKg: purchases * 0.2, effort: "Faible", cost: "Économie", icon: "repeat", rationale: "Vos achats ne sont pas encore majoritairement de seconde main : c’est un levier accessible, réversible et généralement économique." });
  }
  if (answers.deviceYears < 5) {
    const purchases = current.categories.find((c) => c.category === "purchases")!.kgCo2e;
    add({ id: "devices", title: "Garder vos appareils 5 ans", description: "Protéger, réparer et différer le prochain renouvellement.", savingKg: purchases * 0.12, effort: "Faible", cost: "Économie", icon: "smartphone", rationale: `Vous renouvelez actuellement vos appareils environ tous les ${answers.deviceYears} ans : prolonger leur durée de vie réduit fabrication et dépenses.` });
  }

  return scenarios.sort((a, b) => b.savingKg - a.savingKg);
}
