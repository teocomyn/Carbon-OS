import { describe, expect, it } from "vitest";
import { FACTOR_VERSION } from "@/data/emission-factors";
import { currentFactorChangelog } from "@/data/factor-changelog";

describe("factor changelog", () => {
  it("keeps the current version documented", () => {
    expect(currentFactorChangelog().version).toBe(FACTOR_VERSION);
  });
});
