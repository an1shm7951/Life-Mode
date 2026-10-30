"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { MobileNav } from "@/components/mobile-nav";
import type { LifeModeId } from "@/lib/lifemode/types";

type Goal = { id: string; title: string; mode: LifeModeId; done: boolean; due_date: string | null };
type Chat = { role: "user" | "assistant"; content: string };
type Reminder = { id: string; title: string; dueAt: string; place: string; lat?: number; lon?: number; radius: number; notified?: boolean };

const keyFor = (id: string) => `lifemode-reminders-${id}`;
const distanceMeters = (a: number, b: number, c: number, d: number) => {
 const rad = (v: number) => v * Math.PI / 180;
 const x = rad(c-a), y = rad(d-b);
 const h = Math.sin(x/2)**2 + Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(y/2)**2;
 return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
};

export default function AiBuddyPage() {
 const router = useRouter();
 const [userId,setUserId] = useState("");
 const [mode,setMode] = useState<LifeModeId>("student");
 const [goals,setGoals] = useState<Goal[]>([]);
 const [chat,setChat] = useState<Chat[]>([{role:"assistant",content:"Hey, I'm AI Buddy. I can help you think things through, plan your day and work with the goals you've saved in LifeMode. What would you like help with?"}]);
 const [message,setMessage] = useState("");
 const [busy,setBusy] = useState(false);
 const [reminders,setReminders] = useState<Reminder[]>([]);
 const [reminderTitle,setReminderTitle] = useState("");
 const [reminderTime,setReminderTime] = useState("");
 const [place,setPlace] = useState("");
 const [locationBusy,setLocationBusy] = useState(false);
 const [status,setStatus] = useState("");
 const [voiceAvailable,setVoiceAvailable] = useState(false);
 const watchId = useRef<number | null>(null);
 const remindersRef = useRef<Reminder[]>([]);
 const notify = useCallback((title:string, body:string) => {
   if ("Notification" in window && Notification.permission === "granted") new Notification(title,{body,tag:"lifemode-"+title});
 },[]);
 useEffect(()=>{remindersRef.current=reminders;},[reminders]);
 useEffect(()=>{
   const w = window as Window & { SpeechRecognition?: new () => {lang:string; continuous:boolean; interimResults:boolean; onresult:((event:{results:{[n:number]:{[n:number]:{transcript:string}}}})=>void)|null; onerror:(()=>void)|null; onend:(()=>void)|null; start:()=>void; stop:()=>void}; webkitSpeechRecognition?: new () => {lang:string; continuous:boolean; interimResults:boolean; onresult:((event:{results:{[n:number]:{[n:number]:{transcript:string}}}})=>void)|null; onerror:(()=>void)|null; onend:(()=>void)|null; start:()=>void; stop:()=>void} };
   setVoiceAvailable(!!(w.SpeechRecognition||w.webkitSpeechRecognition));
 },[]);
 useEffect(()=>{
   let alive=true;
   (async()=>{
     const {data:{user}}=await supabase.auth.getUser();
     if(!user){router.push("/login");return;}
     if(!alive)return;
     setUserId(user.id);
     setMode((user.user_metadata?.first_mode||"student").toLowerCase() as LifeModeId);
     const [{data:gs},{data:hs}] = await Promise.all([
       supabase.from("goals").select("id,title,mode,done,due_date").eq("user_id",user.id).order("created_at",{ascending:true}).limit(100),
       supabase.from("ai_buddy_history").select("prompt,message").eq("user_id",user.id).order("created_at",{ascending:false}).limit(12)
     ]);
     if(!alive)return;
     setGoals((gs||[]) as Goal[]);
     if(hs?.length) setChat([...hs.reverse().flatMap((h:{prompt:string;message:string})=>[{role:"user" as const,content:h.prompt},{role:"assistant" as const,content:h.message}])]);
     try {setReminders(JSON.parse(localStorage.getItem(keyFor(user.id))||"[]") as Reminder[]);}catch{setReminders([]);}
   })();
   return ()=>{alive=false;};
 },[router]);
 useEffect(()=>{
   if(!userId)return;
   localStorage.setItem(keyFor(userId),JSON.stringify(reminders));
 },[userId,reminders]);
 useEffect(()=>{
   const tick=()=> {
     const now=Date.now();
     setReminders(old=>old.map(r=>{
       if(!r.notified && r.dueAt && new Date(r.dueAt).getTime()<=now){
         notify("LifeMode reminder",r.title);
         return {...r,notified:true};
       }
       return r;
     }));
   };
   tick(); const id=window.setInterval(tick,15000); return ()=>window.clearInterval(id);
 },[notify]);
 useEffect(()=>{
   if(!reminders.some(r=>r.lat!==undefined&&!r.notified)||!("geolocation" in navigator))return;
   watchId.current=navigator.geolocation.watchPosition(pos=>{
     const {latitude,longitude}=pos.coords;
     setReminders(old=>old.map(r=>{
       if(r.lat===undefined||r.notified)return r;
       if(distanceMeters(latitude,longitude,r.lat,r.lon!)<=r.radius){notify("You're here",r.title);return {...r,notified:true};}
       return r;
     }));
   },()=>setStatus("Location access is unavailable. Time reminders will still work."),{enableHighAccuracy:false,maximumAge:60000,timeout:15000});
   return ()=>{if(watchId.current!==null)navigator.geolocation.clearWatch(watchId.current);};
 },[reminders,notify]);
 async function send(e?:FormEvent){
   e?.preventDefault(); const text=message.trim(); if(!text||busy)return;
   const next=[...chat,{role:"user" as const,content:text}]; setChat(next);setMessage("");setBusy(true);setStatus("");
   try{
     const {data:{session}}=await supabase.auth.getSession();
     if(!session?.access_token){router.push("/login");return;}
     const response=await fetch("/api/ai-buddy",{method:"POST",headers:{Authorization:`Bearer ${session.access_token}`,"Content-Type":"application/json"},body:JSON.stringify({mode,goal:text,history:next.slice(-12).slice(0,-1)})});
     const data=await response.json();
     if(!response.ok||!data.plan)throw new Error(data.error||"AI Buddy is unavailable.");
     const answer=String(data.plan.message);
     setChat(old=>[...old,{role:"assistant",content:answer}]);
     await supabase.from("ai_buddy_history").insert({user_id:userId,mode,buddy_mode:"AI Buddy",prompt:text,message:answer,next_actions:[]});
   }catch(err){setStatus(err instanceof Error?err.message:"Could not reach AI Buddy.");}
   finally{setBusy(false);}
 }
 function startVoice(){
   const w=window as Window & { SpeechRecognition?: new () => {lang:string;continuous:boolean;interimResults:boolean;onresult:((event:{results:{[n:number]:{[n:number]:{transcript:string}}}})=>void)|null;onerror:(()=>void)|null;onend:(()=>void)|null;start:()=>void};webkitSpeechRecognition?: new () => {lang:string;continuous:boolean;interimResults:boolean;onresult:((event:{results:{[n:number]:{[n:number]:{transcript:string}}}})=>void)|null;onerror:(()=>void)|null;onend:(()=>void)|null;start:()=>void} };
   const C=w.SpeechRecognition||w.webkitSpeechRecognition;if(!C)return;
   const recognition=new C();recognition.lang=navigator.language||"en-IN";recognition.continuous=false;recognition.interimResults=false;
   recognition.onresult=(event)=>setMessage(event.results[0][0].transcript);recognition.onerror=()=>setStatus("Voice input could not start. Check microphone permission.");recognition.start();
 }
 function speak(text:string){if(!("speechSynthesis" in window))return;window.speechSynthesis.cancel();window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));}
 async function addReminder(e:FormEvent){
   e.preventDefault();if(!reminderTitle.trim()||!reminderTime)return;
   const r:Reminder={id:crypto.randomUUID(),title:reminderTitle.trim(),dueAt:new Date(reminderTime).toISOString(),place:place.trim(),radius:150};
   if(place.trim()){
     if(!navigator.geolocation){setStatus("This browser does not support location reminders.");return;}
     setLocationBusy(true);
     navigator.geolocation.getCurrentPosition(pos=>{
       setReminders(old=>[{...r,lat:pos.coords.latitude,lon:pos.coords.longitude},...old]);
       setReminderTitle("");setReminderTime("");setPlace("");setLocationBusy(false);setStatus("Reminder saved with this location as its trigger. Keep LifeMode open for location detection in this preview.");
     },()=>{setLocationBusy(false);setStatus("Location permission was not granted. Save the reminder without a place or try again.");},{enableHighAccuracy:false,timeout:15000});
   }else{setReminders(old=>[r,...old]);setReminderTitle("");setReminderTime("");setStatus("Reminder saved.");}
 }
 async function enableNotifications(){
   if(!("Notification" in window)){setStatus("This browser does not support notifications.");return;}
   const permission=await Notification.requestPermission();setStatus(permission==="granted"?"Notifications enabled.":"Notifications were not enabled.");
 }
 const activeGoals=goals.filter(g=>!g.done);
 return <main className="min-h-screen pb-28 text-[#f7f1e5] lg:pb-10" style={{background:"radial-gradient(ellipse at 75% 5%,rgba(177,139,66,.18),transparent 36rem),linear-gradient(145deg,#101d17,#17271e 55%,#0d1712)"}}>
  <header className="sticky top-0 z-20 border-b border-white/10 bg-[#101d17]/85 px-5 py-4 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/dashboard" className="font-semibold tracking-wide text-[#f6e9c8]">LifeMode<span className="text-[#c8a65c]">.</span></Link><div className="flex gap-2"><Link href="/dashboard" className="rounded-full border border-white/15 px-4 py-2 text-sm">Today</Link><Link href="/planning" className="rounded-full border border-white/15 px-4 py-2 text-sm">Plan</Link></div></div></header>
  <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1.3fr_.7fr] lg:px-8">
   <div className="min-w-0">
    <div className="mb-5 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#c8a65c]/40 bg-[#c8a65c]/10 text-2xl">✦</div><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-[#c8a65c]">Your personal companion</p><h1 className="text-3xl font-semibold sm:text-4xl">AI Buddy</h1></div></div>
    <p className="mb-6 max-w-2xl text-sm leading-6 text-[#d1d8d0]">A place to think out loud, make plans and get help grounded in the goals you've already saved.</p>
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[.045] shadow-2xl shadow-black/20">
     <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="font-semibold">Your conversation</p><p className="text-xs text-[#aeb9ae]">Mode: {mode.replace("_"," ")}</p></div><span className="rounded-full border border-[#bca05c]/30 px-3 py-1 text-xs text-[#e6d5a8]">LifeMode AI</span></div>
     <div className="grid max-h-[54vh] min-h-[360px] content-start gap-4 overflow-y-auto p-4 sm:p-6">{chat.map((item,i)=><div key={i} className={item.role==="user"?"ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-[#d8c18a] px-4 py-3 text-sm leading-6 text-[#182119]":"mr-auto max-w-[92%] rounded-2xl rounded-bl-sm border border-white/10 bg-[#23372a] px-4 py-3 text-sm leading-6 text-[#f4f0e7]"}><p className="whitespace-pre-wrap">{item.content}</p>{item.role==="assistant"&&<button onClick={()=>speak(item.content)} className="mt-2 text-xs text-[#d8c18a]">▶ Listen</button>}</div>)}{busy&&<p className="text-sm text-[#c8a65c]">AI Buddy is thinking…</p>}</div>
     <form onSubmit={send} className="border-t border-white/10 p-3 sm:p-4"><div className="flex items-end gap-2"><textarea value={message} onChange={e=>setMessage(e.target.value)} rows={2} maxLength={4000} placeholder="Ask anything, or tell me what's on your mind…" className="min-w-0 flex-1 resize-none rounded-2xl border border-white/10 bg-[#0e1912] px-4 py-3 text-sm text-white placeholder:text-[#849187] focus:border-[#c8a65c] focus:outline-none"/>{voiceAvailable&&<button type="button" onClick={startVoice} aria-label="Speak to AI Buddy" className="rounded-xl border border-white/15 px-3 py-3 text-lg">🎙</button>}<button disabled={busy||!message.trim()} className="rounded-xl bg-[#c8a65c] px-5 py-3 text-sm font-semibold text-[#172118] disabled:opacity-50">Send</button></div></form>
    </div>
    {status&&<p role="status" className="mt-3 rounded-xl border border-[#c8a65c]/20 bg-[#c8a65c]/10 px-4 py-3 text-sm text-[#eadbb7]">{status}</p>}
   </div>
   <aside className="grid content-start gap-5">
    <section className="rounded-[26px] border border-white/10 bg-white/[.045] p-5"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#c8a65c]">Your context</p><h2 className="mt-2 text-xl font-semibold">Goals AI Buddy can see</h2><p className="mt-1 text-sm text-[#aeb9ae]">Synced from your LifeMode account.</p>{activeGoals.length?<ul className="mt-4 grid gap-2">{activeGoals.slice(0,6).map(g=><li key={g.id} className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm">{g.title}<span className="mt-1 block text-xs text-[#9ba99c]">{g.mode.replace("_"," ")}{g.due_date?" · "+g.due_date:""}</span></li>)}</ul>:<p className="mt-4 rounded-xl border border-dashed border-white/15 p-4 text-sm text-[#aeb9ae]">No active goals yet. Add some in Goals and AI Buddy can use them in your conversations.</p>}<Link href="/dashboard#goals" className="mt-4 inline-block text-sm font-semibold text-[#e4cb8e]">Manage goals →</Link></section>
    <section className="rounded-[26px] border border-white/10 bg-white/[.045] p-5"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#c8a65c]">LifeMode Pulse</p><h2 className="mt-2 text-xl font-semibold">Reminders that meet you there</h2><p className="mt-1 text-sm leading-6 text-[#aeb9ae]">Set a time reminder, or add a place to save its location as a trigger.</p><button onClick={enableNotifications} className="mt-3 rounded-full border border-[#c8a65c]/40 px-4 py-2 text-xs font-semibold text-[#e4cb8e]">Enable notifications</button>
     <form onSubmit={addReminder} className="mt-4 grid gap-3"><label className="grid gap-1 text-xs text-[#b9c4ba]">Reminder<input required value={reminderTitle} onChange={e=>setReminderTitle(e.target.value)} placeholder="e.g. Review today's workout" className="rounded-xl border border-white/10 bg-[#0e1912] px-3 py-3 text-sm text-white"/></label><label className="grid gap-1 text-xs text-[#b9c4ba]">Date and time<input required type="datetime-local" value={reminderTime} onChange={e=>setReminderTime(e.target.value)} className="rounded-xl border border-white/10 bg-[#0e1912] px-3 py-3 text-sm text-white"/></label><label className="grid gap-1 text-xs text-[#b9c4ba]">Place trigger (optional)<input value={place} onChange={e=>setPlace(e.target.value)} placeholder="e.g. My gym — use current location" className="rounded-xl border border-white/10 bg-[#0e1912] px-3 py-3 text-sm text-white"/></label><p className="text-xs leading-5 text-[#89978c]">For this preview, adding a place captures your current location. Background geofencing is not guaranteed; keep this page open. Location stays on this device.</p><button disabled={locationBusy} className="rounded-xl bg-[#c8a65c] px-4 py-3 text-sm font-semibold text-[#172118] disabled:opacity-50">{locationBusy?"Saving…":"Save reminder"}</button></form>
     {reminders.length>0&&<ul className="mt-4 grid gap-2">{reminders.map(r=><li key={r.id} className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/10 p-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{r.title}</p><p className="mt-1 text-xs text-[#9ba99c]">{new Date(r.dueAt).toLocaleString()}{r.lat!==undefined?" · Location trigger":""}{r.notified?" · Notified":""}</p></div><button onClick={()=>setReminders(old=>old.filter(x=>x.id!==r.id))} className="text-xs text-[#e2a99b]">Remove</button></li>)}</ul>}
    </section>
    <section className="rounded-[26px] border border-white/10 bg-white/[.045] p-5"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#c8a65c]">AI providers</p><h2 className="mt-2 text-xl font-semibold">Choose your intelligence</h2><p className="mt-2 text-sm leading-6 text-[#aeb9ae]">This preview uses the AI provider configured by LifeMode. Bring-your-own API keys, provider switching and secure key vault are planned next; never paste an API key into this chat.</p><div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs"><span className="rounded-xl border border-white/10 p-3">OpenAI</span><span className="rounded-xl border border-white/10 p-3">Gemini</span><span className="rounded-xl border border-white/10 p-3">Claude</span></div></section>
   </aside>
  </section><MobileNav/>
 </main>;
}
