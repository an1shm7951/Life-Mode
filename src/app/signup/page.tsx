"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

const modes = [
  "Student",
  "Gym",
  "Career",
  "Business",
  "Law",
  "Creator",
];

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const numericAge = Number(age);

    if (!Number.isInteger(numericAge) || numericAge < 13 || numericAge > 120) {
      setMessage("Enter a valid age. LifeMode accounts currently require age 13+.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          age_band: numericAge >= 18 ? "adult" : "under_18",
          first_mode: mode,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setMessage(
      "Account created. Check your email if Supabase asks for confirmation, then log in.",
    );
    setIsSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-5 py-8 text-[#181713] sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="rounded-lg border border-[#d8d1c2] bg-white p-5 shadow-sm lg:p-7">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7b3f2a]"
          >
            LifeMode
          </Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">
            Start your mode
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
            Create your account and choose what you are building.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#5f5a50]">
            LifeMode starts with your identity, your first mode, and your
            safety settings before any social features appear.
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleSignup}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="First name"
                name="firstName"
                placeholder="Your name"
                value={firstName}
                onChange={setFirstName}
              />
              <Field
                label="Age"
                name="age"
                type="number"
                placeholder="18"
                value={age}
                onChange={setAge}
              />
            </div>
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
              placeholder="Create a password"
              value={password}
              onChange={setPassword}
            />

            <div className="grid gap-2">
              <p className="text-sm font-semibold text-[#25221d]">
                Choose your first mode
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {modes.map((modeName) => (
                  <label
                    key={modeName}
                    className="flex h-12 items-center gap-2 rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-3 text-sm font-semibold transition hover:border-[#7b3f2a]"
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={modeName}
                      checked={mode === modeName}
                      onChange={(event) => setMode(event.target.value)}
                      required
                      className="accent-[#181713]"
                    />
                    {modeName}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4 text-sm leading-6 text-[#5f5a50]">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-[#c8beaa] accent-[#181713]"
              />
              <span>
                I agree to the <Link href="/terms" className="font-semibold text-[#315260]">Terms</Link>
                {" "}and <Link href="/privacy" className="font-semibold text-[#315260]">Privacy Notice</Link>.
                Dating features are 18+ and must be explicitly enabled.
              </span>
            </label>

            {message ? (
              <p className="rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-3 text-sm font-medium leading-6 text-[#5f5a50]">
                {message}
              </p>
            ) : null}

            <button
              disabled={isSubmitting}
              className="mt-2 h-12 rounded-lg bg-[#181713] px-5 text-sm font-semibold text-white transition hover:bg-[#2a2821] disabled:cursor-not-allowed disabled:bg-[#8f8778]"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-[#5f5a50]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#7b3f2a]">
              Log in
            </Link>
          </p>
        </section>

        <section className="rounded-lg border border-[#d8d1c2] bg-[#181713] p-5 text-[#f5f1e8] shadow-sm lg:p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d6c29d]">
            Account setup order
          </p>
          <div className="mt-6 grid gap-4">
            {[
              ["1", "Create profile"],
              ["2", "Choose first mode"],
              ["3", "Set privacy"],
              ["4", "Enter dashboard"],
            ].map(([step, label]) => (
              <div
                key={step}
                className="flex items-center gap-4 rounded-lg border border-[#3b4138] bg-[#202820] p-4"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d1e6b7] text-sm font-bold text-[#202820]">
                  {step}
                </span>
                <span className="font-semibold">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 rounded-lg bg-[#2b3028] p-4 text-sm leading-6 text-[#d8d1c2]">
            Social discovery stays off by default. Users choose whether they
            want AI only, human partners, professional networking, or 18+
            dating.
          </p>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
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
        className="h-12 rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-4 text-base font-normal text-[#181713] outline-none transition placeholder:text-[#8f8778] focus:border-[#7b3f2a] focus:bg-white"
      />
    </label>
  );
}
