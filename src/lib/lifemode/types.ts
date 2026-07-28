export type LifeModeId =
  | "student"
  | "gym"
  | "career"
  | "business"
  | "law"
  | "creator";

export type ConnectionIntent =
  | "private"
  | "accountability"
  | "practice_partner"
  | "mentor"
  | "collaborator"
  | "professional_network"
  | "dating";

export type AgeBand = "under_18" | "adult";

export type OpportunityType =
  | "job"
  | "internship"
  | "freelance"
  | "scholarship"
  | "competition"
  | "startup_role";

export type RespectLockReason = "not_interested" | "block" | "report";

export type LifeMode = {
  id: LifeModeId;
  name: string;
  focus: string;
  tools: string[];
  allowedIntents: ConnectionIntent[];
};

export type UserProfile = {
  id: string;
  displayName: string;
  ageBand: AgeBand;
  activeMode: LifeModeId;
  interests: string[];
  skills: string[];
  proofScore: number;
  connectionIntents: ConnectionIntent[];
  vibeSignals: string[];
};

export type Opportunity = {
  id: string;
  type: OpportunityType;
  title: string;
  organization: string;
  location: string;
  mode: LifeModeId;
  tags: string[];
};

export type RespectLock = {
  id: string;
  actorUserId: string;
  targetUserId: string;
  reason: RespectLockReason;
  createdAt: string;
};

export type AiBuddyRequest = {
  userId: string;
  mode: LifeModeId;
  goal: string;
  mood?: string;
  history?: AiBuddyChatMessage[];
};

export type AiBuddyChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiBuddyResponse = {
  buddyMode: string;
  message: string;
  nextActions: string[];
};
