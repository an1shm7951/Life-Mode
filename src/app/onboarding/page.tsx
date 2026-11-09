"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/lifemode/database";
import type { LifeModeId } from "@/lib/lifemode/types";
import { AuthStory } from "@/components/auth-story";

const modes: { label: string; value: LifeModeId }[] = [
  { label: "Student", value: "student" },
  { label: "Gym", value: "gym" },
  { label: "Career", value: "career" },
  { label: "Business", value: "business" },
  { label: "Law", value: "law" },
  { label: "Creator", value: "creator" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [mode, setMode] = useState<LifeModeId>("student");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const metadata = user.user_metadata;
      const firstName = metadata?.first_name ?? metadata?.full_name ?? metadata?.name;
      setName(typeof firstName === "string" ? firstName : "");

      if (
        (metadata?.age_band === "adult" || metadata?.age_band === "under_18") &&
        typeof metadata?.first_mode === "string"
      ) {
        router.push("/dashboard");
      }
    }

    loadUser();
  }, [router]);

  async function completeOnboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAge = Number(age);

    if (!Number.isInteger(numericAge) || numericAge < 13 || numericAge > 120) {
      setMessage("Enter a valid age. LifeMode accounts currently require age 13+.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setIsSaving(true);
    const ageBand = numericAge >= 18 ? "adult" : "under_18";
    const { error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        first_name: name.trim(),
        age_band: ageBand,
        first_mode: modes.find((item) => item.value === mode)?.label ?? "Student",
      },
    });

    if (error) {
      setMessage(error.message);
      setIsSaving(false);
      return;
    }

    await ensureProfile({
      userId: user.id,
      displayName: name.trim() || user.email?.split("@")[0] || "LifeMode user",
      activeMode: mode,
      ageBand,
    });
    router.push("/dashboard");
  }

  return (
    <main className="auth-experience min-h-screen px-5 py-6 text-[#24221e] sm:px-8 sm:py-8">
      <div className="auth-layout mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1380px] gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-16">
        <AuthStory variant="signup" />
        <section className="auth-form-panel premium-panel mx-auto w-full max-w-xl rounded-[25px] p-5 sm:p-7 lg:p-9">
          <div className="auth-form-topline">
            <span className="auth-step-indicator"><i /> YOUR FIRST STEP</span>
            <span className="auth-step-count">02 <span>/ 03</span></span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold">Make this space yours.</h1>
          <p className="mt-2 text-sm leading-6 text-[#777166]">A few details help LifeMode start in the right place. You can change your direction later.</p>
          <form className="mt-7 grid gap-4" onSubmit={completeOnboarding}>
            <label className="grid gap-2 text-sm font-semibold">
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="given-name" className="h-12 rounded-xl border border-[#ded7cc] bg-[#fffefa] px-4 font-normal outline-none focus:border-[#9a805e]" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Age
              <input type="number" min="13" max="120" value={age} onChange={(event) => setAge(event.target.value)} required inputMode="numeric" className="h-12 rounded-xl border border-[#ded7cc] bg-[#fffefa] px-4 font-normal outline-none focus:border-[#9a805e]" />
            </label>
            <div className="grid gap-2">
              <p className="text-sm font-semibold">Where would you like to begin?</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {modes.map((item, index) => (
                  <label key={item.value} className={`auth-mode-tile flex min-h-[70px] cursor-pointer flex-col justify-between p-3 text-sm font-semibold ${mode === item.value ? "is-selected" : ""}`}>
                    <input type="radio" name="first-mode" value={item.value} checked={mode === item.value} onChange={() => setMode(item.value)} className="sr-only" />
                    <span className="text-[10px] font-medium tracking-[.16em] text-[#9a805e]">0{index + 1}</span>
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="auth-consent flex items-start gap-3 rounded-xl border border-[#e3ddd3] bg-[#f8f6f0] p-4 text-sm leading-6 text-[#777166]">
              <input type="checkbox" required className="mt-1 h-4 w-4 accent-[#806746]" />
              <span>I agree to the <Link href="/terms" className="font-semibold text-[#806746]">Terms</Link> and <Link href="/privacy" className="font-semibold text-[#806746]">Privacy Notice</Link>.</span>
            </label>
            {message ? <p role="status" className="auth-feedback rounded-xl border border-[#e3ddd3] bg-[#f8f6f0] p-3 text-sm text-[#6b5540]">{message}</p> : null}
            <button disabled={isSaving} className="auth-submit h-12 rounded-xl px-5 text-sm font-semibold text-white disabled:bg-[#8f8778]">{isSaving ? "Saving..." : "Continue to LifeMode"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
