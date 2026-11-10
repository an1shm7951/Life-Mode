"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";

const featuredStories = [
  { slug: "the-girl-who-collected-mornings", number: "01", category: "Wonder", title: "The Girl Who Collected Mornings", excerpt: "Mira began saving the quiet minutes before the city woke up. She didn't know they would lead her to the thing she'd been too afraid to begin.", time: "4 min", symbol: "☼", tone: "morning" },
  { slug: "the-last-light-in-the-library", number: "02", category: "Mystery", title: "The Last Light in the Library", excerpt: "At 8:17 every evening, one light stayed on in the old library. One rainy night, Noor decided to find out who was still reading.", time: "5 min", symbol: "✦", tone: "library" },
  { slug: "a-map-made-of-mistakes", number: "03", category: "Coming of age", title: "A Map Made of Mistakes", excerpt: "Every wrong turn in Dev's notebook looked like proof that he was lost. Then he met someone who saw a map where he saw a mess.", time: "4 min", symbol: "⌁", tone: "map" },
  { slug: "the-smallest-planet", number: "04", category: "Science fiction", title: "The Smallest Planet", excerpt: "A young engineer found a planet no bigger than a house, orbiting a star no telescope had ever recorded. It had one unusual request.", time: "6 min", symbol: "✧", tone: "planet" },
];
const stories = featuredStories;
const filters = ["All stories", "Mystery", "Wonder", "Adventure", "Science fiction", "Coming of age", "Magical realism"];

export default function StoriesPage() {
  const [filter, setFilter] = useState("All stories");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => stories.filter((story) => (filter === "All stories" || story.category.toLowerCase() === filter.toLowerCase()) && (story.title + " " + story.excerpt + " " + story.category).toLowerCase().includes(query.toLowerCase())), [filter, query]);
  const featured = stories[0];

  return (
    <main className="lm-stories-v2 min-h-screen pb-32 text-[#eee9e1]">
      <header className="lm-stories-nav"><Link href="/discover" className="lm-stories-wordmark">lifemode<span>.</span></Link><span className="lm-stories-nav-label">THE STORY ROOM</span><Link href="/discover" className="lm-stories-back">Back to Discover <span>↗</span></Link></header>
      <section className="lm-stories-intro">
        <p className="lm-stories-eyebrow">A QUIETER CORNER OF LIFEMODE</p>
        <h1>Stay for<br/><em>one more story.</em></h1>
        <p className="lm-stories-lede">A collection of little worlds to step into. No feed to catch up on. No noise. Just a good story and a few quiet minutes.</p>
        <div className="lm-stories-intro-foot"><span>ORIGINAL FICTION</span><i/><span>MADE TO BE READ SLOWLY</span></div>
      </section>
      <section className="lm-stories-feature">
        <div className="lm-stories-feature-art"><span>01</span><i/><i/><b>☼</b><small>THE FIRST LIGHT</small></div>
        <div className="lm-stories-feature-copy"><p className="lm-stories-eyebrow">EDITOR'S PICK · {featured.category.toUpperCase()}</p><h2>{featured.title}</h2><p>{featured.excerpt}</p><div><span>{featured.time.toUpperCase()} READ</span><Link href={"/stories/"+featured.slug}>Read this story <b>↗</b></Link></div></div>
      </section>
      <section className="lm-stories-library">
        <div className="lm-stories-library-heading"><div><p className="lm-stories-eyebrow">THE COLLECTION</p><h2>Find your <em>next little world.</em></h2></div><span>{stories.length} STORIES</span></div>
        <label className="lm-stories-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a story, a feeling, a world…" aria-label="Search stories"/></label>
        <div className="lm-stories-filters" aria-label="Filter stories">{filters.map((item) => <button type="button" key={item} onClick={() => setFilter(item)} aria-pressed={filter===item} className={filter===item?"is-active":""}>{item}</button>)}</div>
        <div className="lm-stories-grid">{visible.map((story,index) => <Link href={"/stories/"+story.slug} key={story.slug} className={"lm-stories-card art-"+(index%4)}><div className="lm-stories-card-art"><span>{story.number}</span><b>{story.symbol}</b><i/><i/><small>{story.category.toUpperCase()}</small></div><div className="lm-stories-card-copy"><div><span>{story.category}</span><span>{story.time} read</span></div><h3>{story.title}</h3><p>{story.excerpt}</p><span className="lm-stories-read">STEP INTO THE STORY <b>↗</b></span></div></Link>)}</div>
        {visible.length===0?<div className="lm-stories-empty"><h3>No story found.</h3><p>Try another title or choose a different shelf.</p><button onClick={()=>{setQuery("");setFilter("All stories")}}>Show every story</button></div>:null}
      </section>
      <footer className="lm-stories-footer"><p>TAKE YOUR TIME.</p><h2>Somewhere else,<br/><em>for a little while.</em></h2><Link href="/discover">Return to your day ↗</Link></footer>
      <MobileNav/>
    </main>
  );
}
