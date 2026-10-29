"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileNav } from "@/components/mobile-nav";
import { supabase } from "@/lib/supabase/client";

type StoryCategory = "AI & Tech" | "Science" | "Ideas";
type Story = { id: number; title: string; url: string; by: string; score: number; comments: number; time: number; category: StoryCategory; source: string; discussionUrl: string };
type FeedResponse = { stories?: Story[]; updatedAt?: string; error?: string };
const realms = [
  { name: "All", title: "The Commons", symbol: "✳", description: "A little of everything worth your attention.", tint: "from-[#33452d] to-[#172219]" },
  { name: "AI & Tech", title: "Future Foundry", symbol: "⌘", description: "New tools, bold builders, and technology changing the rules.", tint: "from-[#263f37] to-[#17201b]" },
  { name: "Science", title: "The Observatory", symbol: "✺", description: "Space, nature, experiments, and the questions that move us forward.", tint: "from-[#41412d] to-[#1d241c]" },
  { name: "Ideas", title: "Idea Garden", symbol: "❋", description: "Fresh perspectives and surprising ideas to carry into real life.", tint: "from-[#423a29] to-[#1d2119]" },
] as const;
type RealmName = (typeof realms)[number]["name"];
const quests = [
  { label: "NOTICE", title: "Find the hidden system", prompt: "Pick one ordinary thing near you — a lift, zipper, tap, or app. What invisible system makes it work?", action: "Observe one thing closely for 60 seconds." },
  { label: "IMAGINE", title: "Build for a real person", prompt: "Imagine you could remove one small frustration from a student's day. What would you make, and who would test it first?", action: "Write a one-sentence idea and name its first tester." },
  { label: "CONNECT", title: "Borrow a different perspective", prompt: "What might change if you spoke to someone with a different experience of the world?", action: "Ask a thoughtful question and listen." },
  { label: "CREATE", title: "Make the tiny version", prompt: "Choose a useful idea and shrink it until you could make a rough first version in one afternoon.", action: "Sketch the smallest possible prototype." },
];
function relativeTime(timestamp: number) {
  if (!timestamp) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() / 1000 - timestamp) / 60));
  if (minutes < 60) return minutes < 1 ? "Just now" : minutes + "m ago";
  if (minutes < 1440) return Math.floor(minutes / 60) + "h ago";
  return Math.floor(minutes / 1440) + "d ago";
}

