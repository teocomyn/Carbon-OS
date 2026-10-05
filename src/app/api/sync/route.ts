import { NextResponse } from "next/server";
import { calculateAssessment } from "@/lib/calculator";
import { normalizeHistory } from "@/lib/history";
import { readBoundedJson, RequestBodyTooLarge } from "@/lib/request-body";
import type { ActionPlanItem, AssessmentSnapshot } from "@/lib/types";
import { hasTrustedOrigin } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/server-rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { syncRequestSchema } from "@/lib/validation";

const SYNC_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const SYNC_RATE_LIMIT_REQUESTS = 20;

export const dynamic = "force-dynamic";

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

async function authenticatedClient() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "not_configured" as const };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };
  return { supabase, user };
}

async function readCloudState(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  userId: string,
) {
  const [
    { data: rows, error },
    { data: preferences, error: preferenceReadError },
  ] = await Promise.all([
    supabase
      .from("assessments")
      .select("id, created_at, source, answers, result, goal_kg")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("user_preferences")
      .select("goal_kg, action_plan")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  if (error || preferenceReadError) throw error ?? preferenceReadError;
  const history = (rows ?? []).map(
    (row) =>
      ({
        id: row.id,
        createdAt: row.created_at,
        source: row.source,
        answers: row.answers,
        result: row.result,
        goalKg: row.goal_kg,
      }) as AssessmentSnapshot,
  );
  return {
    history: normalizeHistory(history),
    goalKg: preferences?.goal_kg ?? null,
    actionPlan: (preferences?.action_plan ?? []) as ActionPlanItem[],
  };
}

export async function GET() {
  const auth = await authenticatedClient();
  if (auth.error === "not_configured")
    return privateJson({ configured: false, authenticated: false });
  if (auth.error === "unauthorized")
    return privateJson({ configured: true, authenticated: false });
  try {
    const state = await readCloudState(auth.supabase, auth.user.id);
    return privateJson({ configured: true, authenticated: true, ...state });
  } catch {
    return privateJson({ error: "sync_read_failed" }, 500);
  }
}

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request))
    return privateJson({ error: "invalid_origin" }, 403);
  const limited0 = await rateLimitResponse(
    request,
    "sync-write",
    SYNC_RATE_LIMIT_REQUESTS,
    SYNC_RATE_LIMIT_WINDOW_MS,
  );
  if (limited0) return limited0;
  const auth = await authenticatedClient();
  if (auth.error === "not_configured")
    return privateJson({ configured: false, authenticated: false }, 503);
  if (auth.error === "unauthorized")
    return privateJson({ configured: true, authenticated: false }, 401);

  let json: unknown;
  try {
    json = await readBoundedJson(request, 1_000_000);
  } catch (error) {
    if (error instanceof RequestBodyTooLarge)
      return privateJson({ error: "payload_too_large" }, 413);
    return privateJson({ error: "invalid_json" }, 400);
  }
  const parsed = syncRequestSchema.safeParse(json);
  if (!parsed.success) return privateJson({ error: "invalid_payload" }, 400);

  const rows = parsed.data.history.map((snapshot) => {
    const result = calculateAssessment(snapshot.answers);
    result.calculatedAt = snapshot.createdAt;
    return {
      id: snapshot.id,
      user_id: auth.user.id,
      created_at: snapshot.createdAt,
      source: snapshot.source,
      total_kg: result.totalKg,
      low_kg: result.lowKg,
      high_kg: result.highKg,
      confidence_score: result.confidenceScore,
      factor_version: result.factorVersion,
      answers: snapshot.answers,
      result,
      goal_kg: snapshot.goalKg,
      synced_at: new Date().toISOString(),
    };
  });

  try {
    if (rows.length) {
      const { error } = await auth.supabase
        .from("assessments")
        .upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }
    const { error: preferenceError } = await auth.supabase.rpc(
      "merge_carbon_preferences",
      { p_goal_kg: parsed.data.goalKg, p_action_plan: parsed.data.actionPlan },
    );
    if (preferenceError) throw preferenceError;
    const state = await readCloudState(auth.supabase, auth.user.id);
    return privateJson({ configured: true, authenticated: true, ...state });
  } catch {
    return privateJson({ error: "sync_write_failed" }, 500);
  }
}

export async function DELETE(request: Request) {
  if (!hasTrustedOrigin(request))
    return privateJson({ error: "invalid_origin" }, 403);
  const limited1 = await rateLimitResponse(
    request,
    "sync-delete",
    SYNC_RATE_LIMIT_REQUESTS,
    SYNC_RATE_LIMIT_WINDOW_MS,
  );
  if (limited1) return limited1;
  const auth = await authenticatedClient();
  if (auth.error === "not_configured")
    return privateJson({ error: auth.error }, 503);
  if (auth.error === "unauthorized")
    return privateJson({ error: auth.error }, 401);
  const [{ error: assessmentError }, { error: preferenceError }] =
    await Promise.all([
      auth.supabase.from("assessments").delete().eq("user_id", auth.user.id),
      auth.supabase
        .from("user_preferences")
        .delete()
        .eq("user_id", auth.user.id),
    ]);
  if (assessmentError || preferenceError)
    return privateJson({ error: "cloud_delete_failed" }, 500);
  return privateJson({ success: true });
}
