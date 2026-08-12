import { FACTOR_VERSION, factorById } from "@/data/emission-factors";
import type {
  AssessmentAnswers,
  AssessmentResult,
  CalculationLine,
  EmissionCategory,
} from "@/lib/types";

const categoryMeta: Record<EmissionCategory, { label: string; color: string }> =
  {
    transport: { label: "Transport", color: "#7568ff" },
    housing: { label: "Logement", color: "#ff9f66" },
    food: { label: "Alimentation", color: "#ef6cae" },
    purchases: { label: "Achats", color: "#43b9c5" },
    services: { label: "Services", color: "#8b95a7" },
  };

function line(
  id: string,
  category: EmissionCategory,
  label: string,
  activity: number,
  activityUnit: string,
  factorId: string,
  estimated: boolean,
  explanation: string,
): CalculationLine {
  const factor = factorById[factorId];
  if (!factor) throw new Error(`Unknown emission factor: ${factorId}`);
  return {
    id,
    category,
    label,
    activity,
    activityUnit,
    factorId,
    factorValue: factor.value,
    factorUnit: factor.unit,
    kgCo2e: activity * factor.value,
    estimated,
    explanation,
  };
}

const heatingFactor: Record<AssessmentAnswers["heating"], string> = {
  gas: "gas",
  electric: "electricity",
  heatpump: "electricity",
  fuel: "fuel",
  wood: "wood",
  district: "district",
};

