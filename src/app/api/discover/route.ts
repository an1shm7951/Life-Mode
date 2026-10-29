import { NextResponse } from "next/server";

export const revalidate = 900;

type HackerNewsItem = {
  id: number;
  title?: string;
  url?: string;
  by?: string;
  score?: number;
  time?: number;
  descendants?: number;
  type?: string;
};

type StoryCategory = "AI & Tech" | "Science" | "Ideas";

function categoryFor(title: string): StoryCategory {
  const value = title.toLowerCase();
  if (/science|space|nasa|biology|physics|climate|planet|research|discovery|health|nature|quantum|robot/.test(value)) {
    return "Science";
  }
  if (/ai|machine learning|llm|software|programming|developer|open source|chip|computer|startup|security|internet|robotics|coding|github|database|browser|app/.test(value)) {
    return "AI & Tech";
  }
  return "Ideas";
}

const unsuitableTitle = /\b(porn|xxx|explicit sexual|nsfw|onlyfans|casino|sportsbook|betting|gambling)\b/i;

export async function GET() {
  try {
    const response = await fetch("https://hacker-news.firebaseio.com/v0/beststories.json", {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(7000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error("The public story feed is temporarily unavailable.");
    }

    const ids = (await response.json()) as number[];
    const candidates = await Promise.all(
      ids.slice(0, 30).map(async (id) => {
        try {
          const itemResponse = await fetch(
            `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
            { next: { revalidate: 900 }, signal: AbortSignal.timeout(5000) },
          );
          if (!itemResponse.ok) return null;
          return (await itemResponse.json()) as HackerNewsItem | null;
        } catch {
          return null;
        }
      }),
    );

    const stories = candidates
      .filter((item): item is HackerNewsItem => Boolean(
        item &&
        item.type === "story" &&
        item.title &&
        item.url &&
        /^https?:\/\//i.test(item.url) &&
        !item.deleted &&
        !item.dead &&
        !unsuitableTitle.test(item.title),
      ))
      .slice(0, 16)
      .map((item) => ({
        id: item.id,
        title: item.title!,
        url: item.url!,
        by: item.by ?? "Hacker News community",
        score: item.score ?? 0,
        comments: item.descendants ?? 0,
        time: item.time ?? 0,
        category: categoryFor(item.title!),
        source: "Hacker News",
        discussionUrl: `https://news.ycombinator.com/item?id=${item.id}`,
      }));

    return NextResponse.json(
      { stories, updatedAt: new Date().toISOString(), source: "Hacker News public API" },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
    );
  } catch {
    return NextResponse.json(
      { stories: [], updatedAt: new Date().toISOString(), error: "The live feed is taking a break. Try again shortly." },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  }
}
