import { describe, expect, it } from "vitest";
import { mergeActionPlans, parseActionPlan } from "@/lib/action-plan";
import type { ActionPlanItem } from "@/lib/types";

const item = (scenarioId: string, updatedAt: string): ActionPlanItem => ({
  scenarioId,
  status: "to_try",
  startedAt: null,
  addedAt: "2026-08-12T10:00:00.000Z",
  updatedAt,
});

describe("action plan", () => {
  it("rejects malformed local data", () => {
    expect(parseActionPlan('{"email":"private@example.com"}')).toEqual([]);
  });

  it("keeps the latest version of an action", () => {
    const merged = mergeActionPlans(
      [item("train", "2026-08-12T10:00:00.000Z")],
      [
        {
          ...item("train", "2026-08-12T11:00:00.000Z"),
          status: "completed",
        },
      ],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.status).toBe("completed");
  });

  it("limits the active plan to three actions", () => {
    expect(
      mergeActionPlans(
        [item("a", "2026-08-12T10:00:00.000Z")],
        [
          item("b", "2026-08-12T10:00:00.000Z"),
          item("c", "2026-08-12T10:00:00.000Z"),
          item("d", "2026-08-12T10:00:00.000Z"),
        ],
      ),
    ).toHaveLength(3);
  });
});
