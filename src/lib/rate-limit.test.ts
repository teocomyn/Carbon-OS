import { describe, expect, it } from "vitest";
import { hasTrustedOrigin, isRateLimited } from "@/lib/rate-limit";

describe("isRateLimited", () => {
  it("allows traffic inside the window then blocks the extra request", () => {
    const scope = `test-${Date.now()}`;
    expect(isRateLimited(scope, "user", 2, 60_000)).toBe(false);
    expect(isRateLimited(scope, "user", 2, 60_000)).toBe(false);
    expect(isRateLimited(scope, "user", 2, 60_000)).toBe(true);
    expect(isRateLimited(scope, "other", 2, 60_000)).toBe(false);
  });
});

describe("hasTrustedOrigin", () => {
  it("accepts the same origin and rejects a missing or foreign one", () => {
    const url = "https://carbon-os.example/api/sync";
    expect(
      hasTrustedOrigin(
        new Request(url, { headers: { origin: "https://carbon-os.example" } }),
      ),
    ).toBe(true);
    expect(hasTrustedOrigin(new Request(url))).toBe(false);
    expect(
      hasTrustedOrigin(
        new Request(url, { headers: { origin: "https://evil.example" } }),
      ),
    ).toBe(false);
  });
});
