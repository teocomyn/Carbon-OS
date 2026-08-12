export type EmissionCategory =
  | "transport"
  | "housing"
  | "food"
  | "purchases"
  | "services";

export type Confidence = "high" | "medium" | "low";

export interface EmissionFactor {
  id: string;
  category: EmissionCategory;
  subcategory: string;
  label: string;
  value: number;
  unit: string;
  region: "FR";
  year: number;
  source: string;
  sourceUrl: string;
  lastUpdated: string;
  confidence: Confidence;
  note?: string;
}

export interface AssessmentAnswers {
  mode: "quick" | "precise";
  primaryMobility: "car" | "train" | "bike" | "transit" | "walk" | "motorcycle";
  carType: "none" | "petrol" | "diesel" | "hybrid" | "electric";
  carKm: number;
  occupancy: number;
  trainKm: number;
  shortFlights: number;
  longFlights: number;
  homeType: "apartment" | "house";
  surface: number;
  occupants: number;
  insulation: "good" | "average" | "poor";
  heating: "gas" | "electric" | "heatpump" | "fuel" | "wood" | "district";
  heatingKwh: number | null;
  electricityKwh: number | null;
  renewableElectricity: boolean;
  diet: "vegan" | "vegetarian" | "flexitarian" | "omnivore" | "meat-heavy";
  beefFrequency: 0 | 0.5 | 1.5 | 4 | 7;
  foodWaste: "low" | "medium" | "high";
  purchaseProfile: "low" | "standard" | "high";
  secondHand: "often" | "sometimes" | "never";
  deviceYears: 2 | 3 | 5;
  digitalHours: number;
  servicesProfile: "low" | "standard" | "high";
}

export interface CalculationLine {
  id: string;
  category: EmissionCategory;
  label: string;
  activity: number;
  activityUnit: string;
  factorId: string;
  factorValue: number;
  factorUnit: string;
  kgCo2e: number;
  estimated: boolean;
  explanation: string;
}

export interface CategoryResult {
  category: EmissionCategory;
  label: string;
  kgCo2e: number;
  color: string;
  lines: CalculationLine[];
}

export interface AssessmentResult {
  totalKg: number;
  lowKg: number;
  highKg: number;
  confidenceScore: number;
  categories: CategoryResult[];
  factorVersion: string;
  calculatedAt: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  savingKg: number;
  effort: "Faible" | "Modéré" | "Élevé";
  cost: "Économie" | "Neutre" | "Investissement";
  icon: string;
  rationale: string;
}

export type ActionPlanStatus = "to_try" | "in_progress" | "completed";

export interface ActionPlanItem {
  scenarioId: string;
  status: ActionPlanStatus;
  startedAt: string | null;
  addedAt: string;
  updatedAt: string;
}

export type AssessmentSource = "questionnaire" | "manual" | "imported";

export interface AssessmentSnapshot {
  id: string;
  createdAt: string;
  source: AssessmentSource;
  answers: AssessmentAnswers;
  result: AssessmentResult;
  goalKg: number;
}
