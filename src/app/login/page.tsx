"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthStory } from "@/components/auth-story";

type OAuthProvider = "google" | "apple" | "facebook";

const oauthProviders: { label: string; provider: OAuthProvider }[] = [
  { label: "Continue with Google", provider: "google" },
  { label: "Continue with Apple", provider: "apple" },
  { label: "Continue with Facebook", provider: "facebook" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  async function handleOAuth(provider: OAuthProvider) {
    setMessage("");
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });

    if (error) {
      setMessage(
        `${providerName(provider)} login is not enabled yet. Enable it in Supabase Authentication providers.`,
      );
      setOauthLoading(null);
    }
  }

  return (
    <main className="auth-experience min-h-screen px-5 py-6 text-[#181713] sm:px-8 sm:py-8">
      <div className="auth-layout mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1440px] gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
      <AuthStory variant="login" />
      <section className="auth-form-panel premium-panel mx-auto w-full max-w-xl rounded-[30px] p-5 sm:p-7 lg:p-9">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.18em] text-[#315260]"
        >
          LifeMode
        </Link>

        <div className="mt-8 grid grid-cols-2 gap-2 rounded-lg border border-[#d8d1c2] bg-[#f1f2ed] p-1">
          <Link
            href="/signup"
            className="flex h-11 items-center justify-center rounded-md px-3 text-sm font-semibold text-[#51584f]"
          >
            Create account
          </Link>
          <span className="flex h-11 items-center justify-center rounded-md bg-[#181713] px-3 text-sm font-semibold text-white shadow-sm">
            Log in
          </span>
        </div>

        <h1 className="mt-8 text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-[#5f5a50]">
          Sign in to continue where you left off.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
          />
          <Link href="/forgot-password" className="text-right text-sm font-semibold text-[#315260]">
            Forgot password?
          </Link>
          <button
            disabled={isSubmitting || oauthLoading !== null}
            className="h-12 rounded-lg bg-[#181713] px-5 text-sm font-semibold text-white transition hover:bg-[#2a2821] disabled:cursor-not-allowed disabled:bg-[#8f8778]"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#7b8077]">
          <span className="h-px flex-1 bg-[#d8d1c2]" />
          Or continue with
          <span className="h-px flex-1 bg-[#d8d1c2]" />
        </div>

        <div className="grid gap-3">
          {oauthProviders.map((item) => (
            <button
              key={item.provider}
              type="button"
              onClick={() => handleOAuth(item.provider)}
              disabled={isSubmitting || oauthLoading !== null}
              className="h-12 rounded-lg border border-[#bfc6bb] bg-white px-4 text-sm font-semibold transition hover:border-[#315260] hover:bg-[#f9fbf8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {oauthLoading === item.provider ? "Connecting..." : item.label}
            </button>
          ))}
        </div>

        {message ? (
          <p className="mt-5 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-3 text-sm leading-6 text-[#5f5a50]">
            {message}
          </p>
        ) : null}

        <p className="mt-6 text-center text-xs leading-5 text-[#696257]">
          By continuing, you agree to the <Link href="/terms" className="font-semibold text-[#315260]">Terms</Link>
          {" "}and <Link href="/privacy" className="font-semibold text-[#315260]">Privacy Notice</Link>.
        </p>
      </section>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#25221d]">
      {label}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        autoComplete={name === "email" ? "email" : "current-password"}
        className="h-12 rounded-lg border border-[#c8beaa] bg-white px-4 text-base font-normal outline-none transition placeholder:text-[#8f8778] focus:border-[#315260]"
      />
    </label>
  );
}

function providerName(provider: OAuthProvider) {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}
