"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { MobileNav } from "@/components/mobile-nav";
import { SettingsIcon } from "@/components/settings-icon";
import type { LifeModeId } from "@/lib/lifemode/types";

type RoutineType = "college_days" | "weekend" | "exam" | "custom";
type Routine = { id: string; user_id: string; mode: LifeModeId; name: string; routine_type: RoutineType; active_days: number[]; created_at: string };
type Task = { id: string; user_id: string; routine_id: string; title: string; day_of_week: number; start_time: string | null; end_time: string | null; sort_order: number; created_at: string };
type Completion = { task_id: string; completed_on: string };
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const types: { value: RoutineType; label: string; activeDays: number[] }[] = [
 { value: "college_days", label: "College days", activeDays: [1,2,3,4,5] },
 { value: "weekend", label: "Weekend", activeDays: [0,6] },
 { value: "exam", label: "Exam routine", activeDays: [0,1,2,3,4,5,6] },
 { value: "custom", label: "Custom", activeDays: [1,2,3,4,5] },
];
const modes: { value: LifeModeId; label: string }[] = [
 { value: "student", label: "Student" }, { value: "gym", label: "Gym" }, { value: "career", label: "Career" },
 { value: "business", label: "Business" }, { value: "law", label: "Law" }, { value: "creator", label: "Creator" },
];
const dateKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const errorMessage = (e: unknown) => e instanceof Error ? e.message : "Please try again.";
const timeLabel = (v: string | null) => { if (!v) return "Flexible"; const [h,m] = v.split(":").map(Number); return new Date(2000,0,1,h,m).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}); };

