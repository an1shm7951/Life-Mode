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
  media_path: string | null;
  media_name: string | null;
  media_type: string | null;
  media_url: string | null;
  visibility: "private" | "profile" | "public";
  created_at: string;
};

type ProofPostDatabaseRow = Omit<ProofPostRow, "media_url">;

const PROOF_EVIDENCE_BUCKET = "proof-evidence";
const MAX_PROOF_EVIDENCE_SIZE = 10 * 1024 * 1024;
const PROOF_EVIDENCE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const PROOF_EVIDENCE_MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
  txt: "text/plain",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
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
    .select(
      "id, user_id, mode, text, media_path, media_name, media_type, visibility, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<ProofPostDatabaseRow[]>();

  if (error) {
    throw error;
  }

  return Promise.all(data.map(addSignedEvidenceUrl));
}

export async function createProofPost(
  userId: string,
  mode: LifeModeId,
  text: string,
  file?: File,
) {
  let evidence: { path: string; name: string; type: string } | null = null;

  if (file) {
    if (file.size > MAX_PROOF_EVIDENCE_SIZE) {
      throw new Error("Evidence files must be 10 MB or smaller.");
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const contentType = PROOF_EVIDENCE_MIME_TYPES.has(file.type)
      ? file.type
      : PROOF_EVIDENCE_MIME_BY_EXTENSION[extension];

    if (!contentType || !PROOF_EVIDENCE_MIME_TYPES.has(contentType)) {
      throw new Error("Choose an image, PDF, text, CSV, Word, Excel, or PowerPoint file.");
    }

    const safeName = file.name
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(-120);
    const path = `${userId}/${crypto.randomUUID()}/${safeName || "evidence"}`;
    const { error: uploadError } = await supabase.storage
      .from(PROOF_EVIDENCE_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        contentType,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    evidence = { path, name: file.name, type: contentType };
  }

  const { data, error } = await supabase
    .from("proof_posts")
    .insert({
      user_id: userId,
      mode,
      text,
      media_path: evidence?.path ?? null,
      media_name: evidence?.name ?? null,
      media_type: evidence?.type ?? null,
    })
    .select(
      "id, user_id, mode, text, media_path, media_name, media_type, visibility, created_at",
    )
    .single<ProofPostDatabaseRow>();

  if (error) {
    if (evidence) {
      await supabase.storage.from(PROOF_EVIDENCE_BUCKET).remove([evidence.path]);
    }
    throw error;
  }

  return addSignedEvidenceUrl(data);
}

export async function deleteProofPost(postId: string) {
  const { data: post, error: readError } = await supabase
    .from("proof_posts")
    .select("media_path")
    .eq("id", postId)
    .single<{ media_path: string | null }>();

  if (readError) {
    throw readError;
  }

  const { error: deleteError } = await supabase
    .from("proof_posts")
    .delete()
    .eq("id", postId);

  if (deleteError) {
    throw deleteError;
  }

  if (post.media_path) {
    const { error: storageError } = await supabase.storage
      .from(PROOF_EVIDENCE_BUCKET)
      .remove([post.media_path]);
    return !storageError;
  }

  return true;
}

async function addSignedEvidenceUrl(post: ProofPostDatabaseRow): Promise<ProofPostRow> {
  if (!post.media_path) {
    return { ...post, media_url: null };
  }

  const { data, error } = await supabase.storage
    .from(PROOF_EVIDENCE_BUCKET)
    .createSignedUrl(post.media_path, 60 * 60);

  return { ...post, media_url: error ? null : data.signedUrl };
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
