import type { AssessmentAnswers } from "@/lib/types";

export const defaultAnswers: AssessmentAnswers = {
  mode: "quick",
  primaryMobility: "car",
  carType: "petrol",
  carKm: 10000,
  occupancy: 1.4,
  trainKm: 1200,
  shortFlights: 1,
  longFlights: 0,
  homeType: "apartment",
  surface: 65,
  occupants: 2,
  insulation: "average",
  heating: "gas",
  heatingKwh: null,
  electricityKwh: null,
  renewableElectricity: false,
  diet: "flexitarian",
  beefFrequency: 1.5,
  foodWaste: "medium",
  purchaseProfile: "standard",
  secondHand: "sometimes",
  deviceYears: 3,
  digitalHours: 3,
  servicesProfile: "standard",
};

export const STORAGE_KEY = "carbon-os-assessment-v1";
export const QUESTIONNAIRE_DRAFT_KEY = "carbon-os-questionnaire-draft-v1";
export const GOAL_STORAGE_KEY = "carbon-os-goal-v1";
export const HISTORY_STORAGE_KEY = "carbon-os-history-v1";
export const ACTION_PLAN_STORAGE_KEY = "carbon-os-action-plan-v1";
export const MAX_HISTORY_ENTRIES = 50;
