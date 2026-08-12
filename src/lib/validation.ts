import { z } from "zod";

export const assessmentAnswersSchema = z.object({
  mode: z.enum(["quick", "precise"]),
  primaryMobility: z.enum([
    "car",
    "train",
    "bike",
    "transit",
    "walk",
    "motorcycle",
  ]),
  carType: z.enum(["none", "petrol", "diesel", "hybrid", "electric"]),
  carKm: z.number().min(0).max(200_000),
  occupancy: z.number().min(1).max(9),
  trainKm: z.number().min(0).max(200_000),
  shortFlights: z.number().int().min(0).max(100),
  longFlights: z.number().int().min(0).max(100),
  homeType: z.enum(["apartment", "house"]),
  surface: z.number().min(5).max(2_000),
  occupants: z.number().int().min(1).max(30),
  insulation: z.enum(["good", "average", "poor"]),
  heating: z.enum(["gas", "electric", "heatpump", "fuel", "wood", "district"]),
  heatingKwh: z.number().min(0).max(1_000_000).nullable(),
  electricityKwh: z.number().min(0).max(1_000_000).nullable(),
  renewableElectricity: z.boolean(),
  diet: z.enum([
    "vegan",
    "vegetarian",
    "flexitarian",
    "omnivore",
    "meat-heavy",
  ]),
  beefFrequency: z.union([
    z.literal(0),
    z.literal(0.5),
    z.literal(1.5),
    z.literal(4),
    z.literal(7),
  ]),
  foodWaste: z.enum(["low", "medium", "high"]),
  purchaseProfile: z.enum(["low", "standard", "high"]),
  secondHand: z.enum(["often", "sometimes", "never"]),
  deviceYears: z.union([z.literal(2), z.literal(3), z.literal(5)]),
  digitalHours: z.number().min(0).max(24),
  servicesProfile: z.enum(["low", "standard", "high"]),
});

export const syncSnapshotSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  source: z.enum(["questionnaire", "manual", "imported"]),
  answers: assessmentAnswersSchema,
  goalKg: z.number().int().min(500).max(100_000),
});

export const actionPlanItemSchema = z.object({
  scenarioId: z.string().min(1).max(64),
  status: z.enum(["to_try", "in_progress", "completed"]),
  startedAt: z.iso.date().nullable(),
  completedAt: z.iso.datetime().nullable().optional().default(null),
  addedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  title: z.string().min(1).max(180).optional(),
  description: z.string().min(1).max(500).optional(),
  estimatedSavingKg: z.number().min(0).max(100_000).optional(),
  effort: z.enum(["Faible", "Modéré", "Élevé"]).optional(),
  cost: z.enum(["Économie", "Neutre", "Investissement"]).optional(),
  rationale: z.string().min(1).max(1_000).optional(),
});

export const syncRequestSchema = z.object({
  history: z.array(syncSnapshotSchema).max(50),
  goalKg: z.number().int().min(500).max(100_000),
  actionPlan: z.array(actionPlanItemSchema).max(23),
});
