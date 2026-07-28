import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server-auth";

export async function DELETE(request: Request) {
  const authentication = await authenticateRequest(request);

  if (!authentication) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Account deletion is not configured on this deployment." },
      { status: 503 },
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(authentication.user.id);

  if (error) {
    return NextResponse.json({ error: "Account deletion failed." }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
