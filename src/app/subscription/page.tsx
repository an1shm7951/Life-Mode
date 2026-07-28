"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileNav } from "@/components/mobile-nav";
import { supabase } from "@/lib/supabase/client";

type SubscriptionStatus = {
  configured: boolean;
  price: number;
  currency: string;
  subscription: {
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
};

type CheckoutResult = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: { error?: { description?: string } }) => void) => void;
    };
  }
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<SubscriptionStatus | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const authenticatedRequest = useCallback(async (path: string, options: RequestInit = {}) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push("/login");
      return null;
    }

    return fetch(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }, [router]);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    const response = await authenticatedRequest("/api/billing/status");

    if (response) {
      const data = (await response.json()) as SubscriptionStatus;
      setBilling(data);
    }

    setIsLoading(false);
  }, [authenticatedRequest]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadStatus();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadStatus]);

  async function startSubscription() {
    if (!billing?.configured) {
      return;
    }

    setMessage("");
    setIsStarting(true);

    try {
      await loadRazorpay();
      const response = await authenticatedRequest("/api/billing/subscribe", {
        method: "POST",
      });

      if (!response) {
        return;
      }

      const data = (await response.json()) as {
        error?: string;
        keyId?: string;
        subscriptionId?: string;
        amount?: number;
        currency?: string;
        email?: string;
      };

      if (!response.ok || !data.keyId || !data.subscriptionId) {
        setMessage(data.error ?? "Checkout could not be started.");
        return;
      }

      const checkout = new window.Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "LifeMode",
        description: "LifeMode Plus - ₹79 monthly",
        prefill: { email: data.email },
        theme: { color: "#181713" },
        modal: {
          ondismiss: () => setMessage("Checkout cancelled. You were not charged."),
        },
        handler: async (result: CheckoutResult) => {
          const verifyResponse = await authenticatedRequest("/api/billing/verify", {
            method: "POST",
            body: JSON.stringify(result),
          });
          const verification = (await verifyResponse?.json()) as { error?: string } | undefined;

          if (!verifyResponse?.ok) {
            setMessage(verification?.error ?? "Payment verification failed.");
            return;
          }

          setMessage("Payment verified. Your subscription is being activated.");
          await loadStatus();
        },
      });

      checkout.on("payment.failed", (result) => {
        setMessage(result.error?.description ?? "Payment failed. You were not subscribed.");
      });
      checkout.open();
    } catch {
      setMessage("Checkout could not be loaded. Try again later.");
    } finally {
      setIsStarting(false);
    }
  }

  const active = billing?.subscription?.status === "active";
  const authenticated = billing?.subscription?.status === "authenticated";

  return (
    <main className="min-h-screen bg-[#eef1ec] pb-24 text-[#151814] lg:pb-0">
      <header className="border-b border-[#d6dbd2] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold uppercase tracking-[0.18em] text-[#315260]">LifeMode</Link>
            <h1 className="mt-1 text-2xl font-semibold">Membership</h1>
          </div>
          <Link href="/dashboard" className="nav-button">Dashboard</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#315260]">Simple pricing</p>
          <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">Start free. Upgrade when LifeMode earns its place.</h2>
          <p className="mt-4 text-base leading-7 text-[#5b6259]">No payment is collected until checkout, signature verification, and webhook activation all succeed.</p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="premium-panel rounded-lg p-6">
            <p className="text-sm font-semibold text-[#5b6259]">Free</p>
            <p className="mt-3 text-4xl font-semibold">₹0</p>
            <p className="mt-2 text-sm text-[#5b6259]">Core LifeMode access</p>
            <ul className="mt-6 grid gap-3 text-sm leading-6 text-[#30352f]">
              <li>Goals and proof timeline</li>
              <li>Opportunity tracking</li>
              <li>AI Buddy access during early access</li>
              <li>Private profile controls</li>
            </ul>
            <Link href="/dashboard" className="mt-8 flex h-12 items-center justify-center rounded-lg border border-[#aeb8ad] bg-white px-4 text-sm font-semibold">Continue free</Link>
          </article>

          <article className="rounded-lg border border-[#303b31] bg-[#151814] p-6 text-white shadow-[0_24px_60px_rgba(19,28,20,0.22)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#cfe0ca]">LifeMode Plus</p>
              {active ? <span className="rounded-md bg-[#d8f0cf] px-2 py-1 text-xs font-bold text-[#214628]">Active</span> : null}
            </div>
            <div className="mt-3 flex items-end gap-2">
              <p className="text-5xl font-semibold">₹79</p>
              <p className="pb-1 text-sm text-[#bbc4b9]">per month</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#c8d0c5]">An early supporter membership. Paid benefits remain gated until payment testing and activation are complete.</p>

            <div className="mt-8">
              {isLoading ? (
                <div className="h-12 animate-pulse rounded-lg bg-white/10" />
              ) : active ? (
                <div className="rounded-lg border border-[#506052] bg-[#202820] p-4 text-sm">Your membership is active.</div>
              ) : authenticated ? (
                <div className="rounded-lg border border-[#506052] bg-[#202820] p-4 text-sm">Payment verified. Waiting for provider activation.</div>
              ) : (
                <button
                  onClick={startSubscription}
                  disabled={!billing?.configured || isStarting}
                  className="h-12 w-full rounded-lg bg-white px-4 text-sm font-semibold text-[#151814] disabled:cursor-not-allowed disabled:bg-[#6d756b] disabled:text-[#d9ddd7]"
                >
                  {isStarting
                    ? "Opening checkout..."
                    : billing?.configured
                      ? "Subscribe for ₹79"
                      : "Payments opening after verification"}
                </button>
              )}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#9ea89c]">Recurring monthly payment. Cancel before renewal from the provider until in-app cancellation is verified.</p>
          </article>
        </div>

        {message ? <p className="mt-5 rounded-lg border border-[#cad1c7] bg-white p-4 text-sm text-[#4e554c]">{message}</p> : null}
      </section>
      <MobileNav />
    </main>
  );
}

function loadRazorpay() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay failed to load."));
    document.head.appendChild(script);
  });
}
