import { describe, expect, it } from "vitest";
import { parseProductFeedback } from "@/lib/product-feedback";

describe("parseProductFeedback", () => {
  it("rejects missing or garbage payloads", () => {
    expect(parseProductFeedback(null)).toBeNull();
    expect(parseProductFeedback("{")).toBeNull();
    expect(parseProductFeedback(JSON.stringify({ clarte: "haute" }))).toBeNull();
  });

  it("accepts a complete local feedback payload", () => {
    const stored = parseProductFeedback(
      JSON.stringify({
        clarte: "haute",
        confiance: "moyenne",
        suite: "action",
        submittedAt: "2026-09-12T10:00:00.000Z",
      }),
    );

    expect(stored).toEqual({
      clarte: "haute",
      confiance: "moyenne",
      suite: "action",
      submittedAt: "2026-09-12T10:00:00.000Z",
    });
  });
});