export default function DiscoverPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [realm, setRealm] = useState<RealmName>("All");
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [questIndex, setQuestIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [showJournal, setShowJournal] = useState(false);

  useEffect(() => {
    try {
      setSavedIds(JSON.parse(localStorage.getItem("lifemode-discover-saved") || "[]"));
      setCompleted(localStorage.getItem("lifemode-discover-quest-date") === new Date().toDateString());
      setQuestIndex(Number(localStorage.getItem("lifemode-discover-quest-index") || "0") % quests.length);
    } catch {}
  }, []);
  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace("/login"); return; }
      try {
        const response = await fetch("/api/discover", { cache: "no-store" });
        const payload = (await response.json()) as FeedResponse;
        if (!response.ok) throw new Error(payload.error || "Could not load the live feed.");
        if (active) { setStories(payload.stories || []); setUpdatedAt(payload.updatedAt || ""); setFeedError(payload.error || ""); }
      } catch {
        if (active) setFeedError("The live signals are quiet right now. The worlds and quest below are still open.");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [router]);

  const visibleStories = useMemo(() => realm === "All" ? stories : stories.filter((story) => story.category === realm), [realm, stories]);
  const featured = visibleStories.slice(0, 3);
  const quest = quests[questIndex];
  const savedStories = stories.filter((story) => savedIds.includes(story.id));
  function chooseRealm(next: RealmName) {
    setRealm(next); setShowJournal(false);
    document.getElementById("world-signals")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function toggleSaved(id: number) {
    const next = savedIds.includes(id) ? savedIds.filter((item) => item !== id) : [...savedIds, id];
    setSavedIds(next);
    try { localStorage.setItem("lifemode-discover-saved", JSON.stringify(next)); } catch {}
  }
  function nextQuest() {
    const next = (questIndex + 1) % quests.length;
    setQuestIndex(next); setCompleted(false);
    try { localStorage.setItem("lifemode-discover-quest-index", String(next)); localStorage.removeItem("lifemode-discover-quest-date"); } catch {}
  }
  function completeQuest() {
    setCompleted(true);
    try { localStorage.setItem("lifemode-discover-quest-date", new Date().toDateString()); } catch {}
  }

  return (
    <main className="discover-universe min-h-screen pb-28 text-[#f5f0e5] lg:pb-10">
      <header className="du-topbar">
        <Link href="/dashboard" className="du-brand"><span className="du-brand-mark">L</span><span>LIFEMODE<span className="text-[#d7ad54]">.</span></span></Link>
        <div className="du-live"><span /> YOUR WORLD, STILL UNFOLDING</div>
        <button className="du-journal" onClick={() => { setShowJournal(!showJournal); document.getElementById("world-signals")?.scrollIntoView({ behavior: "smooth" }); }} aria-pressed={showJournal}>▤ Journal <b>{savedIds.length}</b></button>
      </header>

      <section className="du-entry">
        <div className="du-entry-copy">
          <p className="du-eyebrow"><i /> DISCOVER / YOUR NEXT CHAPTER</p>
          <h1>Step outside<br />the <em>ordinary.</em></h1>
          <p className="du-intro">A living universe of things to wonder about, worlds to explore, and small quests that make you see your own world differently.</p>
          <div className="du-actions"><button className="du-primary" onClick={() => document.getElementById("world-realms")?.scrollIntoView({ behavior: "smooth" })}>Enter the worlds <span>↘</span></button><button className="du-text-action" onClick={() => document.getElementById("world-quest")?.scrollIntoView({ behavior: "smooth", block: "center" })}>Take a small quest ↗</button></div>
          <div className="du-entry-meta"><span>01 / CURIOSITY</span><span>02 / DISCOVERY</span><span>03 / POSSIBILITY</span></div>
        </div>
        <div className="du-portal" aria-label="An animated portal representing the worlds of Discover">
          <div className="du-orbit du-orbit-one" /><div className="du-orbit du-orbit-two" /><div className="du-orbit du-orbit-three" />
          <div className="du-portal-core"><div><span>∞</span><small>OPEN YOUR<br />PERSPECTIVE</small></div></div>
          <span className="du-star du-star-one">✳</span><span className="du-star du-star-two">✦</span><span className="du-star du-star-three">✧</span>
          <span className="du-coordinate du-coordinate-one">17° 23' N<br /><small>IDEAS IN ORBIT</small></span><span className="du-coordinate du-coordinate-two">FIELD NOTE / 001<br /><small>THE UNKNOWN IS OPEN</small></span>
        </div>
        <div className="du-entry-foot"><span>THIS ISN’T ANOTHER FEED.</span><span>IT’S A PLACE TO BEGIN.</span></div>
      </section>

      <section id="world-realms" className="du-section">
        <div className="du-heading"><div><p className="du-eyebrow"><i /> CHOOSE YOUR DIRECTION</p><h2>Where will curiosity<br /><em>take you?</em></h2></div><p>Each realm has a different atmosphere. Pick one to change the stories and ideas waiting for you.</p></div>
        <div className="du-realms">
          {realms.map((item, index) => <button key={item.name} onClick={() => chooseRealm(item.name)} aria-pressed={realm === item.name} className={"du-realm bg-gradient-to-br " + item.tint + (realm === item.name ? " du-realm-active" : "")}>
            <span className="du-realm-index">0{index + 1}<b>{realm === item.name ? "YOU ARE HERE" : "ENTER REALM ↗"}</b></span>
            <span className="du-realm-art"><i /><i /><b>{item.symbol}</b><small>✦</small></span>
            <span className="du-realm-kicker">{item.name === "All" ? "THE WHOLE UNIVERSE" : item.name === "AI & Tech" ? "THE NEXT FRONTIER" : item.name === "Science" ? "BEYOND THE KNOWN" : "UNEXPECTED PATHS"}</span>
            <span className="du-realm-title">{item.title}</span><span className="du-realm-desc">{item.description}</span>
            <span className="du-realm-enter">EXPLORE THIS WORLD <b>↗</b></span>
          </button>)}
        </div>
      </section>

      <section id="world-quest" className="du-quest">
        <div className="du-quest-intro"><p className="du-eyebrow"><i /> A SMALL QUEST FOR TODAY</p><h2>Change your<br /><em>point of view.</em></h2><p>Not a streak to protect. Not a score to chase. Just one tiny challenge to bring a little more curiosity into real life.</p><div className="du-progress"><span className={completed ? "du-progress-fill du-progress-done" : "du-progress-fill"} /></div><small>{completed ? "QUEST COMPLETE · COME BACK WHEN YOU’RE READY" : "ONE MOMENT. ONE NEW PERSPECTIVE."}</small></div>
        <div className="du-quest-card"><div className="du-quest-top"><span>FIELD QUEST / {String(questIndex + 1).padStart(2, "0")}</span><b>{completed ? "● COMPLETED" : "● AVAILABLE"}</b></div><small className="du-quest-label">{quest.label}</small><h3>{quest.title}</h3><p>{quest.prompt}</p><div className="du-next-move"><span>↗</span><div><small>YOUR NEXT MOVE</small>{quest.action}</div></div><div className="du-quest-actions"><button className={completed ? "du-done-button is-done" : "du-done-button"} onClick={completeQuest}>{completed ? "Quest completed ✓" : "I did this"} <b>→</b></button><button className="du-next-button" onClick={nextQuest}>Another quest ↗</button></div><small className="du-quest-note">Quest status stays on this device. No public scoreboards or pressure.</small></div>
      </section>

      <section id="world-signals" className="du-section du-signals">
        <div className="du-heading"><div><p className="du-eyebrow"><i /> SIGNALS FROM THE OUTSIDE WORLD</p><h2>{showJournal ? "Your field journal." : realm === "All" ? "Worth a closer look." : realms.find((item) => item.name === realm)?.title + "."}</h2><p className="du-signals-sub">{showJournal ? "Discoveries you chose to keep." : "Real stories from the wider web. Open one inside LifeMode, then decide where your curiosity goes next."}</p></div><div className="du-signal-controls"><small>{showJournal ? savedIds.length + " SAVED" : updatedAt ? "LIVE · " + new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "LIVE FEED"}</small><button onClick={() => setShowJournal(!showJournal)}>{showJournal ? "All signals ↗" : "Open journal ↗"}</button></div></div>
        <div className="du-filters" role="group" aria-label="Choose discovery realm">{realms.map((item) => <button key={item.name} onClick={() => { setRealm(item.name); setShowJournal(false); }} className={realm === item.name && !showJournal ? "is-active" : ""} aria-pressed={realm === item.name && !showJournal}>{item.name === "All" ? "All signals" : item.name}<span>{item.name === "All" ? stories.length : stories.filter((story) => story.category === item.name).length}</span></button>)}</div>
        {feedError ? <p role="status" className="du-feed-note">{feedError}</p> : null}
        {loading ? <div className="du-story-grid">{[1, 2, 3].map((item) => <div key={item} className="du-skeleton" />)}</div> : null}
        {!loading && (showJournal ? savedStories : featured).length ? <div className="du-story-grid">{(showJournal ? savedStories : featured).map((story, index) => <article key={story.id} className="du-story-card">
          <div className="du-story-top"><span>{story.category === "Science" ? "✺" : story.category === "AI & Tech" ? "⌘" : "✳"}</span><small>{story.category.toUpperCase()}</small><button className={savedIds.includes(story.id) ? "is-saved" : ""} onClick={() => toggleSaved(story.id)} aria-label={savedIds.includes(story.id) ? "Remove from journal" : "Save to journal"} aria-pressed={savedIds.includes(story.id)}>{savedIds.includes(story.id) ? "Saved ✓" : "+ Journal"}</button></div>
          <small className="du-story-index">DISCOVERY SIGNAL / 0{index + 1}</small><h3>{story.title}</h3><div className="du-story-meta"><span>{story.source}</span><span>·</span><span>{relativeTime(story.time)}</span><span>·</span><span>{story.score} points</span></div>
          <div className="du-story-footer"><Link href={"/discover/" + story.id}>Enter story <b>↗</b></Link><small>{story.comments} COMMENTS</small></div>
        </article>)}</div> : null}
        {!loading && !(showJournal ? savedStories : featured).length ? <div className="du-empty"><span>✧</span><h3>{showJournal ? "Your journal is waiting." : "A quiet moment between discoveries."}</h3><p>{showJournal ? "Save any story with “+ Journal” and it will live here on this device." : feedError || "No signals in this realm just now. Try another realm, or return later."}</p><button onClick={() => showJournal ? setShowJournal(false) : setRealm("All")}>{showJournal ? "Return to the worlds ↗" : "Explore all signals ↗"}</button></div> : null}
        {!showJournal && !loading && visibleStories.length > 3 ? <div className="du-more"><small>MORE SIGNALS FROM THIS REALM</small><div>{visibleStories.slice(3, 8).map((story) => <article key={story.id}><span>✳</span><div><small>{story.category} · {relativeTime(story.time)}</small><Link href={"/discover/" + story.id}>{story.title}</Link></div><button onClick={() => toggleSaved(story.id)} aria-label="Save story">{savedIds.includes(story.id) ? "✓" : "+"}</button></article>)}</div></div> : null}
        <p className="du-source-note">Stories are sourced from public Hacker News discussions. LifeMode credits the source and does not copy publisher articles. Journal saves are private to this device.</p>
      </section>

      <section className="du-closing"><div className="du-closing-symbol">✳</div><p className="du-eyebrow">THE WORLD IS BIGGER THAN YOUR ROUTINE</p><h2>Leave with a new<br /><em>question.</em></h2><p>Take something interesting back into your day. A thought, a question, a thing to make, or a conversation you wouldn’t have had otherwise.</p><button onClick={() => document.getElementById("world-realms")?.scrollIntoView({ behavior: "smooth" })}>Choose another path ↑</button></section>
      <footer className="du-footer"><Link href="/dashboard">← Back to your day</Link><span>LIFEMODE / DISCOVER</span><span>BUILT FOR A LIFE THAT KEEPS OPENING UP.</span></footer>
      <MobileNav />
    </main>
  );
}
