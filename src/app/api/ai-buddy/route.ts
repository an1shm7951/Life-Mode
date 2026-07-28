import { NextRequest, NextResponse } from "next/server";
import {
  AiProviderUnavailableError,
  createAiBuddyReply,
} from "@/lib/lifemode/ai-buddy";
import type { AiBuddyRequest } from "@/lib/lifemode/types";
import { authenticateRequest } from "@/lib/supabase/server-auth";

const requestLog = new Map<string, number[]>();
const REQUEST_LIMIT = 20;
const REQUEST_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  const authentication = await authenticateRequest(request);

  if (!authentication) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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

  const body = (await request.json()) as Partial<AiBuddyRequest>;

  if (!body.mode || !body.goal?.trim()) {
    return NextResponse.json(
      { error: "mode and message are required." },
      { status: 400 },
    );
  }

  if (body.goal.length > 4000) {
    return NextResponse.json(
      { error: "Message is too long." },
      { status: 413 },
    );
  }

  try {
    const plan = await createAiBuddyReply({
      userId: authentication.user.id,
      mode: body.mode,
      goal: body.goal,
      mood: body.mood,
      history: body.history,
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
