import { supabase } from "@/lib/supabase/client";
import type {
  AiBuddyResponse,
  ConnectionIntent,
  LifeModeId,
  Opportunity,
  OpportunityType,
} from "./types";

export type GoalRow = {
  id: string;
  user_id: string;
  mode: LifeModeId;
  title: string;
  done: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ProofPostRow = {
  id: string;
  user_id: string;
  mode: LifeModeId;
  text: string;
  media_url: string | null;
  visibility: "private" | "profile" | "public";
  created_at: string;
};

export type OpportunityRow = Opportunity & {
  source: string;
  verified: boolean;
  apply_url: string | null;
  created_at: string;
};

export type OpportunityActionRow = {
  id: string;
  user_id: string;
  opportunity_id: string;
  status: "saved" | "applied" | "interview" | "rejected" | "won";
  notes: string;
  deadline: string | null;
  follow_up: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  id: string;
  user_id: string;
  display_name: string;
  age_band: "under_18" | "adult";
  active_mode: LifeModeId;
  bio: string;
  skills: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type ConnectionPreferenceRow = {
  id: string;
  user_id: string;
  mode: LifeModeId;
  intent: ConnectionIntent;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type AiBuddyHistoryRow = {
  id: string;
  user_id: string;
  mode: LifeModeId;
  buddy_mode: string;
  prompt: string;
  mood: string | null;
  message: string;
  next_actions: string[];
  created_at: string;
};

export async function ensureProfile({
  userId,
  displayName,
  activeMode,
  ageBand,
}: {
  userId: string;
  displayName: string;
  activeMode: LifeModeId;
  ageBand: ProfileRow["age_band"];
}) {
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<ProfileRow>();

  if (readError) {
    throw readError;
  }

  if (existing) {
    if (existing.age_band === ageBand) {
      return existing;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ age_band: ageBand })
      .eq("user_id", userId)
      .select("*")
      .single<ProfileRow>();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      display_name: displayName,
      active_mode: activeMode,
      age_band: ageBand,
    })
    .select("*")
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  update: Partial<Pick<ProfileRow, "bio" | "skills" | "is_public" | "active_mode">>,
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("user_id", userId)
    .select("*")
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchGoals(userId: string) {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .returns<GoalRow[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function createGoal(userId: string, mode: LifeModeId, title: string) {
  const { data, error } = await supabase
    .from("goals")
    .insert({ user_id: userId, mode, title })
    .select("*")
    .single<GoalRow>();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateGoalDone(goalId: string, done: boolean) {
  const { data, error } = await supabase
    .from("goals")
    .update({ done })
    .eq("id", goalId)
    .select("*")
    .single<GoalRow>();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteGoal(goalId: string) {
  const { error } = await supabase.from("goals").delete().eq("id", goalId);

  if (error) {
    throw error;
  }
}

export async function fetchProofPosts(userId: string) {
  const { data, error } = await supabase
    .from("proof_posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<ProofPostRow[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function createProofPost(
  userId: string,
  mode: LifeModeId,
  text: string,
) {
  const { data, error } = await supabase
    .from("proof_posts")
    .insert({ user_id: userId, mode, text })
    .select("*")
    .single<ProofPostRow>();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteProofPost(postId: string) {
  const { error } = await supabase.from("proof_posts").delete().eq("id", postId);

  if (error) {
    throw error;
  }
}

export async function fetchOpportunities(mode?: LifeModeId) {
  let query = supabase
    .from("opportunities")
    .select("*")
    .neq("source", "seed")
    .order("created_at", { ascending: false });

  if (mode) {
    query = query.eq("mode", mode);
  }

  const { data, error } = await query.returns<OpportunityRow[]>();

  if (error) {
    throw error;
  }

  return data.map((item) => ({
    ...item,
    type: item.type as OpportunityType,
    mode: item.mode as LifeModeId,
  }));
}

export async function fetchOpportunityActions(userId: string) {
  const { data, error } = await supabase
    .from("opportunity_actions")
    .select("*")
    .eq("user_id", userId)
    .returns<OpportunityActionRow[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertOpportunityAction({
  userId,
  opportunityId,
  status,
  notes = "",
  deadline = null,
  followUp = null,
}: {
  userId: string;
  opportunityId: string;
  status: OpportunityActionRow["status"];
  notes?: string;
  deadline?: string | null;
  followUp?: string | null;
}) {
  const { data, error } = await supabase
    .from("opportunity_actions")
    .upsert(
      {
        user_id: userId,
        opportunity_id: opportunityId,
        status,
        notes,
        deadline,
        follow_up: followUp,
      },
      { onConflict: "user_id,opportunity_id" },
    )
    .select("*")
    .single<OpportunityActionRow>();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteOpportunityAction(actionId: string) {
  const { error } = await supabase
    .from("opportunity_actions")
    .delete()
    .eq("id", actionId);

  if (error) {
    throw error;
  }
}

export async function fetchConnectionPreferences(userId: string) {
  const { data, error } = await supabase
    .from("connection_preferences")
    .select("*")
    .eq("user_id", userId)
    .returns<ConnectionPreferenceRow[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertConnectionPreference({
  userId,
  mode,
  intent,
  enabled,
}: {
  userId: string;
  mode: LifeModeId;
  intent: ConnectionIntent;
  enabled: boolean;
}) {
  const { data, error } = await supabase
    .from("connection_preferences")
    .upsert(
      {
        user_id: userId,
        mode,
        intent,
        enabled,
      },
      { onConflict: "user_id,mode,intent" },
    )
    .select("*")
    .single<ConnectionPreferenceRow>();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchAiBuddyHistory(userId: string) {
  const { data, error } = await supabase
    .from("ai_buddy_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<AiBuddyHistoryRow[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function createAiBuddyHistory({
  userId,
  mode,
  prompt,
  mood,
  plan,
}: {
  userId: string;
  mode: LifeModeId;
  prompt: string;
  mood?: string;
  plan: AiBuddyResponse;
}) {
  const { data, error } = await supabase
    .from("ai_buddy_history")
    .insert({
      user_id: userId,
      mode,
      buddy_mode: plan.buddyMode,
      prompt,
      mood: mood || null,
      message: plan.message,
      next_actions: plan.nextActions,
    })
    .select("*")
    .single<AiBuddyHistoryRow>();

  if (error) {
    throw error;
  }

  return data;
}
