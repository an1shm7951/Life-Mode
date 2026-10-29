"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MobileNav } from "@/components/mobile-nav";
import { supabase } from "@/lib/supabase/client";

type Story = {
  id: number;
  title: string;
  url: string | null;
  by: string;
  score: number;
  commentsCount: number;
  time: number;
};
type StoryComment = { id: number; by: string; time: number; text: string };
type StoryResponse = { story?: Story; comments?: StoryComment[]; error?: string };

function relativeTime(timestamp: number) {
  if (!timestamp) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() / 1000 - timestamp) / 60));
  if (minutes < 60) return minutes < 1 ? "Just now" : \`\${minutes}m ago\`;
  if (minutes < 1440) return \`\${Math.floor(minutes / 60)}h ago\`;
  return \`\${Math.floor(minutes / 1440)}d ago\`;
}

export default function DiscoverStoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      try {
        const response = await fetch(\`/api/discover/\${encodeURIComponent(params.id)}\`, { cache: "no-store" });
        const payload = (await response.json()) as StoryResponse;
        if (!response.ok || !payload.story) throw new Error(payload.error ?? "This story could not be loaded.");
        if (active) {
          setStory(payload.story);
          setComments(payload.comments ?? []);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "This story could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [params.id, router]);

  return (
    <main className="dashboard-shell min-h-screen bg-[#f3f5f0] pb-24 text-[#181713] lg:pb-0">
      <header className="border-b border-[#d8d1c2]/70 bg-[#f8f7f1]/92 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/dashboard" className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7b3f2a]">LifeMode.</Link>
          <Link href="/discover" className="nav-button shrink-0">Back to Discover</Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b3f2a]">Discover · Story</p>
        {loading ? (
          <div className="mt-5 space-y-4" aria-label="Loading story">
            <div className="h-10 animate-pulse rounded-xl bg-white/70" />
            <div className="h-28 animate-pulse rounded-2xl bg-white/70" />
          </div>
        ) : error || !story ? (
          <section className="premium-panel mt-5 rounded-2xl p-6">
            <h1 className="text-xl font-semibold">Story unavailable</h1>
            <p role="status" className="mt-2 text-sm text-[#5f5a50]">{error || "This story is no longer available."}</p>
            <Link href="/discover" className="nav-button mt-5 inline-flex">Return to Discover</Link>
          </section>
        ) : (
          <>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{story.title}</h1>
            <p className="mt-4 text-sm text-[#6b665c]">Shared by {story.by} · {relativeTime(story.time)} · {story.score} points</p>

            <section className="premium-panel mt-7 rounded-[24px] p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">The story</p>
              <p className="mt-3 text-base leading-7 text-[#39372f]">
                The article is displayed here when its publisher allows in-app embedding. Some publishers block this, so we also keep the story details and public conversation available in LifeMode.
              </p>
              {story.url ? (
                <iframe
                  src={story.url}
                  title={`Article: ${story.title}`}
                  className="mt-5 min-h-[65vh] w-full rounded-xl border border-[#d8d1c2] bg-white"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-forms"
                />
              ) : null}
              {story.url ? (
                <p className="mt-3 text-xs leading-5 text-[#77756d]">
                  If the publisher blocks the embedded article, its full text cannot be shown inside LifeMode. The story discussion below still works here.
                </p>
              ) : null}
            </section>

            <section className="mt-9">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">Community conversation</p>
                  <h2 className="mt-1 text-2xl font-semibold">Discussion</h2>
                </div>
                <span className="text-sm text-[#6b665c]">{story.commentsCount} comments total</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#6b665c]">A selection of public comments from the source discussion, shown here so you can explore without leaving LifeMode.</p>
              <div className="mt-4 space-y-3">
                {comments.map((comment) => (
                  <article key={comment.id} className="premium-panel rounded-2xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{comment.by}</span>
                      <span className="text-xs text-[#77756d]">{relativeTime(comment.time)}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#39372f]">{comment.text}</p>
                  </article>
                ))}
                {!comments.length ? <p className="rounded-2xl border border-[#d8d1c2] bg-white/70 p-5 text-sm text-[#5f5a50]">No public comments are available for this story yet.</p> : null}
              </div>
              <p className="mt-4 text-xs leading-5 text-[#77756d]">Comments are fetched from the public Hacker News discussion. They are not written or moderated by LifeMode.</p>
            </section>
          </>
        )}
      </article>
      <MobileNav />
    </main>
  );
}
