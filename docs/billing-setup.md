# LifeMode Billing Setup

LifeMode Plus is priced at ₹79 per month. Checkout remains disabled until every production billing value is configured.

## Razorpay Setup

1. Create and verify a Razorpay merchant account.
2. Create a monthly plan for exactly ₹79 INR.
3. Add the plan ID and API credentials to Vercel.
4. Add a webhook pointing to `https://lifemode.vercel.app/api/billing/webhook`.
5. Subscribe the webhook to subscription and payment status events.
6. Set the same webhook secret in Vercel.
7. Run `supabase/migrations/0004_subscriptions.sql`.

## Required Environment Variables

```env
SUPABASE_SERVICE_ROLE_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_PLAN_ID=
RAZORPAY_WEBHOOK_SECRET=
```

## Release Gate

Do not enable production checkout until test mode has verified successful payment, failed payment, checkout dismissal, webhook activation, cancellation, and refund operations.
