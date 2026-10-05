import { afterEach, describe, expect, it, vi } from "vitest";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc }) }));
vi.mock("@/lib/supabase/config", () => ({
  supabaseUrl: "https://test.supabase.co",
  supabasePublishableKey: "public-test-key",
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => null,
}));
import { rateLimitResponse } from "@/lib/server-rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
  rpc.mockReset();
});
const request = () =>
  new Request("https://carbon-os.example/api/sync", {
    headers: { "x-vercel-forwarded-for": "192.0.2.1" },
  });

describe("shared rate limit", () => {
  it("uses the restricted RPC and never stores a raw IP", async () => {
    vi.stubEnv("SUPABASE_RATE_LIMIT_KEY", "a".repeat(64));
    rpc.mockResolvedValue({ data: false, error: null });
    expect(await rateLimitResponse(request(), "test", 2, 1000)).toBeNull();
    const [name, args] = rpc.mock.calls[0]!;
    expect(name).toBe("consume_server_request_limit");
    expect(args.p_identifier_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(args.p_identifier_hash).not.toContain("192.0.2.1");
  });
  it("returns 429 with a retry hint when the shared counter is exhausted", async () => {
    vi.stubEnv("SUPABASE_RATE_LIMIT_KEY", "a".repeat(64));
    rpc.mockResolvedValue({ data: true, error: null });
    const response = await rateLimitResponse(request(), "test", 2, 1000);
    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("1");
  });
  it("fails closed on a store outage instead of falling back to an instance counter", async () => {
    vi.stubEnv("SUPABASE_RATE_LIMIT_KEY", "a".repeat(64));
    rpc.mockResolvedValue({ data: null, error: new Error("unavailable") });
    expect((await rateLimitResponse(request(), "test", 2, 1000))?.status).toBe(
      503,
    );
  });
  it("requires a shared store on Vercel", async () => {
    vi.stubEnv("SUPABASE_RATE_LIMIT_KEY", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("VERCEL", "1");
    expect((await rateLimitResponse(request(), "test", 2, 1000))?.status).toBe(
      503,
    );
  });
});
