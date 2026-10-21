"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { AuthStory } from "@/components/auth-story";

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
    <main className="auth-experience min-h-screen px-5 py-6 text-[#181713] sm:px-8 sm:py-8">
      <div className="auth-layout mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1440px] gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
        <AuthStory mode={mode} />
        <section className="auth-form-panel premium-panel rounded-[30px] p-5 sm:p-7 lg:p-9">
          <div className="auth-form-topline">
            <span className="auth-step-indicator"><i /> YOUR FIRST STEP</span>
            <span className="auth-step-count">01 <span>/ 03</span></span>
          </div>
          <h1 className="auth-form-title mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
            Create your account.
          </h1>
          <p className="auth-form-subtitle mt-4 text-base leading-7 text-[#5f5a50]">
            Choose a starting point. You can shape the rest as you go.
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
                {modes.map((modeName, index) => (
                  <label
                    key={modeName}
                    className={`auth-mode-tile ${mode === modeName ? "is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={modeName}
                      checked={mode === modeName}
                      onChange={(event) => setMode(event.target.value)}
                      required
                    />
                    <span className="auth-mode-number">0{index + 1}</span>
                    {modeName}
                    <span className="auth-mode-check" aria-hidden="true">↗</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="auth-consent flex items-start gap-3 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4 text-sm leading-6 text-[#5f5a50]">
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
              <p role="status" className="auth-feedback rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-3 text-sm font-medium leading-6 text-[#5f5a50]">
                {message}
              </p>
            ) : null}

            <button
              disabled={isSubmitting}
              className="auth-submit mt-2 h-14 rounded-xl bg-[#181713] px-5 text-sm font-semibold text-white transition hover:bg-[#2a2821] disabled:cursor-not-allowed disabled:bg-[#8f8778]"
            >
              <span>{isSubmitting ? "Creating your space..." : "Create my LifeMode"}</span>
              {!isSubmitting ? <span className="auth-submit-arrow" aria-hidden="true">↗</span> : null}
            </button>
          </form>

          <p className="mt-6 text-sm text-[#5f5a50]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#7b3f2a]">
              Log in
            </Link>
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
