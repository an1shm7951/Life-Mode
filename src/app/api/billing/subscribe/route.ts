import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  billingConfiguration,
  PLAN_AMOUNT_PAISE,
  PLAN_CODE,
  PLAN_CURRENCY,
  razorpayRequest,
} from "@/lib/billing/razorpay";

type RazorpayPlan = {
  id: string;
  interval: number;
  period: string;
  item: { amount: number; currency: string };
};

type RazorpaySubscription = { id: string; status: string };

export async function POST(request: Request) {
  const authentication = await authenticateRequest(request);
  const admin = createAdminClient();
  const configuration = billingConfiguration();

  if (!authentication) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!configuration.configured || !configuration.planId || !configuration.keyId || !admin) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 },
    );
  }

  const { data: existing } = await admin
    .from("subscriptions")
    .select("provider_subscription_id, status")
    .eq("user_id", authentication.user.id)
    .in("status", ["created", "authenticated", "active", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      keyId: configuration.keyId,
      subscriptionId: existing.provider_subscription_id,
      amount: PLAN_AMOUNT_PAISE,
      currency: PLAN_CURRENCY,
      email: authentication.user.email,
    });
  }

  const plan = await razorpayRequest<RazorpayPlan>(`/plans/${configuration.planId}`);

  if (
    plan.item.amount !== PLAN_AMOUNT_PAISE ||
    plan.item.currency !== PLAN_CURRENCY ||
    plan.period !== "monthly" ||
    plan.interval !== 1
  ) {
    return NextResponse.json(
      { error: "The configured payment plan does not match ₹79 per month." },
      { status: 409 },
    );
  }

  const subscription = await razorpayRequest<RazorpaySubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: plan.id,
      total_count: 12,
      quantity: 1,
      customer_notify: 1,
      notes: {
        user_id: authentication.user.id,
        plan_code: PLAN_CODE,
      },
    }),
  });

  const { error } = await admin.from("subscriptions").insert({
    user_id: authentication.user.id,
    provider: "razorpay",
    provider_subscription_id: subscription.id,
    plan_code: PLAN_CODE,
    status: subscription.status,
    amount_paise: PLAN_AMOUNT_PAISE,
    currency: PLAN_CURRENCY,
  });

  if (error) {
    return NextResponse.json({ error: "Could not save the subscription." }, { status: 500 });
  }

  return NextResponse.json({
    keyId: configuration.keyId,
    subscriptionId: subscription.id,
    amount: PLAN_AMOUNT_PAISE,
    currency: PLAN_CURRENCY,
    email: authentication.user.email,
  });
}
