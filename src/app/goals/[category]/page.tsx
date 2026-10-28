"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { MobileNav } from "@/components/mobile-nav";
import { createGoal, deleteGoal, fetchGoals, updateGoalDone, type GoalRow, type GoalType } from "@/lib/lifemode/database";
import type { LifeModeId } from "@/lib/lifemode/types";

const goalMeta: Record<GoalType, { title: string; eyebrow: string; description: string; placeholder: string }> = {
  daily: { title: "Daily goals", eyebrow: "Small wins, every day", description: "Build consistency with the important things you want to do today.", placeholder: "e.g. Review today's lecture notes" },
  short_term: { title: "Short-term goals", eyebrow: "The next few weeks", description: "Keep near-term outcomes visible and turn them into manageable steps.", placeholder: "e.g. Finish my PPS project this month" },
  long_term: { title: "Long-term goals", eyebrow: "The bigger picture", description: "Track the meaningful outcomes you are building toward over months and years.", placeholder: "e.g. Build and launch my first useful AI product" },
};
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
        if (active) setStatus("Couldn't load your goals. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void initialize();
    return () => { active = false; };
  }, [category, loadGoals, meta, router]);

  const completed = useMemo(() => goals.filter(goal => goal.done).length, [goals]);

  async function addGoal(event: FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || !userId || !meta || saving) return;
    setSaving(true);
    setStatus("Saving goal…");
    try {
      const goal = await createGoal(userId, mode, cleanTitle, category);
      setGoals(current => [...current, goal]);
      setTitle("");
      setStatus("Goal saved.");
    } catch {
      setStatus("Couldn't save this goal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleGoal(goal: GoalRow) {
    setSaving(true);
    try {
      const updated = await updateGoalDone(goal.id, !goal.done);
      setGoals(current => current.map(item => item.id === updated.id ? updated : item));
      setStatus(updated.done ? "Nice work — goal completed." : "Goal marked as in progress.");
    } catch {
      setStatus("Couldn't update this goal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function removeGoal(goal: GoalRow) {
    if (saving || !window.confirm("Delete this goal?")) return;
    setSaving(true);
    try {
      await deleteGoal(goal.id);
      setGoals(current => current.filter(item => item.id !== goal.id));
      setStatus("Goal deleted.");
    } catch {
      setStatus("Couldn't delete this goal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!meta) return null;
  if (loading) return <main className="min-h-screen px-5 py-12"><div className="premium-panel mx-auto max-w-4xl rounded-2xl p-8">Loading your goals…</div></main>;

  return (
    <main className="min-h-screen pb-24 text-[#181713] lg:pb-8">
      <header className="border-b border-[#d8d1c2]/70 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">LifeMode</Link>
          <Link href="/planning" className="text-sm font-semibold text-[#315260]">Open my plan ↗</Link>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-5 pt-8 sm:px-8">
        <Link href="/dashboard" className="text-sm font-semibold text-[#315260]">← Today</Link>
        <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">{meta.eyebrow}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{meta.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5a50]">{meta.description}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/65 px-5 py-4 shadow-sm">
            <p className="text-sm text-[#5f5a50]">Progress</p>
            <p className="mt-1 text-2xl font-semibold">{completed} / {goals.length} complete</p>
          </div>
        </div>
        {status && <p role="status" aria-live="polite" className="mt-5 rounded-xl border border-[#d8d1c2] bg-white/70 px-4 py-3 text-sm">{status}</p>}
        <form onSubmit={addGoal} className="premium-panel mt-7 grid gap-3 rounded-2xl p-4 sm:grid-cols-[1fr_auto] sm:p-5">
          <input value={title} onChange={event => setTitle(event.target.value)} placeholder={meta.placeholder} maxLength={180} required className="h-12 rounded-lg border border-[#c8beaa] bg-white px-4 text-base outline-none focus:border-[#315260]" />
          <button disabled={saving} className="h-12 rounded-lg bg-[#181713] px-6 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : "Add goal"}</button>
        </form>
        <div className="mt-6 grid gap-3">
          {goals.length === 0 ? (
            <div className="premium-panel rounded-2xl p-7">
              <h2 className="text-lg font-semibold">Start with one goal</h2>
              <p className="mt-2 text-sm leading-6 text-[#5f5a50]">You don't need a perfect plan. Add one goal that matters and adjust it as you go.</p>
            </div>
          ) : goals.map(goal => (
            <article key={goal.id} className="premium-panel flex items-start gap-3 rounded-2xl p-4 sm:p-5">
              <button type="button" onClick={() => void toggleGoal(goal)} disabled={saving} aria-label={goal.done ? "Mark goal incomplete" : "Mark goal complete"} className={goal.done ? "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#315260] text-white" : "mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 border-[#9a9a8c]"}>{goal.done ? "✓" : ""}</button>
              <div className="min-w-0 flex-1">
                <p className={goal.done ? "font-medium text-[#77756d] line-through" : "font-medium"}>{goal.title}</p>
                <p className="mt-1 text-xs text-[#77756d]">{goal.mode} · {goal.done ? "Completed" : "In progress"}</p>
              </div>
              <button type="button" onClick={() => void removeGoal(goal)} disabled={saving} className="rounded-lg px-2 py-1 text-sm text-[#7b3f2a] hover:bg-white/70">Delete</button>
            </article>
          ))}
        </div>
      </section>
      <MobileNav />
    </main>
  );
}