export function calculateAssessment(a: AssessmentAnswers): AssessmentResult {
  const lines: CalculationLine[] = [];

  if (a.carType !== "none" && a.carKm > 0) {
    const id = `car-${a.carType}`;
    lines.push(
      line(
        "car",
        "transport",
        "Voiture",
        a.carKm / Math.max(a.occupancy, 1),
        "passager.km/an",
        id,
        a.mode === "quick",
        `${a.carKm.toLocaleString("fr-FR")} km répartis entre ${a.occupancy.toLocaleString("fr-FR")} occupant(s).`,
      ),
    );
  }
  if (a.primaryMobility === "motorcycle") {
    lines.push(
      line(
        "motorcycle",
        "transport",
        "Moto",
        5000,
        "km/an",
        "motorcycle",
        true,
        "Distance annuelle estimée en mode rapide.",
      ),
    );
  }
  if (a.primaryMobility === "transit") {
    lines.push(
      line(
        "transit",
        "transport",
        "Transports publics",
        4000,
        "passager.km/an",
        "transit",
        true,
        "Distance annuelle estimée à partir du mode principal.",
      ),
    );
  }
  if (a.primaryMobility === "bike") {
    lines.push(
      line(
        "bike",
        "transport",
        "Vélo",
        2500,
        "km/an",
        "bike",
        true,
        "Fabrication amortie incluse.",
      ),
    );
  }
  if (a.trainKm > 0)
    lines.push(
      line(
        "train",
        "transport",
        "Train",
        a.trainKm,
        "passager.km/an",
        "train-tgv",
        a.mode === "quick",
        "Proxy TGV France, infrastructure incluse.",
      ),
    );
  if (a.shortFlights > 0)
    lines.push(
      line(
        "short-flights",
        "transport",
        "Vols courts",
        a.shortFlights * 1200,
        "passager.km/an",
        "flight",
        true,
        `${a.shortFlights} aller-retour d'environ 600 km par trajet.`,
      ),
    );
  if (a.longFlights > 0)
    lines.push(
      line(
        "long-flights",
        "transport",
        "Vols long-courriers",
        a.longFlights * 14000,
        "passager.km/an",
        "flight",
        true,
        `${a.longFlights} aller-retour d'environ 7 000 km par trajet ; proxy avion ADEME.`,
      ),
    );

  const intensity = { good: 75, average: 140, poor: 220 }[a.insulation];
  const occupants = Math.max(a.occupants, 1);
  const estimatedHeatNeed = (a.surface * intensity) / occupants;
  const declaredHeatingPerPerson =
    a.heatingKwh === null ? null : a.heatingKwh / occupants;
  const heatingActivity =
    declaredHeatingPerPerson ??
    (a.heating === "heatpump" ? estimatedHeatNeed / 3 : estimatedHeatNeed);
  lines.push(
    line(
      "heating",
      "housing",
      "Chauffage",
      heatingActivity,
      "kWh/an/personne",
      heatingFactor[a.heating],
      a.heatingKwh === null,
      a.heatingKwh === null
        ? `Estimation : ${a.surface} m² × ${intensity} kWh/m², divisée entre ${a.occupants} occupant(s)${a.heating === "heatpump" ? ", puis corrigée avec un COP conventionnel de 3" : ""}.`
        : `Consommation totale déclarée (${a.heatingKwh.toLocaleString("fr-FR")} kWh), divisée entre ${a.occupants} occupant(s).`,
    ),
  );
  const electricity =
    (a.electricityKwh ?? (a.homeType === "house" ? 3200 : 2300)) /
    Math.max(a.occupants, 1);
  const renewableMultiplier = a.renewableElectricity ? 0.9 : 1;
  lines.push(
    line(
      "electricity",
      "housing",
      "Électricité hors chauffage",
      electricity * renewableMultiplier,
      "kWh/an/personne",
      "electricity",
      a.electricityKwh === null,
      a.renewableElectricity
        ? "Contrat renouvelable : correction prudente de 10 %, le réseau reste mutualisé."
        : "Mix électrique français.",
    ),
  );

  const dietActivity = {
    vegan: { plants: 365, dairy: 0, pork: 0, chicken: 0 },
    vegetarian: { plants: 330, dairy: 95, pork: 0, chicken: 0 },
    flexitarian: { plants: 300, dairy: 90, pork: 18, chicken: 24 },
    omnivore: { plants: 275, dairy: 105, pork: 32, chicken: 42 },
    "meat-heavy": { plants: 245, dairy: 115, pork: 50, chicken: 60 },
  }[a.diet];
  const wasteMultiplier = { low: 1, medium: 1.08, high: 1.2 }[a.foodWaste];
  lines.push(
    line(
      "plants",
      "food",
      "Base végétale",
      dietActivity.plants * wasteMultiplier,
      "kg d'aliments/an",
      "plant-food",
      true,
      "Panier agrégé de céréales, légumineuses, fruits et légumes.",
    ),
  );
  if (dietActivity.dairy)
    lines.push(
      line(
        "dairy",
        "food",
        "Produits laitiers & œufs",
        dietActivity.dairy * wasteMultiplier,
        "kg/an",
        "dairy",
        true,
        "Quantité estimée selon le régime déclaré.",
      ),
    );
  if (dietActivity.pork)
    lines.push(
      line(
        "pork",
        "food",
        "Porc",
        dietActivity.pork * wasteMultiplier,
        "kg/an",
        "pork",
        true,
        "Quantité estimée selon le régime déclaré.",
      ),
    );
  if (dietActivity.chicken)
    lines.push(
      line(
        "chicken",
        "food",
        "Volaille",
        dietActivity.chicken * wasteMultiplier,
        "kg/an",
        "chicken",
        true,
        "Quantité estimée selon le régime déclaré.",
      ),
    );
  if (a.beefFrequency > 0)
    lines.push(
      line(
        "beef",
        "food",
        "Bœuf",
        a.beefFrequency * 0.15 * 52 * wasteMultiplier,
        "kg/an",
        "beef",
        false,
        `${a.beefFrequency} portion(s) de 150 g par semaine.`,
      ),
    );

  const purchaseFactorId = `purchases-${a.purchaseProfile}`;
  const secondHandMultiplier = { often: 0.72, sometimes: 0.9, never: 1 }[
    a.secondHand
  ];
  const longevityMultiplier = { 2: 1.18, 3: 1, 5: 0.82 }[a.deviceYears];
  lines.push(
    line(
      "purchases",
      "purchases",
      "Vêtements, équipements & objets",
      secondHandMultiplier * longevityMultiplier,
      "profil.an",
      purchaseFactorId,
      true,
      "Forfait officiel NGC ajusté par la seconde main et la durée de vie des appareils.",
    ),
  );

  lines.push(
    line(
      "public-services",
      "services",
      "Services publics",
      1,
      "personne.an",
      "public-services",
      false,
      "Part individuelle des services mutualisés dans le modèle national.",
    ),
  );
  lines.push(
    line(
      "market-services",
      "services",
      "Services marchands",
      1,
      "personne.an",
      `market-services-${a.servicesProfile}`,
      true,
      "Banque, assurance, santé privée, télécoms et loisirs selon le profil déclaré.",
    ),
  );
  lines.push(
    line(
      "digital",
      "services",
      "Usages numériques",
      a.digitalHours * 365,
      "heures/an",
      "digital-hour",
      true,
      "Streaming, cloud et réseau ; les terminaux sont comptés dans les achats.",
    ),
  );

  const categories = (Object.keys(categoryMeta) as EmissionCategory[]).map(
    (category) => {
      const categoryLines = lines.filter((item) => item.category === category);
      return {
        category,
        ...categoryMeta[category],
        kgCo2e: categoryLines.reduce((sum, item) => sum + item.kgCo2e, 0),
        lines: categoryLines.sort((x, y) => y.kgCo2e - x.kgCo2e),
      };
    },
  );
  const totalKg = categories.reduce((sum, item) => sum + item.kgCo2e, 0);
  const measuredInputs = [
    a.heatingKwh !== null,
    a.electricityKwh !== null,
    a.mode === "precise",
  ].filter(Boolean).length;
  const confidenceScore = Math.min(91, 68 + measuredInputs * 7);
  const uncertainty = 0.2 - measuredInputs * 0.025;

  return {
    totalKg,
    lowKg: totalKg * (1 - uncertainty),
    highKg: totalKg * (1 + uncertainty),
    confidenceScore,
    categories,
    factorVersion: FACTOR_VERSION,
    calculatedAt: new Date().toISOString(),
  };
}