export default function PlanningPage() {
 const router = useRouter();
 const [userId,setUserId] = useState("");
 const [mode,setMode] = useState<LifeModeId>("student");
 const [routines,setRoutines] = useState<Routine[]>([]);
 const [tasks,setTasks] = useState<Task[]>([]);
 const [completions,setCompletions] = useState<Completion[]>([]);
 const [routineId,setRoutineId] = useState("");
 const [day,setDay] = useState(new Date().getDay());
 const [routineType,setRoutineType] = useState<RoutineType>("college_days");
 const [routineName,setRoutineName] = useState("");
 const [taskTitle,setTaskTitle] = useState("");
 const [taskDay,setTaskDay] = useState(String(new Date().getDay()));
 const [start,setStart] = useState("");
 const [end,setEnd] = useState("");
 const [loading,setLoading] = useState(true);
 const [saving,setSaving] = useState(false);
 const [status,setStatus] = useState("");
 const today = dateKey();
 const routine = routines.find(r => r.id === routineId) ?? null;
 const dayTasks = useMemo(() => tasks.filter(t => t.routine_id === routineId && t.day_of_week === day).sort((a,b) => (a.start_time ?? "99:99").localeCompare(b.start_time ?? "99:99") || a.sort_order-b.sort_order), [tasks,routineId,day]);
 const doneCount = dayTasks.filter(t => completions.some(c => c.task_id === t.id && c.completed_on === today)).length;
 const load = useCallback(async (uid: string) => {
  const [r,t,c] = await Promise.all([
   supabase.from("schedule_routines").select("*").eq("user_id",uid).order("created_at"),
   supabase.from("schedule_tasks").select("*").eq("user_id",uid).order("sort_order"),
   supabase.from("schedule_task_completions").select("task_id,completed_on").eq("user_id",uid).eq("completed_on",dateKey()),
  ]);
  const err = r.error || t.error || c.error; if (err) throw err;
  const rs = (r.data ?? []) as Routine[];
  setRoutines(rs); setTasks((t.data ?? []) as Task[]); setCompletions((c.data ?? []) as Completion[]);
  setRoutineId(current => rs.some(x => x.id === current) ? current : rs[0]?.id ?? "");
 }, []);
 useEffect(() => {
  let cancelled = false;
  (async () => {
   try {
    const {data:{user},error} = await supabase.auth.getUser(); if (error) throw error;
    if (!user) { router.push("/login"); return; }
    if (cancelled) return;
    setUserId(user.id);
    const first = String(user.user_metadata?.first_mode ?? "student").toLowerCase() as LifeModeId;
    if (modes.some(x => x.value === first)) setMode(first);
    await load(user.id);
   } catch(e) { if (!cancelled) setStatus("Could not load plan: " + errorMessage(e)); }
   finally { if (!cancelled) setLoading(false); }
  })();
  return () => { cancelled = true; };
 }, [router,load]);
 async function createRoutine(e: FormEvent) {
  e.preventDefault(); if (!userId || saving) return;
  const type = types.find(x => x.value === routineType)!;
  setSaving(true); setStatus("Saving routine...");
  try {
   const {data,error} = await supabase.from("schedule_routines").insert({user_id:userId,mode,name:routineName.trim() || type.label,routine_type:routineType,active_days:type.activeDays}).select("*").single();
   if(error) throw error; const created = data as Routine;
   setRoutines(old => [...old,created]); setRoutineId(created.id); setRoutineName(""); setStatus("Routine saved.");
  } catch(e) { setStatus("Could not save routine: " + errorMessage(e)); } finally { setSaving(false); }
 }
 async function addTask(e: FormEvent) {
  e.preventDefault(); if (!userId || !routine || !taskTitle.trim() || saving) return;
  if(start && end && end <= start) { setStatus("End time must be later than start time."); return; }
  setSaving(true); setStatus("Adding task...");
  try {
   const order = tasks.filter(t => t.routine_id === routine.id && t.day_of_week === Number(taskDay)).length;
   const {data,error} = await supabase.from("schedule_tasks").insert({user_id:userId,routine_id:routine.id,title:taskTitle.trim(),day_of_week:Number(taskDay),start_time:start || null,end_time:end || null,sort_order:order}).select("*").single();
   if(error) throw error; setTasks(old => [...old,data as Task]); setTaskTitle(""); setStart(""); setEnd(""); setDay(Number(taskDay)); setStatus("Task added.");
  } catch(e) { setStatus("Could not add task: " + errorMessage(e)); } finally { setSaving(false); }
 }
 async function toggle(task: Task) {
  if(saving) return; const done = completions.some(c => c.task_id === task.id && c.completed_on === today); setSaving(true);
  try {
   if(done) {
    const {error} = await supabase.from("schedule_task_completions").delete().eq("task_id",task.id).eq("user_id",userId).eq("completed_on",today); if(error) throw error;
    setCompletions(old => old.filter(c => !(c.task_id === task.id && c.completed_on === today)));
   } else {
    const {data,error} = await supabase.from("schedule_task_completions").insert({task_id:task.id,user_id:userId,completed_on:today}).select("task_id,completed_on").single(); if(error) throw error;
    setCompletions(old => [...old,data as Completion]);
   }
   setStatus(done ? "Task unchecked." : "Task completed for today.");
  } catch(e) { setStatus("Could not update task: " + errorMessage(e)); } finally { setSaving(false); }
 }
 async function removeTask(task: Task) {
  if(saving || !window.confirm("Delete this task?")) return; setSaving(true);
  try {
   const {error} = await supabase.from("schedule_tasks").delete().eq("id",task.id).eq("user_id",userId); if(error) throw error;
   setTasks(old => old.filter(t => t.id !== task.id)); setCompletions(old => old.filter(c => c.task_id !== task.id)); setStatus("Task deleted.");
  } catch(e) { setStatus("Could not delete task: " + errorMessage(e)); } finally { setSaving(false); }
 }
 async function removeRoutine() {
  if(!routine || saving || !window.confirm("Delete this routine and its tasks?")) return; setSaving(true);
  try {
   const {error} = await supabase.from("schedule_routines").delete().eq("id",routine.id).eq("user_id",userId); if(error) throw error;
   setRoutines(old => old.filter(r => r.id !== routine.id)); setTasks(old => old.filter(t => t.routine_id !== routine.id)); setCompletions([]); setRoutineId(""); setStatus("Routine deleted.");
  } catch(e) { setStatus("Could not delete routine: " + errorMessage(e)); } finally { setSaving(false); }
 }
 if(loading) return <main className="min-h-screen px-5 py-12"><div className="mx-auto max-w-5xl premium-panel rounded-2xl p-8">Loading your plan…</div></main>;
 return <main className="min-h-screen pb-24 text-[#181713] lg:pb-8">
  <header className="sticky top-0 z-20 border-b px-5 py-4 sm:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
   <Link href="/dashboard" className="text-lg font-semibold tracking-tight">LifeMode</Link><div className="flex items-center gap-2"><Link href="/dashboard" className="nav-button">Today</Link><Link href="/settings" aria-label="Settings" title="Settings" className="nav-button"><SettingsIcon /></Link></div>
  </div></header>
  <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8">
   <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">Make the day intentional</p><h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Your plan</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5a50]">Build reusable routines, map tasks to days, and check off today's progress. Your plan stays saved to your account.</p></div><div className="rounded-2xl border border-white/70 bg-white/65 px-5 py-4 shadow-sm"><p className="text-sm text-[#5f5a50]">{new Date().toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"})}</p><p className="mt-1 text-2xl font-semibold">{doneCount} / {dayTasks.length} done today</p></div></div>
   {status && <p role="status" aria-live="polite" className="mt-5 rounded-xl border border-[#6656e8]/20 bg-white/70 px-4 py-3 text-sm">{status}</p>}
   <div className="mt-7 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
    <section className="premium-panel rounded-2xl p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">01 · Routines</p><h2 className="mt-2 text-2xl font-semibold">Build your rhythm</h2>
     {routines.length > 0 && <label className="mt-5 grid gap-2 text-sm font-medium">Choose routine<select value={routineId} onChange={e=>setRoutineId(e.target.value)} className="w-full border p-3">{routines.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>}
     {routine && <div className="mt-4 rounded-xl border border-white/70 bg-white/55 p-4"><p className="font-semibold">{routine.name}</p><p className="mt-1 text-sm text-[#5f5a50]">{modes.find(m=>m.value===routine.mode)?.label} · {types.find(t=>t.value===routine.routine_type)?.label} · {routine.active_days.map(d=>days[d].slice(0,3)).join(" / ")}</p><button type="button" onClick={removeRoutine} disabled={saving} className="mt-3 text-sm font-semibold text-red-700 underline">Delete routine</button></div>}
     <form onSubmit={createRoutine} className="mt-5 grid gap-3 border-t border-black/10 pt-5"><h3 className="font-semibold">{routines.length ? "Add another routine" : "Create your first routine"}</h3><label className="grid gap-2 text-sm font-medium">Routine type<select value={routineType} onChange={e=>setRoutineType(e.target.value as RoutineType)} className="border p-3">{types.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Name (optional)<input value={routineName} onChange={e=>setRoutineName(e.target.value)} maxLength={80} placeholder="e.g. Midterm week" className="border p-3" /></label><button disabled={saving} className="nav-button-dark w-full disabled:opacity-60">{saving ? "Saving…" : "Create routine"}</button></form>
    </section>
    <section className="premium-panel rounded-2xl p-5 sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">02 · Weekly plan</p><h2 className="mt-2 text-2xl font-semibold">Give each day a shape</h2></div><label className="grid gap-1 text-sm font-medium">Mode<select value={mode} onChange={e=>setMode(e.target.value as LifeModeId)} className="border p-2">{modes.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select></label></div>
     <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7">{days.map((d,i)=><button type="button" key={d} onClick={()=>{setDay(i);setTaskDay(String(i));}} className={day===i?"rounded-xl border border-[#6656e8]/40 bg-[#e5e1ff] px-2 py-3 text-sm font-semibold":"rounded-xl border border-white/80 bg-white/50 px-2 py-3 text-sm"}>{d.slice(0,3)}</button>)}</div>
     {!routine ? <div className="mt-6 rounded-xl border border-dashed border-black/20 p-6 text-center"><p className="font-semibold">Start with a routine</p><p className="mt-2 text-sm text-[#5f5a50]">Create a college-day, weekend, exam, or custom routine to start planning.</p></div> : <>
      <div className="mt-5 flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">{days[day]}'s tasks</h3><span className="text-sm text-[#5f5a50]">{dayTasks.length} planned</span></div>
      {dayTasks.length===0 ? <p className="mt-3 rounded-xl border border-dashed border-black/20 p-5 text-sm text-[#5f5a50]">Nothing planned for this day yet. Add your first task below.</p> : <ul className="mt-3 grid gap-2">{dayTasks.map(t=>{const checked=completions.some(c=>c.task_id===t.id&&c.completed_on===today);return <li key={t.id} className="flex items-start gap-3 rounded-xl border border-white/80 bg-white/65 p-3"><input aria-label={"Mark "+t.title+" complete today"} type="checkbox" checked={checked} onChange={()=>toggle(t)} disabled={saving} className="mt-1 h-4 w-4" /><div className="min-w-0 flex-1"><p className={checked?"font-medium line-through opacity-60":"font-medium"}>{t.title}</p><p className="mt-1 text-xs text-[#5f5a50]">{timeLabel(t.start_time)}{t.end_time?" – "+timeLabel(t.end_time):""}</p></div><button type="button" onClick={()=>removeTask(t)} disabled={saving} aria-label={"Delete "+t.title} className="px-2 text-sm text-red-700">Delete</button></li>;})}</ul>}
      <form onSubmit={addTask} className="mt-5 grid gap-3 border-t border-black/10 pt-5"><h3 className="font-semibold">Add a task</h3><label className="grid gap-2 text-sm font-medium">Task<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} maxLength={160} required placeholder="e.g. Revise linear algebra" className="border p-3" /></label><div className="grid gap-3 sm:grid-cols-3"><label className="grid gap-2 text-sm font-medium">Day<select value={taskDay} onChange={e=>setTaskDay(e.target.value)} className="border p-3">{days.map((d,i)=><option key={d} value={i}>{d}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Start<input type="time" value={start} onChange={e=>setStart(e.target.value)} className="border p-3" /></label><label className="grid gap-2 text-sm font-medium">End<input type="time" value={end} onChange={e=>setEnd(e.target.value)} className="border p-3" /></label></div><button disabled={saving||!taskTitle.trim()} className="nav-button-dark w-full disabled:opacity-60">{saving?"Saving…":"Add to plan"}</button></form>
     </>}
    </section>
   </div>
   <p className="mt-5 text-xs leading-5 text-[#5f5a50]">A checked task records completion for today only. Your routine remains reusable next week.</p>
  </section><MobileNav />
 </main>;
}
