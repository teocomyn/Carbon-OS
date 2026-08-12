import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
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
  await supabase.auth.signOut();
  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
