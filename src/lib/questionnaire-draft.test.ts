import { describe, expect, it } from "vitest";
import { defaultAnswers } from "@/data/defaults";
import { parseQuestionnaireDraft } from "@/lib/questionnaire-draft";

describe("parseQuestionnaireDraft", () => {
  it("restores a valid draft and normalizes step lists", () => {
    const draft = parseQuestionnaireDraft(
      JSON.stringify({
        answers: defaultAnswers,
        index: 4,
        touchedSteps: [4, 1, 1, 99],
        estimatedSteps: [3, -1],
        updatedAt: "2026-08-12T12:00:00.000Z",
      }),
      11,
    );

    expect(draft?.index).toBe(4);
    expect(draft?.touchedSteps).toEqual([1, 4]);
    expect(draft?.estimatedSteps).toEqual([3]);
  });

  it("rejects malformed answers", () => {
    expect(
      parseQuestionnaireDraft(JSON.stringify({ answers: {}, index: 2 }), 11),
    ).toBeNull();
  });

  it("clamps the restored step", () => {
    const draft = parseQuestionnaireDraft(
      JSON.stringify({ answers: defaultAnswers, index: 42 }),
      11,
    );
    expect(draft?.index).toBe(10);
  });
});
