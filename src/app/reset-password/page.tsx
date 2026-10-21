"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePasswordUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Password updated. Opening login...");
    setIsSubmitting(false);
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-5 py-8 text-[#181713] sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-4xl items-center">
        <section className="premium-panel rounded-lg p-5 lg:p-7">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7b3f2a]"
          >
            LifeMode
          </Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">
            New password
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
            Create a new password.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f5a50]">
            This page works after you open the secure reset link from your
            email.
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handlePasswordUpdate}>
            <PasswordField
              label="New password"
              value={password}
              onChange={setPassword}
            />
            <PasswordField
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />

            {message ? (
              <p className="rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-3 text-sm font-medium leading-6 text-[#5f5a50]">
                {message}
              </p>
            ) : null}

            <button
              disabled={isSubmitting}
              className="h-12 rounded-lg bg-[#181713] px-5 text-sm font-semibold text-white transition hover:bg-[#2a2821] disabled:cursor-not-allowed disabled:bg-[#8f8778]"
            >
              {isSubmitting ? "Updating..." : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#25221d]">
      {label}
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="h-12 rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-4 text-base font-normal text-[#181713] outline-none transition placeholder:text-[#8f8778] focus:border-[#7b3f2a] focus:bg-white"
      />
    </label>
  );
}
