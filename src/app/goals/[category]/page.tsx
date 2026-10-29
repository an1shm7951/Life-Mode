"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { MobileNav } from "@/components/mobile-nav";
import { createGoal, deleteGoal, fetchGoals, updateGoalDone, type GoalRow, type GoalType } from "@/lib/lifemode/database";
import type { LifeModeId } from "@/lib/lifemode/types";

const goalMeta: Record<GoalType, { title: string; eyebrow: string; description: string; prompt: string; placeholder: string; symbol: string }> = {
  daily: {
    title: "Make today count.",
    eyebrow: "THE DAILY QUEST",
    description: "A meaningful life is built in ordinary moments. Choose what matters today, then give it your attention.",
    prompt: "What would make today feel well spent?",
    placeholder: "One thing I want to make happen today…",
    symbol: "✳",
  },
  short_term: {
    title: "Turn intent into momentum.",
    eyebrow: "THE NEXT CHAPTER",
    description: "Big changes rarely arrive all at once. Give the next few weeks a direction, and let small steps gather into real momentum.",
    prompt: "What do you want to move forward?",
    placeholder: "Something I want to make progress on…",
    symbol: "↗",
  },
  long_term: {
    title: "Build toward something bigger.",
    eyebrow: "THE BIGGER PICTURE",
    description: "You don't need the whole map yet. Keep the future that matters to you in view, and take the next honest step toward it.",
    prompt: "What kind of future are you creating?",
    placeholder: "A future I want to build…",
    symbol: "✧",
  },
};

const categories: { value: GoalType; label: string; short: string }[] = [
  { value: "daily", label: "Today", short: "TODAY" },
  { value: "short_term", label: "Next chapter", short: "NEXT" },
  { value: "long_term", label: "Big picture", short: "FUTURE" },
];
const modes: { value: LifeModeId; label: string }[] = [
  { value: "student", label: "Student" }, { value: "gym", label: "Gym" }, { value: "career", label: "Career" },
  { value: "business", label: "Business" }, { value: "law", label: "Law" }, { value: "creator", label: "Creator" },
];

