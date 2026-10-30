"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { AiBuddyResponse, LifeModeId } from "@/lib/lifemode/types";
import { createAiBuddyHistory, fetchAiBuddyHistory } from "@/lib/lifemode/database";

type Message = { role: "user" | "assistant"; content: string };
type Reminder = { id: string; title: string; when: string; place: string; createdAt: string };

const prompts = [
  "Help me organise the rest of today.",
  "Look at my goals and suggest my next step.",
  "I feel like I have too much to do. Help me prioritise.",
];

export default function BuddyPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [mode, setMode] = useState<LifeModeId>("student");
  const [name, setName] = useState("there");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "I'm AI Buddy, your LifeMode companion. I can help you make sense of your goals, plan your next steps and work through what's on your mind. Your saved goals are available to me when you ask about them." },
  ]);
  const [tab, setTab] = useState<"buddy" | "pulse">("buddy");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderWhen, setReminderWhen] = useState("");
  const [reminderPlace, setReminderPlace] = useState("");
  const [notice, setNotice] = useState("");
  const [voiceAvailable, setVoiceAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      if (!active) return;
      setUserId(user.id);
      setName(user.user_metadata?.first_name || user.email?.split("@")[0] || "there");
      try {
        const savedHistory = await fetchAiBuddyHistory(user.id);
        if (active && savedHistory.length) {
          const restored = savedHistory.slice(0, 8).reverse().flatMap((item) => [
            { role: "user" as const, content: item.prompt },
            { role: "assistant" as const, content: item.message + (item.next_actions?.length ? "\\n\\nNext steps:\\n" + item.next_actions.map((action) => "• " + action).join("\\n") : "") },
          ]);
          setMessages((current) => [...current, ...restored]);
        }
      } catch {
        // Chat remains usable if history cannot be loaded.
      }
      const selected = user.user_metadata?.first_mode;
      const modeMap: Record<string, LifeModeId> = { Student: "student", Gym: "gym", Career: "career", Business: "business", Law: "law", Creator: "creator" };
      if (typeof selected === "string" && modeMap[selected]) setMode(modeMap[selected]);
      try {
        const saved = localStorage.getItem("lifemode-pulse-reminders");
        if (saved) setReminders(JSON.parse(saved) as Reminder[]);
      } catch { /* Ignore invalid local reminder data. */ }
      const speechWindow = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
      setVoiceAvailable(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
      setLoading(false);
    }
    init();
    return () => { active = false; };
  }, [router]);

  const history = useMemo(() => messages.slice(-10), [messages]);

  async function sendMessage(value = draft) {
    const prompt = value.trim();
    if (!prompt || !userId || sending) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: prompt }];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    setNotice("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { router.replace("/login"); return; }
      const response = await fetch("/api/ai-buddy", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          goal: prompt,
          history: history.map((item) => ({ role: item.role, content: item.content })),
        }),
      });
      const data = await response.json() as { plan?: AiBuddyResponse; error?: string };
      if (!response.ok || !data.plan) throw new Error(data.error || "AI Buddy is temporarily unavailable.");
      await createAiBuddyHistory({ userId, mode, prompt, plan: data.plan });
      setMessages((current) => [...current, { role: "assistant", content: data.plan!.message + (data.plan!.nextActions.length ? "\\n\\nNext steps:\\n" + data.plan!.nextActions.map((item) => "• " + item).join("\\n") : "") }]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Couldn't reach AI Buddy. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function saveReminder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reminderTitle.trim() || !reminderWhen) return;
    const item: Reminder = { id: crypto.randomUUID(), title: reminderTitle.trim(), when: reminderWhen, place: reminderPlace.trim(), createdAt: new Date().toISOString() };
    const updated = [item, ...reminders];
    setReminders(updated);
    try { localStorage.setItem("lifemode-pulse-reminders", JSON.stringify(updated)); } catch { setNotice("This device couldn't save the reminder."); }
    setReminderTitle(""); setReminderWhen(""); setReminderPlace("");
    setNotice("Reminder saved on this device. Background and location-triggered alerts are not active in this preview.");
  }

  function removeReminder(id: string) {
    const updated = reminders.filter((item) => item.id !== id);
    setReminders(updated);
    try { localStorage.setItem("lifemode-pulse-reminders", JSON.stringify(updated)); } catch { /* Keep current screen state. */ }
  }

  async function requestLocationPreview() {
    if (!navigator.geolocation) { setNotice("Location isn't available in this browser."); return; }
    setNotice("Requesting one-time location permission…");
    navigator.geolocation.getCurrentPosition(
      () => setNotice("Permission granted for a one-time location check. Continuous background tracking is not enabled."),
      () => setNotice("Location permission was not granted. You can still use time-based reminders."),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  function startVoiceInput() {
    const speechWindow = window as Window & { SpeechRecognition?: new () => { lang: string; interimResults: boolean; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void; start: () => void }; webkitSpeechRecognition?: new () => { lang: string; interimResults: boolean; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void; start: () => void } };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setNotice("Voice input isn't supported in this browser. You can still type to AI Buddy."); return; }
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event) => setDraft(event.results[0][0].transcript);
    recognition.onerror = () => setNotice("Voice input couldn't start. Check microphone permission.");
    recognition.start();
  }

  if (loading) return <main className="min-h-screen bg-[#101710] p-8 text-[#f6f0df]">Opening your companion…</main>;

  return (
    <main className="min-h-screen bg-[#101710] px-4 pb-12 pt-5 text-[#f6f0df] sm:px-7">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="text-sm font-semibold uppercase tracking-[0.2em] text-[#e5c783]">← LifeMode</Link>
          <span className="rounded-full border border-[#59684e] px-3 py-1 text-xs text-[#d5d0bd]">Personal companion · Preview</span>
        </header>
        <section className="relative mt-7 overflow-hidden rounded-[30px] border border-[#58634c] bg-[radial-gradient(circle_at_75%_10%,rgba(197,160,83,.23),transparent_35%),linear-gradient(135deg,#1d2b1d,#111711_70%)] p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full border border-[#d2b36d]/30 shadow-[0_0_80px_rgba(198,161,84,.12)]" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.24em] text-[#d8bd7b]">Your day, with a little more clarity</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">AI Buddy<span className="text-[#d9b96d]">.</span></h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#d6d8ca]">Welcome back, {name}. Your goals, plans and reminders should work together. Start with a question, and we'll build from there.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => setTab("buddy")} className={tab === "buddy" ? "rounded-full bg-[#d8bd7b] px-5 py-2 text-sm font-semibold text-[#172016]" : "rounded-full border border-[#65715c] px-5 py-2 text-sm"}>AI Buddy</button>
              <button onClick={() => setTab("pulse")} className={tab === "pulse" ? "rounded-full bg-[#d8bd7b] px-5 py-2 text-sm font-semibold text-[#172016]" : "rounded-full border border-[#65715c] px-5 py-2 text-sm"}>LifeMode Pulse</button>
            </div>
          </div>
        </section>

        {tab === "buddy" ? (
          <section className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
            <div className="rounded-3xl border border-[#3d4b3a] bg-[#182219] p-4 sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div><p className="text-sm font-semibold">Your AI companion</p><p className="mt-1 text-xs text-[#aeb9a5]">Connected to your LifeMode account</p></div>
                <span className="rounded-full bg-[#29432d] px-3 py-1 text-xs text-[#c9e0bf]">Ready</span>
              </div>
              <div className="my-5 grid max-h-[440px] gap-3 overflow-y-auto pr-1" aria-live="polite">
                {messages.map((message, index) => (
                  <article key={index} className={message.role === "user" ? "ml-auto max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[#d8bd7b] px-4 py-3 text-sm leading-6 text-[#1c2418]" : "max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-[#465443] bg-[#202d21] px-4 py-3 text-sm leading-6 text-[#f0eddf]"}>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[.15em] opacity-65">{message.role === "user" ? "You" : "AI Buddy"}</p>{message.content}
                  </article>
                ))}
                {sending && <p className="text-sm text-[#d8bd7b]">AI Buddy is thinking…</p>}
              </div>
              {notice && <p role="status" className="mb-3 rounded-xl border border-[#7d6940] bg-[#332d1d] p-3 text-xs leading-5 text-[#f0dfb5]">{notice}</p>}
              <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="flex flex-col gap-2 sm:flex-row">
                <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about your goals, plans or next step…" className="h-12 min-w-0 flex-1 rounded-xl border border-[#53624e] bg-[#101810] px-4 text-sm text-white outline-none placeholder:text-[#87917f] focus:border-[#d8bd7b]" />
                {voiceAvailable && <button type="button" onClick={startVoiceInput} aria-label="Use voice input" className="h-12 rounded-xl border border-[#65715c] px-4 text-sm">Voice</button>}
                <button disabled={sending || !draft.trim()} className="h-12 rounded-xl bg-[#d8bd7b] px-6 text-sm font-semibold text-[#172016] disabled:opacity-50">Send</button>
              </form>
              <p className="mt-2 text-[11px] text-[#9eaa98]">Voice input depends on browser and microphone support. Spoken AI replies are not enabled yet.</p>
            </div>
            <aside className="grid content-start gap-4">
              <div className="rounded-3xl border border-[#3d4b3a] bg-[#182219] p-5">
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#d8bd7b]">Try asking</p>
                <div className="mt-3 grid gap-2">{prompts.map((prompt) => <button key={prompt} onClick={() => void sendMessage(prompt)} className="rounded-xl border border-[#465443] bg-[#202d21] p-3 text-left text-sm leading-5 text-[#e6e7dc] transition hover:border-[#d8bd7b]">{prompt}</button>)}</div>
              </div>
              <div className="rounded-3xl border border-[#5c5137] bg-[#282619] p-5">
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#d8bd7b]">Provider settings</p>
                <h2 className="mt-2 text-xl font-semibold">Your AI, your choice.</h2>
                <p className="mt-2 text-sm leading-6 text-[#d6d1be]">The preview uses the AI provider configured by LifeMode. Bring-your-own API keys and model switching are planned, with server-side secret storage so keys never appear in the browser.</p>
                <span className="mt-4 inline-flex rounded-full border border-[#8a784e] px-3 py-1 text-xs text-[#e7d6a7]">Provider controls · Coming next</span>
              </div>
            </aside>
          </section>
        ) : (
          <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_.8fr]">
            <div className="rounded-3xl border border-[#3d4b3a] bg-[#182219] p-5 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#d8bd7b]">LifeMode Pulse</p>
              <h2 className="mt-2 text-3xl font-semibold">Remember at the right moment.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#c6cebf]">Create a reminder tied to a time and an optional place. This preview saves reminders on this device; it does not yet run background geofencing or send reliable notifications when the app is closed.</p>
              <form onSubmit={saveReminder} className="mt-6 grid gap-3">
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-[#c6cebf]">What should LifeMode remind you?<input required value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} placeholder="e.g. Check today's workout plan" className="h-12 rounded-xl border border-[#53624e] bg-[#101810] px-4 text-sm font-normal normal-case tracking-normal text-white" /></label>
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-[#c6cebf]">When?<input required type="datetime-local" value={reminderWhen} onChange={(e) => setReminderWhen(e.target.value)} className="h-12 rounded-xl border border-[#53624e] bg-[#101810] px-4 text-sm font-normal normal-case tracking-normal text-white" /></label>
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-[#c6cebf]">Place (optional)<input value={reminderPlace} onChange={(e) => setReminderPlace(e.target.value)} placeholder="e.g. Gym, college, library" className="h-12 rounded-xl border border-[#53624e] bg-[#101810] px-4 text-sm font-normal normal-case tracking-normal text-white" /></label>
                <button className="h-12 rounded-xl bg-[#d8bd7b] px-5 text-sm font-semibold text-[#172016]">Save reminder</button>
              </form>
              <button onClick={() => void requestLocationPreview()} className="mt-3 rounded-xl border border-[#65715c] px-4 py-3 text-left text-sm text-[#e4e5d9]">Check one-time location permission ↗</button>
              {notice && <p role="status" className="mt-3 rounded-xl border border-[#7d6940] bg-[#332d1d] p-3 text-xs leading-5 text-[#f0dfb5]">{notice}</p>}
            </div>
            <div className="rounded-3xl border border-[#3d4b3a] bg-[#182219] p-5">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#d8bd7b]">Your reminders</p>
              <div className="mt-4 grid gap-3">
                {reminders.length ? reminders.map((item) => <article key={item.id} className="rounded-2xl border border-[#465443] bg-[#202d21] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-xs text-[#b9c2b1]">{new Date(item.when).toLocaleString()}</p>{item.place && <p className="mt-2 text-xs text-[#d8bd7b]">⌖ {item.place}</p>}</div><button onClick={() => removeReminder(item.id)} className="text-xs text-[#d9b6a3] underline">Remove</button></div></article>) : <p className="rounded-2xl border border-dashed border-[#53624e] p-5 text-sm leading-6 text-[#b9c2b1]">No reminders yet. Add one and it will appear here on this device.</p>}
              </div>
              <div className="mt-5 rounded-2xl border border-[#5c5137] bg-[#282619] p-4 text-xs leading-5 text-[#d6d1be]"><strong className="text-[#e7d6a7]">Privacy by design</strong><br/>Location is optional. This preview only asks for a one-time location check when you tap the button; it does not continuously track you.</div>
            </div>
          </section>
        )}
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#465443] pt-5 text-xs text-[#9eaa98]"><span>LifeMode is more than a checklist.</span><Link href="/dashboard" className="text-[#d8bd7b]">Back to your day →</Link></footer>
      </div>
    </main>
  );
}
