import { NextResponse } from "next/server";

export const revalidate = 900;

type HackerNewsItem = {
  id: number;
  type?: string;
  title?: string;
  url?: string;
  by?: string;
  score?: number;
  time?: number;
  descendants?: number;
  kids?: number[];
  text?: string;
  deleted?: boolean;
  dead?: boolean;
};

function plainText(value: string | undefined): string {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x([\da-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number: string) => String.fromCodePoint(Number(number)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2400);
}

async function getItem(id: number): Promise<HackerNewsItem | null> {
  const response = await fetch(\`https://hacker-news.firebaseio.com/v0/item/\${id}.json\`, {
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(5000),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  return (await response.json()) as HackerNewsItem | null;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  if (!/^\d{1,12}$/.test(rawId)) {
    return NextResponse.json({ error: "Invalid story ID." }, { status: 400 });
  }

  try {
    const story = await getItem(Number(rawId));
    if (!story || story.type !== "story" || !story.title || story.deleted || story.dead) {
      return NextResponse.json({ error: "This story is no longer available." }, { status: 404 });
    }

    const commentIds = (story.kids ?? []).slice(0, 12);
    const comments = (await Promise.all(commentIds.map(async (commentId) => {
      try {
        const comment = await getItem(commentId);
        if (!comment || comment.type !== "comment" || comment.deleted || comment.dead) return null;
        const text = plainText(comment.text);
        if (!text) return null;
        return {
          id: comment.id,
          by: comment.by ?? "Community member",
          time: comment.time ?? 0,
          text,
        };
      } catch {
        return null;
      }
    }))).filter((comment): comment is NonNullable<typeof comment> => Boolean(comment));

    return NextResponse.json({
      story: {
        id: story.id,
        title: story.title,
        url: story.url && /^https?:\/\//i.test(story.url) ? story.url : null,
        by: story.by ?? "Hacker News community",
        score: story.score ?? 0,
        commentsCount: story.descendants ?? 0,
        time: story.time ?? 0,
      },
      comments,
      updatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({ error: "Could not load this story right now." }, { status: 503 });
  }
}
