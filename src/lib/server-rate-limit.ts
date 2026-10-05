import "server-only";
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabasePublishableKey } from "@/lib/supabase/config";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isRateLimited, requestIp, retryAfterSeconds } from "@/lib/rate-limit";

export async function rateLimitResponse(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
): Promise<Response | null> {
  const scopedKey = process.env.SUPABASE_RATE_LIMIT_KEY;
  let limited: boolean;
  try {
    const client =
      scopedKey && supabaseUrl && supabasePublishableKey
        ? createClient(supabaseUrl, supabasePublishableKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : createSupabaseAdminClient();
    const secret =
      scopedKey ??
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (client && secret) {
      // Store only an IP HMAC. The scoped secret goes to Supabase, never the browser.
      const hash = createHmac("sha256", secret)
        .update(`${scope}:${requestIp(request)}`)
        .digest("hex");
      const { data, error } = await client.rpc(
        scopedKey ? "consume_server_request_limit" : "consume_request_limit",
        {
          ...(scopedKey ? { p_server_key: scopedKey } : {}),
          p_scope: scope,
          p_identifier_hash: hash,
          p_limit: limit,
          p_window_ms: windowMs,
        },
      );
      if (error || typeof data !== "boolean")
        throw new Error("rate_limit_store_unavailable");
      limited = data;
    } else if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      throw new Error("rate_limit_store_not_configured");
    } else {
      limited = isRateLimited(scope, requestIp(request), limit, windowMs);
    }
  } catch {
    // Do not silently remove protection during an outage or misconfiguration.
    return Response.json(
      { error: "protection_unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store", "Retry-After": "30" },
      },
    );
  }
  if (!limited) return null;
  return Response.json(
    { error: "rate_limit" },
    {
      status: 429,
      headers: {
        "Cache-Control": "private, no-store",
        "Retry-After": String(retryAfterSeconds(windowMs)),
      },
    },
  );
}
