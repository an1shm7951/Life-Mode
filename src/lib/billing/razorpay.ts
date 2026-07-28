import { createHmac, timingSafeEqual } from "node:crypto";

export const PLAN_AMOUNT_PAISE = 7900;
export const PLAN_CURRENCY = "INR";
export const PLAN_CODE = "lifemode_plus_monthly";

export function billingConfiguration() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const planId = process.env.RAZORPAY_PLAN_ID;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  return {
    configured: Boolean(keyId && keySecret && planId && webhookSecret),
    keyId,
    keySecret,
    planId,
    webhookSecret,
  };
}

export async function razorpayRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { keyId, keySecret } = billingConfiguration();

  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured.");
  }

  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Razorpay request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export function verifyCheckoutSignature({
  paymentId,
  subscriptionId,
  signature,
}: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
}) {
  const secret = billingConfiguration().keySecret;

  if (!secret) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");

  return safeEqual(expected, signature);
}

export function verifyWebhookSignature(body: string, signature: string) {
  const secret = billingConfiguration().webhookSecret;

  if (!secret) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return safeEqual(expected, signature);
}

function safeEqual(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
