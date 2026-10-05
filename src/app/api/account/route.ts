import { NextResponse } from "next/server";
import { hasTrustedOrigin } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/server-rate-limit";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

const ACCOUNT_DELETE_WINDOW_MS = 10 * 60 * 1_000;
const ACCOUNT_DELETE_LIMIT = 5;

export async function DELETE(request: Request) {
  if (!hasTrustedOrigin(request))
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  const limited0 = await rateLimitResponse(
    request,
    "account-delete",
    ACCOUNT_DELETE_LIMIT,
    ACCOUNT_DELETE_WINDOW_MS,
  );
  if (limited0) return limited0;
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase)
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (!admin)
    return NextResponse.json(
      { error: "admin_not_configured" },
      { status: 503 },
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error)
    return NextResponse.json(
      { error: "account_delete_failed" },
      { status: 500 },
    );
  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
