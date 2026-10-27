import { NextRequest, NextResponse } from "next/server";
import {
  AiProviderUnavailableError,
  createAiBuddyReply,
} from "@/lib/lifemode/ai-buddy";
import type { AiBuddyRequest } from "@/lib/lifemode/types";
import { authenticateRequest } from "@/lib/supabase/server-auth";
import { lifeModes } from "@/lib/lifemode/data";

const requestLog = new Map<string, number[]>();
const REQUEST_LIMIT = 20;
const REQUEST_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  const authentication = await authenticateRequest(request);

  if (!authentication) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    const parsedBody: unknown = await request.json();
    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      return NextResponse.json({ error: "A valid message is required." }, { status: 400 });
    }
    body = parsedBody as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const mode = body.mode;
  const goal = body.goal;

  if (
    typeof mode !== "string" ||
    !lifeModes.some((lifeMode) => lifeMode.id === mode) ||
    typeof goal !== "string" ||
    !goal.trim()
  ) {
    return NextResponse.json(
      { error: "A valid mode and message are required." },
      { status: 400 },
    );
  }

  if (goal.length > 4000) {
    return NextResponse.json(
      { error: "Message is too long." },
      { status: 413 },
    );
  }

  const rawHistory = body.history;
  const history = Array.isArray(rawHistory)
    ? rawHistory
        .filter(
          (item): item is { role: "user" | "assistant"; content: string } =>
            !!item &&
            typeof item === "object" &&
            "role" in item &&
            (item.role === "user" || item.role === "assistant") &&
            "content" in item &&
            typeof item.content === "string",
        )
        .slice(-10)
        .map((item) => ({ ...item, content: item.content.slice(0, 4000) }))
    : [];

  const now = Date.now();
  const recentRequests = (requestLog.get(authentication.user.id) ?? []).filter(
    (timestamp) => now - timestamp < REQUEST_WINDOW_MS,
  );

  if (recentRequests.length >= REQUEST_LIMIT) {
    return NextResponse.json(
      { error: "AI Buddy is taking a short breather. Try again in a minute." },
      { status: 429 },
    );
  }

  requestLog.set(authentication.user.id, [...recentRequests, now]);

  const { data: savedGoals, error: goalsError } = await authentication.client
    .from("goals")
    .select("mode, title, done, due_date")
    .eq("user_id", authentication.user.id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (goalsError) {
    return NextResponse.json(
      { error: "AI Buddy could not load your saved goals. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const plan = await createAiBuddyReply({
      userId: authentication.user.id,
      mode: mode as AiBuddyRequest["mode"],
      goal,
      mood: typeof body.mood === "string" ? body.mood.slice(0, 100) : undefined,
      history,
      savedGoals: savedGoals ?? [],
    });

    return NextResponse.json(
      { plan },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof AiProviderUnavailableError) {
      return NextResponse.json(
        { error: "AI Buddy cannot reach its model right now. Try again shortly." },
        { status: 503 },
      );
    }

    throw error;
  }
}
