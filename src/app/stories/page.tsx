"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { storyCatalog } from "@/lib/lifemode/story-catalog";
import { originalStories } from "@/lib/lifemode/original-stories";
import { MobileNav } from "@/components/mobile-nav";

const stories = [
  { slug: "the-girl-who-collected-mornings", number: "01", category: "A LITTLE MAGIC", title: "The Girl Who Collected Mornings", excerpt: "Mira began saving the quiet minutes before the city woke up. She didn't know they would lead her to the thing she'd been too afraid to begin.", time: "4 MIN READ", symbol: "☼", tone: "rose" },
  { slug: "the-last-light-in-the-library", number: "02", category: "MYSTERY", title: "The Last Light in the Library", excerpt: "At 8:17 every evening, one light stayed on in the old library. One rainy night, Noor decided to find out who was still reading.", time: "5 MIN READ", symbol: "✦", tone: "gold" },
  { slug: "a-map-made-of-mistakes", number: "03", category: "COMING OF AGE", title: "A Map Made of Mistakes", excerpt: "Every wrong turn in Dev's notebook looked like proof that he was lost. Then he met someone who saw a map where he saw a mess.", time: "4 MIN READ", symbol: "⌁", tone: "green" },
  { slug: "the-smallest-planet", number: "04", category: "SCI-FI", title: "The Smallest Planet", excerpt: "A young engineer found a planet no bigger than a house, orbiting a star no telescope had ever recorded. It had one unusual request.", time: "6 MIN READ", symbol: "✧", tone: "violet" },
];

export default function StoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const allOriginals = useMemo(() => [
    ...stories,
    ...originalStories.map((story, index) => ({
      slug: story.slug,
      number: String(index + 5).padStart(2, "0"),
      category: story.category,
      title: story.title,
      excerpt: story.paragraphs[0],
      time: "2 MIN READ",
      symbol: story.symbol,
      tone: story.tone,
    })),
  ], []);
  const genres = useMemo(() => ["All", ...Array.from(new Set([...storyCatalog.map((story) => story.genre), ...allOriginals.map((story) => story.category)])).sort()], [allOriginals]);
  const filteredCatalog = useMemo(() => storyCatalog.filter((story) => (selectedGenre === "All" || story.genre === selectedGenre) && [story.title, story.author, story.genre, story.description].join(" ").toLowerCase().includes(searchQuery.trim().toLowerCase())), [searchQuery, selectedGenre]);
  const filteredOriginals = useMemo(() => allOriginals.filter((story) => (selectedGenre === "All" || story.category === selectedGenre) && [story.title, story.category, story.excerpt].join(" ").toLowerCase().includes(searchQuery.trim().toLowerCase())), [allOriginals, searchQuery, selectedGenre]);
  return <main className="lm-stories min-h-screen pb-28 text-[#f7f1e8] lg:pb-8">
    <header className="lm-story-nav"><Link href="/discover" className="lm-story-brand"><span>L</span> LIFEMODE.</Link><Link href="/play" className="lm-story-nav-link">Play a game <b>↗</b></Link></header>
    <section className="lm-stories-hero"><p className="lm-story-eyebrow"><i /> THE STORY ROOM · A PLACE TO GET LOST</p><h1>One more page.<br/><em>One new world.</em></h1><p>Little stories for the in-between moments. Find a mystery, a bit of wonder, or a reminder you didn't know you needed.</p><div className="lm-story-hero-orb" aria-hidden="true"><span>✦</span><i/><i/><i/></div><div className="lm-story-scroll">{allOriginals.length} LIFE-MODE ORIGINALS + {storyCatalog.length} CLASSICS <span>↓</span></div></section>
    <section className="lm-story-list"><div className="lm-story-list-heading"><div><p className="lm-story-eyebrow">CHOOSE YOUR NEXT ESCAPE</p><h2>Stories for your <em>own little universe.</em></h2></div><span>{allOriginals.length + storyCatalog.length} READS TO EXPLORE</span></div>
      <label className="mb-5 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3"><span aria-hidden="true">⌕</span><input value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setVisibleCount(24); }} placeholder={"Search " + (storyCatalog.length + allOriginals.length) + " reads by title, author or genre…"} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50" /><span className="text-xs text-white/55">{filteredCatalog.length + filteredOriginals.length} results</span></label>
      <div className="mb-5 flex flex-wrap gap-2">{genres.map((genre) => <button key={genre} type="button" onClick={() => { setSelectedGenre(genre); setVisibleCount(24); }} className={selectedGenre === genre ? "rounded-full border border-[#d8bd7b] bg-[#d8bd7b] px-3 py-1.5 text-xs font-semibold text-[#1b2118]" : "rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/75 hover:border-[#d8bd7b]/60"}>{genre}</button>)}</div>
      <div className="lm-story-grid">{filteredOriginals.map(story => <Link href={"/stories/" + story.slug} key={story.slug} className={"lm-story-card tone-" + story.tone}><div className="lm-story-art"><span>{story.symbol}</span><i/><i/><small>0{story.number}</small></div><div className="lm-story-card-copy"><p>{story.category} <span>·</span> {story.time}</p><h3>{story.title}</h3><p className="lm-story-excerpt">{story.excerpt}</p><div className="lm-story-enter">READ ORIGINAL <b>↗</b></div></div></Link>)}
      {filteredCatalog.slice(0, visibleCount).map((story, index) => <a key={story.title + story.author} href={"https://www.gutenberg.org/ebooks/search/?query=" + encodeURIComponent(story.title + " " + story.author)} target="_blank" rel="noreferrer" className="lm-story-card tone-gold"><div className="lm-story-art"><span>✦</span><i/><i/><small>{String(index + 5).padStart(2, "0")}</small></div><div className="lm-story-card-copy"><p>{story.genre.toUpperCase()} <span>·</span> {story.author}</p><h3>{story.title}</h3><p className="lm-story-excerpt">{story.description}</p><div className="lm-story-enter">FIND FULL TEXT <b>↗</b></div></div></a>)}</div>
      {filteredCatalog.length > visibleCount && <button type="button" onClick={() => setVisibleCount((count) => count + 24)} className="mt-7 rounded-full border border-[#d8bd7b]/50 px-6 py-3 text-sm font-semibold text-[#e6d5aa] hover:bg-white/5">Load more stories ({filteredCatalog.length - visibleCount} left)</button>}
      {!filteredCatalog.length && !filteredOriginals.length && <p className="mt-6 text-sm text-white/65">No stories match those filters. Try another title, author or genre.</p>}
    </section>
    <section className="lm-story-bottom"><span>✧</span><p>Take your time. There is no streak to keep, no score to chase.</p><Link href="/discover">Return to your world ↗</Link></section>
    <MobileNav/>
  </main>;
}
