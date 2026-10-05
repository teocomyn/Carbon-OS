import { afterEach, describe, expect, it, vi } from "vitest";
import {
  afterCloudDeletion,
  applyCloudSyncLocally,
  deleteCloudHistory,
  syncHistoryWithCloud,
} from "@/lib/cloud-sync";
import { ACTION_PLAN_STORAGE_KEY, GOAL_STORAGE_KEY } from "@/data/defaults";
import { writeBrowserStorage, readBrowserStorage } from "@/lib/browser-storage";

const cloud = {
  configured: true,
  authenticated: true,
  history: [],
  goalKg: 5000,
  actionPlan: [],
};
afterEach(() => vi.unstubAllGlobals());

describe("cloud sync", () => {
  it("prunes pre-deletion data from another device before a new upload", () => {
    const before = "2026-10-05T10:00:00Z";
    const after = "2026-10-05T12:00:00Z";
    const item = {
      scenarioId: "train",
      status: "to_try" as const,
      startedAt: null,
      completedAt: null,
      addedAt: before,
      updatedAt: before,
    };
    const merged = afterCloudDeletion(
      {
        history: [],
        goalKg: 5000,
        actionPlan: [item, { ...item, scenarioId: "fresh", updatedAt: after }],
      },
      "2026-10-05T11:00:00Z",
    );
    expect(merged.actionPlan.map((item) => item.scenarioId)).toEqual(["fresh"]);
  });
  it("preserves local plan and goal edits made while an older response was in flight", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    const old = {
      scenarioId: "train",
      status: "to_try" as const,
      startedAt: null,
      completedAt: null,
      addedAt: "2026-10-05T10:00:00Z",
      updatedAt: "2026-10-05T10:00:00Z",
    };
    writeBrowserStorage(
      ACTION_PLAN_STORAGE_KEY,
      JSON.stringify([
        { ...old, status: "in_progress", updatedAt: "2026-10-05T10:05:00Z" },
      ]),
    );
    writeBrowserStorage(GOAL_STORAGE_KEY, "3500");
    const merged = applyCloudSyncLocally(
      { ...cloud, actionPlan: [old] },
      "5000",
      [],
    );
    expect(merged.actionPlan[0]?.status).toBe("in_progress");
    expect(merged.goalKg).toBe(3500);
    expect(readBrowserStorage(GOAL_STORAGE_KEY)).toBe("3500");
  });
  it("does not report success when authentication expires between read and write", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(cloud))
      .mockResolvedValueOnce(
        Response.json({ error: "unauthorized" }, { status: 401 }),
      );
    vi.stubGlobal("fetch", fetch);
    await expect(syncHistoryWithCloud([], 5000, [])).rejects.toThrow(
      "sync_session",
    );
  });

  it("serializes complete read/write cycles and recovers after a failed request", async () => {
    let resolveFirst!: (response: Response) => void;
    const gate = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    const fetch = vi
      .fn()
      .mockReturnValueOnce(gate)
      .mockResolvedValueOnce(Response.json(cloud))
      .mockResolvedValueOnce(Response.json(cloud))
      .mockResolvedValueOnce(Response.json(cloud));
    vi.stubGlobal("fetch", fetch);
    const first = syncHistoryWithCloud([], 3000, []);
    const second = syncHistoryWithCloud([], 4000, []);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    resolveFirst(Response.json(cloud));
    await Promise.all([first, second]);
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(fetch.mock.calls.map((call) => call[1]?.method ?? "GET")).toEqual([
      "GET",
      "POST",
      "GET",
      "POST",
    ]);
    expect(JSON.parse(fetch.mock.calls[3]![1]!.body).goalKg).toBe(4000);
  });

  it("keeps unauthenticated local use optional", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ configured: true, authenticated: false }),
        ),
    );
    await expect(syncHistoryWithCloud([], 5000, [])).resolves.toBeNull();
  });

  it("cancels queued uploads before deleting cloud data", async () => {
    let release!: (response: Response) => void;
    const gate = new Promise<Response>((resolve) => {
      release = resolve;
    });
    const fetch = vi
      .fn()
      .mockReturnValueOnce(gate)
      .mockResolvedValueOnce(Response.json({ success: true }));
    vi.stubGlobal("fetch", fetch);
    const active = syncHistoryWithCloud([], 5000, []);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const pending = syncHistoryWithCloud([], 3000, []);
    const deletion = deleteCloudHistory();
    release(Response.json(cloud));
    await expect(active).resolves.toBeNull();
    await expect(pending).resolves.toBeNull();
    expect((await deletion).ok).toBe(true);
    expect(fetch.mock.calls.map((call) => call[1]?.method ?? "GET")).toEqual([
      "GET",
      "DELETE",
    ]);
  });
});
