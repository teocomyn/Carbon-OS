import { describe, expect, it } from "vitest";
import { assessmentAnswersSchema, syncRequestSchema } from "@/lib/validation";
import { defaultAnswers } from "@/data/defaults";

describe("validation", () => {
  it("rejects a partial assessment payload", () => {
    expect(assessmentAnswersSchema.safeParse({ carKm: 10 }).success).toBe(
      false,
    );
  });

  it("rejects a sync payload missing required fields", () => {
    expect(syncRequestSchema.safeParse({ history: [] }).success).toBe(false);
    expect(
      syncRequestSchema.safeParse({
        history: [],
        goalKg: 3500,
        actionPlan: [],
      }).success,
    ).toBe(true);
    expect(
      assessmentAnswersSchema.safeParse(defaultAnswers).success,
    ).toBe(true);
  });
});
