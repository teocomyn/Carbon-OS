import { describe, expect, it } from "vitest";
import { isRateLimited } from "@/lib/rate-limit";

describe("isRateLimited", () => {
  it("allows traffic inside the window then blocks the extra request", () => {
    const scope = `test-${Date.now()}`;
    expect(isRateLimited(scope, "user", 2, 60_000)).toBe(false);
    expect(isRateLimited(scope, "user", 2, 60_000)).toBe(false);
    expect(isRateLimited(scope, "user", 2, 60_000)).toBe(true);
    expect(isRateLimited(scope, "other", 2, 60_000)).toBe(false);
  });
});
