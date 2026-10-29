"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileNav } from "@/components/mobile-nav";
import { supabase } from "@/lib/supabase/client";

type StoryCategory = "AI & Tech" | "Science" | "Ideas";
type Story = {
  id: number;
  title: string;
  url: string;
  by: string;
  score: number;
  comments: number;
  time: number;
  category: StoryCategory;
  source: string;
  discussionUrl: string;
};
type FeedResponse = { stories?: Story[]; updatedAt?: string; error?: string };

const categories = ["All", "AI & Tech", "Science", "Ideas"] as const;
type CategoryFilter = (typeof categories)[number];

const curiosityCards = [
  {
    eyebrow: "Try a thought experiment",
    title: "If you had one weekend to build something useful, what would you make?",
    detail: "Pick a real problem around campus. Sketch the smallest useful version, then ask one person if it would help.",
    tag: "Build",
  },
  {
    eyebrow: "A good conversation starter",
    title: "What is a tiny thing that makes your day noticeably better?",
    detail: "A song, a walk, a clever shortcut, a favourite scene, or a friend who gets it. Share the idea, not private details.",
    tag: "People",
  },
  {
    eyebrow: "Look closer",
    title: "Find one everyday object that is secretly an engineering marvel.",
    detail: "A zipper, lift, camera, bicycle gear or tap can lead to a surprisingly deep rabbit hole.",
    tag: "Curiosity",
  },
];

function relativeTime(timestamp: number) {
  if (!timestamp) return "Recently";
  const minutes = Math.max(0, Math.floor(Date.now() / 1000 - timestamp) / 60);
  if (minutes < 60) return `${Math.max(1, Math.floor(minutes))}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

export default function DiscoverPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>("All");
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      try {
        const response = await fetch("/api/discover", { cache: "no-store" });
        const payload = (await response.json()) as FeedResponse;
        if (!response.ok) throw new Error(payload.error ?? "Could not load stories.");
        if (active) {
          setStories(payload.stories ?? []);
          setUpdatedAt(payload.updatedAt ?? "");
          setFeedError(payload.error ?? "");
        }
      } catch {
        if (active) setFeedError("The live feed is unavailable right now. The curiosity prompts below are ready to explore.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [router]);

  const visibleStories = useMemo(
    () => filter === "All" ? stories : stories.filter((story) => story.category === filter),
    [filter, stories],
  );

  return (
    <main className="dashboard-shell min-h-screen bg-[#f3f5f0] pb-24 text-[#181713] lg:pb-0">
      <header className="border-b border-[#d8d1c2]/70 bg-[#f8f7f1]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7b3f2a]">LifeMode<span className="text-[#7b3f2a]">.</span></Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Discover your next rabbit hole.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5a50]">Fresh ideas from the wider web, useful questions, and little sparks worth following.</p>
          </div>
          <Link href="/dashboard" className="nav-button shrink-0">Today</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-7 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="premium-panel rounded-[28px] border border-[#2f352d] bg-[#151814] p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d6c29d]">Your curiosity feed</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">The world is bigger than your to-do list.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#e2ddcf]">Explore technology, science, unexpected ideas and conversations. Save a link by bookmarking it in your browser, or open the original source to go deeper.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs">Live links</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs">Source credited</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs">No endless scroll</span>
          </div>
        </div>
        <div className="premium-panel rounded-[28px] p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">A small social spark</p>
          <h2 className="mt-2 text-2xl font-semibold">Interesting things are better shared.</h2>
          <p className="mt-3 text-sm leading-6 text-[#5f5a50]">Find a story you like? Bring it to a study partner, a friend, or a future LifeMode conversation. You choose what you share.</p>
          <Link href="/dashboard?view=connections" className="nav-button mt-5 inline-flex">Explore connections</Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-8">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">From the wider web</p>
            <h2 className="mt-1 text-2xl font-semibold">Fresh stories</h2>
            <p className="mt-1 text-sm text-[#5f5a50]">Public Hacker News links · refreshed about every 15 minutes{updatedAt ? ` · checked ${new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter stories">
            {categories.map((category) => (
              <button key={category} onClick={() => setFilter(category)} aria-pressed={filter === category} className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${filter === category ? "border-[#5142cf] bg-[#5142cf] text-white" : "border-[#d8d1c2] bg-white/70 text-[#49453d]"}`}>{category}</button>
            ))}
          </div>
        </div>

        {feedError ? <p role="status" className="mb-4 rounded-xl border border-[#e2c58c] bg-[#fff8e6] p-3 text-sm text-[#6a4a13]">{feedError}</p> : null}
        {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="premium-panel h-48 animate-pulse rounded-2xl bg-white/60" />)}</div> : null}
        {!loading && visibleStories.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleStories.map((story, index) => (
              <article key={story.id} className="premium-panel flex min-h-52 flex-col rounded-2xl p-5" style={{ animationDelay: `${index * 35}ms` }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#e9e5ff] px-2.5 py-1 text-xs font-semibold text-[#5142cf]">{story.category}</span>
                  <span className="text-xs text-[#77756d]">{relativeTime(story.time)}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold leading-6">{story.title}</h3>
                <p className="mt-2 text-xs text-[#77756d]">Via {story.source} · {story.score} points · {story.comments} comments</p>
                <div className="mt-auto flex flex-wrap gap-4 pt-5 text-sm font-semibold">
                  <a href={story.url} target="_blank" rel="noopener noreferrer" className="text-[#5142cf] underline">Read original ↗</a>
                  <a href={story.discussionUrl} target="_blank" rel="noopener noreferrer" className="text-[#5142cf] underline">Discuss ↗</a>
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {!loading && !visibleStories.length ? <p className="rounded-2xl border border-[#d8d1c2] bg-white/70 p-5 text-sm text-[#5f5a50]">{stories.length ? "No stories in this category just now. Pick another topic." : "No live stories arrived this time. Try again in a little while."}</p> : null}
        <p className="mt-4 text-xs leading-5 text-[#77756d]">LifeMode shows story titles, public discussion counts and links; the linked publishers own their articles. External pages may contain material we do not control.</p>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">Made for LifeMode</p>
          <h2 className="mt-1 text-2xl font-semibold">A few ways to get curious</h2>
          <p className="mt-1 text-sm text-[#5f5a50]">Original prompts, not scraped posts or made-up community activity.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {curiosityCards.map((card) => (
            <article key={card.title} className="premium-panel rounded-2xl p-5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7b3f2a]">{card.eyebrow}</span>
              <h3 className="mt-3 text-lg font-semibold leading-6">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5f5a50]">{card.detail}</p>
              <span className="mt-4 inline-flex rounded-full border border-[#d8d1c2] px-3 py-1 text-xs font-semibold">{card.tag}</span>
            </article>
          ))}
        </div>
      </section>
      <MobileNav />
    </main>
  );
}
