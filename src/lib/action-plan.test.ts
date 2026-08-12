import { describe, expect, it } from "vitest";
import {
  completedActionsSince,
  mergeActionPlans,
  parseActionPlan,
} from "@/lib/action-plan";
import type { ActionPlanItem } from "@/lib/types";

const item = (scenarioId: string, updatedAt: string): ActionPlanItem => ({
  scenarioId,
  status: "to_try",
  startedAt: null,
  completedAt: null,
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

  it("limits active actions to three while retaining completed actions", () => {
    const completed = {
      ...item("done", "2026-08-12T11:00:00.000Z"),
      status: "completed" as const,
      completedAt: "2026-08-12T11:00:00.000Z",
    };
    const merged = mergeActionPlans(
      [completed, item("a", "2026-08-12T10:00:00.000Z")],
      [
        item("b", "2026-08-12T10:00:00.000Z"),
        item("c", "2026-08-12T10:00:00.000Z"),
        item("d", "2026-08-12T10:00:00.000Z"),
      ],
    );
    expect(merged.filter((entry) => entry.status !== "completed")).toHaveLength(
      3,
    );
    expect(merged.some((entry) => entry.scenarioId === "done")).toBe(true);
  });

  it("migrates legacy completed actions and finds recent completions", () => {
    const parsed = parseActionPlan(
      JSON.stringify([
        {
          ...item("train", "2026-08-12T11:00:00.000Z"),
          status: "completed",
          completedAt: undefined,
        },
      ]),
    );
    expect(parsed[0]?.completedAt).toBe("2026-08-12T11:00:00.000Z");
    expect(
      completedActionsSince(parsed, "2026-08-12T10:30:00.000Z"),
    ).toHaveLength(1);
  });
});