export default function GoalsPage() {
  const params = useParams<{ category: string }>();
  const category = params.category as GoalType;
  const router = useRouter();
  const meta = goalMeta[category];
  const [userId, setUserId] = useState("");
  const [mode, setMode] = useState<LifeModeId>("student");
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const loadGoals = useCallback(async (uid: string) => {
    const all = await fetchGoals(uid);
    setGoals(all.filter(goal => goal.goal_type === category));
  }, [category]);

  useEffect(() => {
    let active = true;
    async function initialize() {
      if (!meta) {
        router.replace("/dashboard");
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.replace(`/login?next=${encodeURIComponent(`/goals/${category}`)}`);
          return;
        }
        if (!active) return;
        const user = session.user;
        setUserId(user.id);
        const first = String(user.user_metadata?.first_mode ?? "student").toLowerCase() as LifeModeId;
        if (modes.some(item => item.value === first)) setMode(first);
        await loadGoals(user.id);
      } catch {
        if (active) setStatus("Your goals couldn't load just now. Your next step can wait while you try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void initialize();
    return () => { active = false; };
  }, [category, loadGoals, meta, router]);

  const completed = useMemo(() => goals.filter(goal => goal.done).length, [goals]);
  const progress = goals.length ? Math.round((completed / goals.length) * 100) : 0;
  const activeGoals = goals.length - completed;

  async function addGoal(event: FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || !userId || !meta || saving) return;
    setSaving(true);
    setStatus("Making room for your next step…");
    try {
      const goal = await createGoal(userId, mode, cleanTitle, category);
      setGoals(current => [...current, goal]);
      setTitle("");
      setStatus("It's yours now. Start small, and let the next step reveal itself.");
    } catch {
      setStatus("That didn't save this time. Your idea is still here—please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleGoal(goal: GoalRow) {
    setSaving(true);
    try {
      const updated = await updateGoalDone(goal.id, !goal.done);
      setGoals(current => current.map(item => item.id === updated.id ? updated : item));
      setStatus(updated.done
        ? "That counts. Take a second to recognise the progress you just made."
        : "Back in motion. You can pick this up one step at a time.");
    } catch {
      setStatus("Couldn't update that just now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function removeGoal(goal: GoalRow) {
    if (saving || !window.confirm("Remove this goal from your list?")) return;
    setSaving(true);
    try {
      await deleteGoal(goal.id);
      setGoals(current => current.filter(item => item.id !== goal.id));
      setStatus("Cleared some space. Your direction can change as you do.");
    } catch {
      setStatus("Couldn't remove that goal just now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!meta) return null;
  if (loading) return (
    <main className="min-h-screen bg-[#101a16] px-5 py-12 text-[#f5f0df]">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#c9aa65]">LIFEMODE / GOALS</p>
        <p className="mt-4 text-2xl">Getting your next chapter ready…</p>
        <p className="mt-2 text-sm text-white/55">Your goals are on their way.</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#101a16] pb-28 text-[#f5f0df] lg:pb-10">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-[#c9aa65]/[0.08] blur-3xl" />
        <div className="absolute -left-48 top-[35rem] h-[28rem] w-[28rem] rounded-full bg-[#497c5d]/[0.13] blur-3xl" />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#f5f0df 0.7px, transparent 0.7px)", backgroundSize: "22px 22px" }} />
      </div>

      <header className="relative z-10 border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c9aa65]/40 bg-[#c9aa65]/10 text-[#e2c77f]">L</span>
            LifeMode
          </Link>
          <Link href="/planning" className="group rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/80 transition hover:border-[#c9aa65]/50 hover:text-[#e2c77f]">
            Open my plan <span className="ml-1 transition group-hover:translate-x-0.5">↗</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pt-7 sm:px-8 sm:pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white">← Back to today</Link>
          <span className="rounded-full border border-[#c9aa65]/25 bg-[#c9aa65]/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e2c77f]">Your life, in motion</span>
        </div>

        <div className="relative mt-7 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#24392d] via-[#17251e] to-[#131b17] px-6 py-8 shadow-[0_30px_100px_rgba(0,0,0,0.22)] sm:px-10 sm:py-11 lg:px-14 lg:py-14">
          <div aria-hidden="true" className="absolute -right-12 -top-20 h-72 w-72 rounded-full border border-[#d9bd79]/15 sm:h-96 sm:w-96" />
          <div aria-hidden="true" className="absolute -right-2 -top-10 h-56 w-56 rounded-full border border-[#d9bd79]/10 sm:h-80 sm:w-80" />
          <div aria-hidden="true" className="absolute right-14 top-14 h-28 w-28 rounded-full bg-[#d9bd79]/[0.08] blur-2xl sm:right-28 sm:top-20 sm:h-40 sm:w-40" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_260px] lg:items-end">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#e2c77f]"><span className="h-px w-7 bg-[#c9aa65]" />{meta.eyebrow}</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-medium leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-7xl">{meta.title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#e9e8dc]/75 sm:text-lg sm:leading-8">{meta.description}</p>
              <p className="mt-7 inline-flex items-center gap-2 text-sm text-[#e2c77f]"><span aria-hidden="true">✦</span> Progress without pressure. One step at a time.</p>
            </div>
            <div className="relative rounded-2xl border border-white/10 bg-black/15 p-5 backdrop-blur-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">Your momentum</p>
                <span className="text-2xl text-[#e2c77f]">{meta.symbol}</span>
              </div>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-5xl font-light tracking-tight">{completed}</span>
                <span className="pb-1 text-sm text-white/50">of {goals.length} complete</span>
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-[#7eaa7c] to-[#e2c77f] transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                <span>{goals.length ? `${progress}% of the way` : "Every journey starts somewhere"}</span>
                <span>{activeGoals} in motion</span>
              </div>
            </div>
          </div>
        </div>

        <nav aria-label="Goal horizons" className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2">
          {categories.map(item => (
            <Link key={item.value} href={`/goals/${item.value}`} aria-current={category === item.value ? "page" : undefined}
              className={category === item.value
                ? "rounded-xl border border-[#c9aa65]/35 bg-[#c9aa65]/[0.12] px-3 py-3.5 text-center transition"
                : "rounded-xl border border-transparent px-3 py-3.5 text-center text-white/50 transition hover:bg-white/[0.05] hover:text-white/85"}>
              <span className={category === item.value ? "block text-sm font-semibold text-[#f5f0df]" : "block text-sm font-medium"}>{item.label}</span>
              <span className={category === item.value ? "mt-1 block text-[9px] font-semibold tracking-[0.2em] text-[#e2c77f]" : "mt-1 block text-[9px] tracking-[0.2em] text-white/35"}>{item.short}</span>
            </Link>
          ))}
        </nav>

        {status && <p role="status" aria-live="polite" className="mt-5 rounded-xl border border-[#c9aa65]/25 bg-[#c9aa65]/[0.08] px-4 py-3 text-sm leading-6 text-[#f1e7c8]">{status}</p>}

        <div className="mt-8 grid gap-7 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 sm:p-7 lg:sticky lg:top-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e2c77f]">01 / Set an intention</p>
            <h2 className="mt-4 text-2xl font-medium tracking-tight sm:text-3xl">{meta.prompt}</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">Make it yours. It doesn't have to impress anyone else to matter.</p>
            <form onSubmit={addGoal} className="mt-6">
              <label htmlFor="goal-title" className="mb-2 block text-xs font-medium text-white/65">Your next step</label>
              <textarea id="goal-title" value={title} onChange={event => setTitle(event.target.value)} placeholder={meta.placeholder} maxLength={180} required rows={3}
                className="w-full resize-y rounded-2xl border border-white/12 bg-[#0c1410]/70 px-4 py-4 text-base leading-6 text-[#f5f0df] outline-none transition placeholder:text-white/30 focus:border-[#c9aa65]/65 focus:ring-2 focus:ring-[#c9aa65]/10" />
              <div className="mt-4">
                <label htmlFor="goal-mode" className="mb-2 block text-xs font-medium text-white/65">Which part of life is this for?</label>
                <select id="goal-mode" value={mode} onChange={event => setMode(event.target.value as LifeModeId)}
                  className="h-12 w-full rounded-xl border border-white/12 bg-[#17231c] px-3 text-sm text-white/85 outline-none focus:border-[#c9aa65]/65">
                  {modes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <button type="submit" disabled={saving || !title.trim()} className="group mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d9bd79] px-5 py-3 text-sm font-bold text-[#172019] transition hover:bg-[#ecd69b] disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? "Saving your intention…" : "Plant this intention"} <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
              </button>
            </form>
            <p className="mt-4 text-center text-xs leading-5 text-white/35">You can change direction whenever you need to. This is your life.</p>
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e2c77f]">02 / Your path</p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">The things that matter to you.</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50">{goals.length} {goals.length === 1 ? "intention" : "intentions"}</span>
            </div>

            {goals.length === 0 ? (
              <div className="relative mt-5 overflow-hidden rounded-[1.75rem] border border-dashed border-[#c9aa65]/30 bg-gradient-to-br from-[#c9aa65]/[0.08] to-transparent p-7 sm:p-9">
                <div aria-hidden="true" className="absolute -right-5 -top-8 text-[9rem] leading-none text-[#c9aa65]/[0.08]">{meta.symbol}</div>
                <div className="relative">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c9aa65]/25 bg-[#c9aa65]/[0.09] text-2xl text-[#e2c77f]">{meta.symbol}</span>
                  <h3 className="mt-5 max-w-md text-2xl font-medium leading-snug">Nothing here yet. That's a beginning, not a problem.</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/55">Start with one thing you genuinely care about. It can be small, uncertain, or still taking shape.</p>
                  <button type="button" onClick={() => document.getElementById("goal-title")?.focus()} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e2c77f] transition hover:text-[#f4dfaa]">Give it a first step <span aria-hidden="true">↗</span></button>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {goals.map((goal, index) => (
                  <article key={goal.id} className={goal.done
                    ? "group rounded-2xl border border-[#83a981]/20 bg-[#83a981]/[0.055] p-4 transition sm:p-5"
                    : "group rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-[#c9aa65]/30 hover:bg-white/[0.065] sm:p-5"}>
                    <div className="flex items-start gap-3.5">
                      <button type="button" onClick={() => void toggleGoal(goal)} disabled={saving} aria-label={goal.done ? "Mark goal in progress" : "Mark goal complete"}
                        className={goal.done
                          ? "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#83a981]/50 bg-[#83a981]/20 text-sm text-[#b8d7b4] transition"
                          : "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25 text-transparent transition hover:border-[#d9bd79] hover:text-[#d9bd79]"}>
                        ✓
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-semibold tracking-[0.2em] text-white/30">STEP {String(index + 1).padStart(2, "0")}</span>
                          {goal.done && <span className="rounded-full bg-[#83a981]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#b8d7b4]">Made real</span>}
                        </div>
                        <p className={goal.done ? "mt-2 break-words text-base leading-6 text-white/45 line-through decoration-white/25" : "mt-2 break-words text-base leading-6 text-[#f5f0df]"}>{goal.title}</p>
                        <p className="mt-2 text-xs text-white/40">{goal.mode} <span className="mx-1.5 text-white/20">·</span> {goal.done ? "You showed up for this." : "Still possible. Still yours."}</p>
                      </div>
                      <button type="button" onClick={() => void removeGoal(goal)} disabled={saving} aria-label={`Remove goal: ${goal.title}`} className="rounded-lg px-2 py-1 text-xs text-white/30 transition hover:bg-red-400/10 hover:text-red-200">Remove</button>
                    </div>
                  </article>
                ))}
                {completed === goals.length && goals.length > 0 && (
                  <div className="rounded-2xl border border-[#83a981]/25 bg-[#83a981]/[0.08] p-5">
                    <p className="text-sm font-semibold text-[#c5dfbd]">Look at what you followed through on.</p>
                    <p className="mt-1 text-sm leading-6 text-white/55">Take the win. When you're ready, choose what comes next—there's no rush.</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <footer className="mt-10 border-t border-white/10 py-6 text-center">
          <p className="text-sm text-white/45">You are more than your checklist.</p>
          <p className="mt-1 text-xs text-white/25">Keep what matters. Let the rest evolve.</p>
        </footer>
      </section>
      <MobileNav />
    </main>
  );
}
