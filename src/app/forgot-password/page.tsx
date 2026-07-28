"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResetRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Password reset email sent. Check your inbox.");
    setIsSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-5 py-8 text-[#181713] sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-4xl items-center">
        <section className="rounded-lg border border-[#d8d1c2] bg-white p-5 shadow-sm lg:p-7">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7b3f2a]"
          >
            LifeMode
          </Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">
            Account recovery
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
            Reset your password.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f5a50]">
            Enter the email you used for LifeMode. We will send you a secure
            link to create a new password.
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleResetRequest}>
            <label className="grid gap-2 text-sm font-semibold text-[#25221d]">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="h-12 rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-4 text-base font-normal text-[#181713] outline-none transition placeholder:text-[#8f8778] focus:border-[#7b3f2a] focus:bg-white"
              />
            </label>

            {message ? (
              <p className="rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-3 text-sm font-medium leading-6 text-[#5f5a50]">
                {message}
              </p>
            ) : null}

            <button
              disabled={isSubmitting}
              className="h-12 rounded-lg bg-[#181713] px-5 text-sm font-semibold text-white transition hover:bg-[#2a2821] disabled:cursor-not-allowed disabled:bg-[#8f8778]"
            >
              {isSubmitting ? "Sending..." : "Send reset email"}
            </button>
          </form>

          <p className="mt-6 text-sm text-[#5f5a50]">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-[#7b3f2a]">
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
