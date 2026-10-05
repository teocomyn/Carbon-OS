import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readBrowserStorage,
  writeBrowserStorage,
  removeBrowserStorage,
} from "@/lib/browser-storage";
import { clearLocalData } from "@/lib/clear-local-data";
import {
  STORAGE_KEY,
  QUESTIONNAIRE_DRAFT_KEY,
  ACTION_PLAN_STORAGE_KEY,
  GOAL_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
} from "@/data/defaults";
import { PRODUCT_FEEDBACK_KEY } from "@/lib/product-feedback";

afterEach(() => vi.unstubAllGlobals());

describe("browser storage", () => {
  it("keeps the current session usable when the browser rejects reads and writes", () => {
    vi.stubGlobal("window", {
      get localStorage() {
        throw new Error("SecurityError");
      },
    });
    expect(readBrowserStorage("blocked-test")).toBeNull();
    expect(writeBrowserStorage("blocked-test", "saved in memory")).toBe(false);
    expect(readBrowserStorage("blocked-test")).toBe("saved in memory");
    removeBrowserStorage("blocked-test");
    expect(readBrowserStorage("blocked-test")).toBeNull();
  });

  it("uses memory instead of a stale value when storage is full", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => "old",
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
        removeItem: () => {},
      },
    });
    writeBrowserStorage("quota-test", "new");
    expect(readBrowserStorage("quota-test")).toBe("new");
    removeBrowserStorage("quota-test");
  });

  it("clears the assessment, draft, plan, feedback and account markers but preserves privacy preferences", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
    const keys = [
      STORAGE_KEY,
      QUESTIONNAIRE_DRAFT_KEY,
      ACTION_PLAN_STORAGE_KEY,
      GOAL_STORAGE_KEY,
      HISTORY_STORAGE_KEY,
      PRODUCT_FEEDBACK_KEY,
      "carbon-os-account-activated-tracked-v1",
    ];
    for (const key of [...keys, "va-disable", "theme"])
      writeBrowserStorage(key, "1");
    clearLocalData();
    expect(keys.every((key) => readBrowserStorage(key) === null)).toBe(true);
    expect(readBrowserStorage("va-disable")).toBe("1");
    expect(readBrowserStorage("theme")).toBe("1");
  });
});
