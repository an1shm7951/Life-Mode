import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/billing/razorpay";

type RazorpayWebhook = {
  event?: string;
  payload?: {
    subscription?: { entity?: { id?: string; status?: string; current_end?: number } };
    payment?: { entity?: { id?: string } };
  };
};

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const rawBody = await request.text();
  const admin = createAdminClient();

  if (!admin || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as RazorpayWebhook;
  const subscription = event.payload?.subscription?.entity;

  if (!subscription?.id || !subscription.status) {
    return NextResponse.json({ received: true });
  }

  const currentPeriodEnd = subscription.current_end
    ? new Date(subscription.current_end * 1000).toISOString()
    : null;
  const { error } = await admin
    .from("subscriptions")
    .update({
      status: subscription.status,
      provider_payment_id: event.payload?.payment?.entity?.id ?? null,
      current_period_end: currentPeriodEnd,
    })
    .eq("provider_subscription_id", subscription.id);

  if (error) {
    return NextResponse.json({ error: "Webhook update failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
