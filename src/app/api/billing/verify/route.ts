import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCheckoutSignature } from "@/lib/billing/razorpay";

export async function POST(request: Request) {
  const authentication = await authenticateRequest(request);
  const admin = createAdminClient();

  if (!authentication) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!admin) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }

  const body = (await request.json()) as {
    razorpay_payment_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
  };

  if (
    !body.razorpay_payment_id ||
    !body.razorpay_subscription_id ||
    !body.razorpay_signature ||
    !verifyCheckoutSignature({
      paymentId: body.razorpay_payment_id,
      subscriptionId: body.razorpay_subscription_id,
      signature: body.razorpay_signature,
    })
  ) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("subscriptions")
    .update({
      provider_payment_id: body.razorpay_payment_id,
      status: "authenticated",
    })
    .eq("user_id", authentication.user.id)
    .eq("provider_subscription_id", body.razorpay_subscription_id)
    .select("status")
    .single();

  if (error) {
    return NextResponse.json({ error: "Payment could not be recorded." }, { status: 500 });
  }

  return NextResponse.json({ subscription: data });
}
