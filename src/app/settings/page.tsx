"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { MobileNav } from "@/components/mobile-nav";
import { SettingsIcon } from "@/components/settings-icon";
import { ThemePicker } from "@/components/theme-picker";

type AccountMessage = { kind: "info" | "success" | "error"; text: string } | null;

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [accountMessage, setAccountMessage] = useState<AccountMessage>(null);

  useEffect(() => {
    async function loadAccount() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? "");
      setIsLoading(false);
    }

    loadAccount();
  }, [router]);

  async function exportAccountData() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push("/login");
      return;
    }

    setIsExporting(true);
    setAccountMessage({ kind: "info", text: "Preparing your export..." });

    try {
      const response = await fetch("/api/account/export", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        setAccountMessage({ kind: "error", text: "Your export could not be created." });
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "lifemode-data.json";
      link.click();
      URL.revokeObjectURL(url);
      setAccountMessage({ kind: "success", text: "Export downloaded." });
    } catch {
      setAccountMessage({
        kind: "error",
        text: "Your export could not be created. Check your connection and try again.",
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Delete your LifeMode account and all of its stored data? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push("/login");
      return;
    }

    setIsDeleting(true);
    setAccountMessage({ kind: "info", text: "Deleting account..." });

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        deleted?: boolean;
      };

      if (!response.ok || result.deleted !== true) {
        setAccountMessage({
          kind: "error",
          text: result.error ?? "Account deletion failed. Your account was not deleted.",
        });
        setIsDeleting(false);
        return;
      }
    } catch {
      setAccountMessage({
        kind: "error",
        text: "Account deletion failed. Your account was not deleted. Check your connection and try again.",
      });
      setIsDeleting(false);
      return;
    }

    await supabase.auth.signOut().catch(() => undefined);
    router.push("/");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] px-5 text-[#181713]">
        <div className="rounded-lg border border-[#d8d1c2] bg-white p-6 shadow-sm" role="status">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">
            LifeMode
          </p>
          <p className="mt-3 text-2xl font-semibold">Loading settings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f5f0] pb-24 text-[#181713] lg:pb-0">
      <header className="border-b border-[#d8d1c2] bg-[#fbfaf6]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7b3f2a]"
            >
              LifeMode
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">Settings</h1>
            <p className="mt-1 text-sm text-[#5f5a50]">
              Manage your account, your data, and how LifeMode looks.
            </p>
          </div>
          <nav aria-label="Page navigation" className="flex flex-col gap-3 sm:flex-row">
            <Link className="nav-button" href="/dashboard">
              Dashboard
            </Link>
            <Link className="nav-button" href="/profile">
              Proof Profile
            </Link>
            <Link className="nav-button" href="/opportunities">
              Opportunities
            </Link>
            <Link className="nav-button" href="/subscription">
              Plus
            </Link>
            <Link className="nav-button-dark gap-2" href="/settings" aria-current="page">
              <SettingsIcon />
              Settings
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-3xl gap-5 px-5 py-6 sm:px-8">
        <section aria-labelledby="account-data-title" className="premium-panel rounded-lg p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#315260]">
            Account &amp; Data
          </p>
          <h2 id="account-data-title" className="mt-2 text-2xl font-semibold">
            Your account
          </h2>
          {email ? (
            <p className="mt-1 text-sm text-[#5f5a50]">Signed in as {email}</p>
          ) : null}
          <p className="mt-3 text-sm leading-6 text-[#5f5a50]">
            Download a copy of the data stored in your account, or permanently delete your
            account.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={exportAccountData}
              disabled={isExporting || isDeleting}
              className="h-11 rounded-lg border border-[#aeb8ad] bg-white px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExporting ? "Preparing export..." : "Export my data"}
            </button>
            <button
              type="button"
              onClick={deleteAccount}
              disabled={isExporting || isDeleting}
              className="h-11 rounded-lg border border-[#d8a7a0] bg-[#fff7f5] px-4 text-sm font-semibold text-[#8c3027] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Deleting account..." : "Delete account"}
            </button>
          </div>
          <div aria-live="polite" role="status">
            {accountMessage ? (
              <p
                className={
                  accountMessage.kind === "error"
                    ? "mt-3 text-sm font-semibold text-[#8c3027]"
                    : "mt-3 text-sm text-[#5f5a50]"
                }
                role={accountMessage.kind === "error" ? "alert" : undefined}
              >
                {accountMessage.text}
              </p>
            ) : null}
          </div>
          <p className="mt-3 text-xs leading-5 text-[#696257]">
            Deleting your account cannot be undone. You will be asked to confirm first.
          </p>
        </section>

        <section aria-labelledby="privacy-security-title" className="premium-panel rounded-lg p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#315260]">
            Privacy &amp; Security
          </p>
          <h2 id="privacy-security-title" className="mt-2 text-2xl font-semibold">
            Sign-in and visibility
          </h2>
          <ul className="mt-4 grid gap-3 text-sm">
            <li className="flex flex-col gap-2 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="leading-6 text-[#5f5a50]">
                <span className="block font-semibold text-[#181713]">Password</span>
                Get an email link to set a new password.
              </span>
              <Link href="/forgot-password" className="font-semibold text-[#315260] underline">
                Reset password
              </Link>
            </li>
            <li className="flex flex-col gap-2 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="leading-6 text-[#5f5a50]">
                <span className="block font-semibold text-[#181713]">Public proof profile</span>
                Your profile is private unless you turn on &ldquo;Public&rdquo; on the Proof
                Profile page.
              </span>
              <Link href="/profile" className="font-semibold text-[#315260] underline">
                Open Proof Profile
              </Link>
            </li>
            <li className="flex flex-col gap-2 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="leading-6 text-[#5f5a50]">
                <span className="block font-semibold text-[#181713]">Sign out</span>
                End your session on this device.
              </span>
              <button
                type="button"
                onClick={logout}
                className="h-11 w-fit rounded-lg bg-[#181713] px-4 text-sm font-semibold text-white"
              >
                Log out
              </button>
            </li>
          </ul>
        </section>

        <section aria-labelledby="preferences-title">
          <p className="sr-only" id="preferences-title">
            Preferences
          </p>
          <ThemePicker />
        </section>

        <section aria-labelledby="legal-title" className="premium-panel rounded-lg p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#315260]">
            Legal
          </p>
          <h2 id="legal-title" className="mt-2 text-2xl font-semibold">
            Policies
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li>
              <Link
                href="/privacy"
                className="flex min-h-12 items-center justify-between rounded-lg border border-[#dfd8c8] bg-[#fffdf8] px-4 text-sm font-semibold text-[#315260]"
              >
                Privacy Policy
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="flex min-h-12 items-center justify-between rounded-lg border border-[#dfd8c8] bg-[#fffdf8] px-4 text-sm font-semibold text-[#315260]"
              >
                Terms of Service
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </li>
          </ul>
        </section>
      </div>
      <MobileNav />
    </main>
  );
}
