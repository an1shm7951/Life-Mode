"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/lifemode/database";
import type { LifeModeId } from "@/lib/lifemode/types";

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
    <main className="flex min-h-screen items-center bg-[#f3f5f0] px-5 py-8 text-[#181713] sm:px-8">
      <section className="premium-panel mx-auto w-full max-w-lg rounded-lg p-5 sm:p-7">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.18em] text-[#315260]">LifeMode</Link>
        <h1 className="mt-8 text-3xl font-semibold">Finish your setup</h1>
        <p className="mt-2 text-sm leading-6 text-[#5f5a50]">Set your age access and choose where LifeMode should begin.</p>
        <form className="mt-6 grid gap-4" onSubmit={completeOnboarding}>
          <label className="grid gap-2 text-sm font-semibold">
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required className="h-12 rounded-lg border border-[#c8beaa] bg-white px-4 font-normal outline-none focus:border-[#315260]" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Age
            <input type="number" min="13" max="120" value={age} onChange={(event) => setAge(event.target.value)} required className="h-12 rounded-lg border border-[#c8beaa] bg-white px-4 font-normal outline-none focus:border-[#315260]" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            First mode
            <select value={mode} onChange={(event) => setMode(event.target.value as LifeModeId)} className="h-12 rounded-lg border border-[#c8beaa] bg-white px-4 outline-none focus:border-[#315260]">
              {modes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-[#d8d1c2] bg-white p-4 text-sm leading-6 text-[#5f5a50]">
            <input type="checkbox" required className="mt-1 h-4 w-4 accent-[#181713]" />
            <span>I agree to the <Link href="/terms" className="font-semibold text-[#315260]">Terms</Link> and <Link href="/privacy" className="font-semibold text-[#315260]">Privacy Notice</Link>.</span>
          </label>
          {message ? <p className="rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-3 text-sm text-[#5f5a50]">{message}</p> : null}
          <button disabled={isSaving} className="h-12 rounded-lg bg-[#181713] px-5 text-sm font-semibold text-white disabled:bg-[#8f8778]">{isSaving ? "Saving..." : "Continue to LifeMode"}</button>
        </form>
      </section>
    </main>
  );
}
