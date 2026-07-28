import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server-auth";

const userTables = [
  "profiles",
  "goals",
  "proof_posts",
  "opportunity_actions",
  "connection_preferences",
  "respect_locks",
  "ai_buddy_history",
  "finance_transactions",
  "finance_budgets",
  "finance_goals",
] as const;

export async function GET(request: Request) {
  const authentication = await authenticateRequest(request);

  if (!authentication) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const entries = await Promise.all(
    userTables.map(async (table) => {
      const userColumn = table === "respect_locks" ? "actor_user_id" : "user_id";
      const { data, error } = await authentication.client
        .from(table)
        .select("*")
        .eq(userColumn, authentication.user.id);

      if (error) {
        throw error;
      }

      return [table, data] as const;
    }),
  );

  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      account: {
        id: authentication.user.id,
        email: authentication.user.email,
        createdAt: authentication.user.created_at,
      },
      data: Object.fromEntries(entries),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": "attachment; filename=lifemode-data.json",
      },
    },
  );
}
