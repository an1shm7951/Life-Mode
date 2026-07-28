import { NextRequest, NextResponse } from "next/server";
import { canUseConnectionIntent } from "@/lib/lifemode/safety";
import type { ConnectionIntent, LifeModeId, UserProfile } from "@/lib/lifemode/types";
import { authenticateRequest } from "@/lib/supabase/server-auth";

export async function GET(request: NextRequest) {
  const authentication = await authenticateRequest(request);

  if (!authentication) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const mode = request.nextUrl.searchParams.get("mode") as LifeModeId | null;
  const intent = request.nextUrl.searchParams.get(
    "intent",
  ) as ConnectionIntent | null;
  if (!mode || !intent) {
    return NextResponse.json(
      { error: "Valid mode and intent are required." },
      { status: 400 },
    );
  }

  const { data: profile, error } = await authentication.client
    .from("profiles")
    .select("display_name, age_band, active_mode, skills")
    .eq("user_id", authentication.user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json(
      { error: "Complete your profile before using connections." },
      { status: 409 },
    );
  }

  const user: UserProfile = {
    id: authentication.user.id,
    displayName: profile.display_name,
    ageBand: profile.age_band,
    activeMode: profile.active_mode,
    interests: [],
    skills: profile.skills,
    proofScore: 0,
    connectionIntents: [],
    vibeSignals: [],
  };

  return NextResponse.json(canUseConnectionIntent(user, mode, intent));
}
