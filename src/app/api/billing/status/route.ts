import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server-auth";
import {
  billingConfiguration,
  PLAN_AMOUNT_PAISE,
  PLAN_CURRENCY,
} from "@/lib/billing/razorpay";

export async function GET(request: Request) {
  const authentication = await authenticateRequest(request);

  if (!authentication) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await authentication.client
    .from("subscriptions")
    .select("status, current_period_end, cancel_at_period_end")
    .eq("user_id", authentication.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json(
    {
      configured: billingConfiguration().configured && !error,
      price: PLAN_AMOUNT_PAISE / 100,
      currency: PLAN_CURRENCY,
      subscription: error ? null : data,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
