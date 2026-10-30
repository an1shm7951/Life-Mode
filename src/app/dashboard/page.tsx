"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { MobileNav } from "@/components/mobile-nav";
import { AmbientScene } from "@/components/ambient-scene";
import type { AiBuddyResponse, ConnectionIntent, LifeMode, LifeModeId, Opportunity } from "@/lib/lifemode/types";
import {
  createAiBuddyHistory,
  createGoal,
  createProofPost,
  deleteGoal as deleteGoalRow,
  deleteProofPost as deleteProofPostRow,
  ensureProfile,
  fetchAiBuddyHistory,
  fetchConnectionPreferences,
  fetchGoals,
  fetchOpportunities,
  fetchOpportunityActions,
  fetchProofPosts,
  updateGoalDone,
  updateProfile,
  upsertConnectionPreference,
  upsertOpportunityAction,
  type AiBuddyHistoryRow,
  type ConnectionPreferenceRow,
  type GoalRow,
  type OpportunityActionRow,
  type ProofPostRow,
} from "@/lib/lifemode/database";

type AppState = {
  activeMode: LifeModeId;
  goals: GoalRow[];
  proofPosts: ProofPostRow[];
  opportunityActions: OpportunityActionRow[];
  connectionPreferences: ConnectionPreferenceRow[];
  buddyHistory: AiBuddyHistoryRow[];
};

type DashboardView = "today" | "proof" | "connections";

const dashboardViews: { id: DashboardView; label: string; description: string }[] = [
  { id: "today", label: "Today", description: "Choose a small goal and make a little progress." },
  { id: "proof", label: "Proof", description: "Save what you have done and choose who may connect with you." },
  { id: "connections", label: "Connections", description: "Choose how you want to connect with people on LifeMode." },
];

const defaultState: AppState = {
  activeMode: "student",
  goals: [],
  proofPosts: [],
  opportunityActions: [],
  connectionPreferences: [],
  buddyHistory: [],
};

const connectionIntents: { label: string; value: ConnectionIntent }[] = [
  { label: "Private", value: "private" },
  { label: "Accountability", value: "accountability" },
  { label: "Practice partner", value: "practice_partner" },
  { label: "Mentor", value: "mentor" },
  { label: "Collaborator", value: "collaborator" },
  { label: "Professional network", value: "professional_network" },
  { label: "Dating", value: "dating" },
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [userId, setUserId] = useState("");
  const [modes, setModes] = useState<LifeMode[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [state, setState] = useState<AppState>(defaultState);
  const [goalInput, setGoalInput] = useState("");
  const goalInputRef = useRef<HTMLInputElement>(null);
  const [celebratingGoalId, setCelebratingGoalId] = useState<string | null>(null);
  const [proofInput, setProofInput] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofingGoalId, setProofingGoalId] = useState<string | null>(null);
  const [goalProofInput, setGoalProofInput] = useState("");
  const [goalProofFile, setGoalProofFile] = useState<File | null>(null);
  const [isSavingGoalProof, setIsSavingGoalProof] = useState(false);
  const [buddyMessage, setBuddyMessage] = useState("");
  const [selectedIntent, setSelectedIntent] =
    useState<ConnectionIntent>("private");
  const [connectMessage, setConnectMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Ready when you are");
  const [isBuddyLoading, setIsBuddyLoading] = useState(false);
  const [dashboardView, setDashboardView] = useState<DashboardView>("today");
  const [checkinMood, setCheckinMood] = useState("");
  const [checkinNote, setCheckinNote] = useState("");
  const [checkinSaved, setCheckinSaved] = useState(false);
  const [checkinDate, setCheckinDate] = useState("");

  useEffect(() => {
    if (!userId) return;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setCheckinDate(today);
    try {
      const saved = localStorage.getItem(`lifemode-checkin-${userId}-${today}`);
      if (!saved) {
        setCheckinMood("");
        setCheckinNote("");
        setCheckinSaved(false);
        return;
      }
      const parsed = JSON.parse(saved) as { mood?: string; note?: string };
      setCheckinMood(parsed.mood ?? "");
      setCheckinNote(parsed.note ?? "");
      setCheckinSaved(true);
    } catch {
      setCheckinSaved(false);
    }
  }, [userId]);

  function saveDailyCheckin() {
    if (!userId || !checkinDate || !checkinMood) return;
    try {
      localStorage.setItem(`lifemode-checkin-${userId}-${checkinDate}`, JSON.stringify({
        mood: checkinMood,
        note: checkinNote.trim().slice(0, 240),
      }));
      setCheckinSaved(true);
    } catch {
      setCheckinSaved(false);
    }
  }

  useEffect(() => {
    const view = searchParams.get("view");
    setDashboardView(view === "proof" || view === "connections" ? view : "today");
  }, [searchParams]);

  const activeModeData = useMemo(
    () => modes.find((mode) => mode.id === state.activeMode),
    [state.activeMode, modes],
  );
  const modeGoals = state.goals.filter((goal) => goal.mode === state.activeMode && goal.goal_type === "daily");
  const shortTermGoals = state.goals.filter((goal) => goal.mode === state.activeMode && goal.goal_type === "short_term");
  const longTermGoals = state.goals.filter((goal) => goal.mode === state.activeMode && goal.goal_type === "long_term");
  const completedGoals = modeGoals.filter((goal) => goal.done).length;
  const dailyProgress = modeGoals.length
    ? Math.round((completedGoals / modeGoals.length) * 100)
    : 0;
  const savedOpportunityIds = state.opportunityActions
    .filter((action) => action.status === "saved")
    .map((action) => action.opportunity_id);
  const appliedOpportunityIds = state.opportunityActions
    .filter((action) => action.status === "applied")
    .map((action) => action.opportunity_id);
  const enabledIntents = state.connectionPreferences
    .filter((preference) => preference.mode === state.activeMode && preference.enabled)
    .map((preference) => preference.intent);
  const activeProofPosts = state.proofPosts.filter(
    (post) => post.mode === state.activeMode,
  );
  const nextGoal = modeGoals.find((goal) => !goal.done) ?? modeGoals[0];

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const metadata = user.user_metadata;
      const hasAgeAccess =
        metadata?.age_band === "adult" ||
        metadata?.age_band === "under_18" ||
        (Number.isFinite(Number(metadata?.age)) && Number(metadata?.age) >= 13);
      const hasStartingMode = typeof metadata?.first_mode === "string";

      if (!hasAgeAccess || !hasStartingMode) {
        router.push("/onboarding");
        return;
      }

      const firstName = metadata?.first_name;
      const name =
        typeof firstName === "string" && firstName.trim()
          ? firstName
          : user.email?.split("@")[0] ?? "LifeMode user";
      setDisplayName(name);
      setUserId(user.id);

      const configResponse = await fetch("/api/app-config");
      const config = (await configResponse.json()) as { modes: LifeMode[] };
      setModes(config.modes);

      const userMode = metadata?.first_mode;
      const matchedMode =
        typeof userMode === "string"
          ? config.modes.find((mode) => mode.name === userMode)
          : undefined;
      const profile = await ensureProfile({
        userId: user.id,
        displayName: name,
        activeMode: matchedMode?.id ?? "student",
        ageBand:
          metadata?.age_band === "under_18" ||
          Number(metadata?.age) < 18
            ? "under_18"
            : "adult",
      });
      const [
        goals,
        proofPosts,
        opportunityActions,
        connectionPreferences,
        buddyHistory,
      ] = await Promise.all([
        fetchGoals(user.id),
        fetchProofPosts(user.id),
        fetchOpportunityActions(user.id),
        fetchConnectionPreferences(user.id),
        fetchAiBuddyHistory(user.id),
      ]);

      setState((current) => ({
        ...current,
        activeMode: profile.active_mode,
        goals,
        proofPosts,
        opportunityActions,
        connectionPreferences,
        buddyHistory,
      }));

      setIsLoading(false);
    }

    loadDashboard();
  }, [router]);

  useEffect(() => {
    async function loadOpportunities() {
      const data = await fetchOpportunities(state.activeMode);
      setOpportunities(data);
    }

    loadOpportunities();
  }, [state.activeMode]);

  function updateState(update: Partial<AppState>) {
    setState((current) => ({ ...current, ...update }));
  }

  async function switchMode(modeId: LifeModeId) {
    const previousMode = state.activeMode;
    updateState({ activeMode: modeId });
    setProofingGoalId(null);
    setGoalProofInput("");
    setConnectMessage("");

    if (userId) {
      setStatusMessage("Saving mode...");
      try {
        await updateProfile(userId, { active_mode: modeId });
        setStatusMessage("Mode saved");
      } catch (error) {
        updateState({ activeMode: previousMode });
        setStatusMessage(`Could not save mode: ${errorMessage(error)}`);
      }
    }
  }

  async function addGoal() {
    const title = goalInput.trim();

    if (!title || !userId) {
      return;
    }

    setStatusMessage("Saving goal...");
    try {
      const goal = await createGoal(userId, state.activeMode, title);
      updateState({ goals: [...state.goals, goal] });
      setGoalInput("");
      setStatusMessage("Goal saved");
    } catch (error) {
      setStatusMessage(`Could not save goal: ${errorMessage(error)}`);
    }
  }

  function beginFirstGoal() {
    setGoalInput("");
    requestAnimationFrame(() => {
      goalInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      goalInputRef.current?.focus({ preventScroll: true });
    });
  }

  async function toggleGoal(goalId: string) {
    const currentGoal = state.goals.find((goal) => goal.id === goalId);

    if (!currentGoal) {
      return;
    }

    setStatusMessage("Updating goal...");
    try {
      const updatedGoal = await updateGoalDone(goalId, !currentGoal.done);
      updateState({
        goals: state.goals.map((goal) =>
          goal.id === goalId ? updatedGoal : goal,
        ),
      });
      if (updatedGoal.done && !currentGoal.done) {
        celebrateGoalCompletion(goalId);
      } else if (!updatedGoal.done) {
        setCelebratingGoalId((current) =>
          current === goalId ? null : current,
        );
      }
      setStatusMessage("Goal updated");
    } catch (error) {
      setStatusMessage(`Could not update goal: ${errorMessage(error)}`);
    }
  }

  function celebrateGoalCompletion(goalId: string) {
    setCelebratingGoalId(goalId);
    window.setTimeout(() => {
      setCelebratingGoalId((current) =>
        current === goalId ? null : current,
      );
    }, 1550);
  }

  async function deleteGoal(goalId: string) {
    setStatusMessage("Deleting goal...");
    try {
      await deleteGoalRow(goalId);
      updateState({ goals: state.goals.filter((goal) => goal.id !== goalId) });
      if (proofingGoalId === goalId) {
        setProofingGoalId(null);
        setGoalProofInput("");
      }
      setStatusMessage("Goal deleted");
    } catch (error) {
      setStatusMessage(`Could not delete goal: ${errorMessage(error)}`);
    }
  }

  async function clearCompletedGoals() {
    const completedGoalIds = state.goals
      .filter((goal) => goal.mode === state.activeMode && goal.done)
      .map((goal) => goal.id);

    if (!completedGoalIds.length) {
      return;
    }

    setStatusMessage("Clearing goals...");
    try {
      await Promise.all(completedGoalIds.map((goalId) => deleteGoalRow(goalId)));
      updateState({
        goals: state.goals.filter((goal) => !completedGoalIds.includes(goal.id)),
      });
      setStatusMessage("Completed goals cleared");
    } catch (error) {
      setStatusMessage(`Could not clear completed goals: ${errorMessage(error)}`);
    }
  }

  async function addProofPost() {
    const text = proofInput.trim();

    if ((!text && !proofFile) || !userId) {
      return;
    }

    setStatusMessage("Saving proof...");
    try {
      const proofPost = await createProofPost(
        userId,
        state.activeMode,
        text || `File: ${proofFile?.name}`,
        proofFile ?? undefined,
      );
      updateState({
        proofPosts: [proofPost, ...state.proofPosts],
      });
      setProofInput("");
      setProofFile(null);
      setStatusMessage("Proof saved");
    } catch (error) {
      setStatusMessage(`Could not save proof: ${errorMessage(error)}`);
    }
  }

  function startGoalProof(goal: GoalRow) {
    setProofingGoalId(goal.id);
    setGoalProofInput("");
    setStatusMessage("");
  }

  async function saveGoalProof(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const goal = state.goals.find((item) => item.id === proofingGoalId);
    const evidence = goalProofInput.trim();

    if (!userId || !goal || (!evidence && !goalProofFile) || isSavingGoalProof) {
      return;
    }

    setIsSavingGoalProof(true);
    setStatusMessage("Saving proof...");
    try {
      const proofPost = await createProofPost(
        userId,
        goal.mode,
        `Goal: ${goal.title}${evidence ? `\nEvidence: ${evidence}` : ""}${goalProofFile ? `\nAttachment: ${goalProofFile.name}` : ""}`,
        goalProofFile ?? undefined,
      );
      updateState({ proofPosts: [proofPost, ...state.proofPosts] });
      setProofingGoalId(null);
      setGoalProofInput("");
      setGoalProofFile(null);

      if (goal.done) {
        setStatusMessage("Proof saved to your timeline");
        return;
      }

      try {
        const updatedGoal = await updateGoalDone(goal.id, true);
        updateState({
          goals: state.goals.map((item) =>
            item.id === goal.id ? updatedGoal : item,
          ),
        });
        celebrateGoalCompletion(goal.id);
        setStatusMessage("Proof saved and goal completed");
      } catch (error) {
        setStatusMessage(
          `Proof saved, but the goal could not be marked complete: ${errorMessage(error)}`,
        );
      }
    } catch (error) {
      setStatusMessage(`Could not save proof: ${errorMessage(error)}`);
    } finally {
      setIsSavingGoalProof(false);
    }
  }

  async function deleteProofPost(postId: string) {
    setStatusMessage("Removing proof...");
    try {
      const attachmentRemoved = await deleteProofPostRow(postId);
      updateState({
        proofPosts: state.proofPosts.filter((post) => post.id !== postId),
      });
      setStatusMessage(
        attachmentRemoved
          ? "Proof removed"
          : "Proof removed, but its attachment could not be deleted from storage",
      );
    } catch (error) {
      setStatusMessage(`Could not remove proof: ${errorMessage(error)}`);
    }
  }

  async function toggleOpportunity(id: string, key: "saved" | "applied") {
    if (!userId) {
      return;
    }

    const existing = state.opportunityActions.find(
      (action) => action.opportunity_id === id,
    );
    const status = key === "saved" ? "saved" : "applied";

    setStatusMessage("Saving opportunity...");
    try {
      const action = await upsertOpportunityAction({
        userId,
        opportunityId: id,
        status,
        notes: existing?.notes ?? "",
        deadline: existing?.deadline ?? null,
        followUp: existing?.follow_up ?? null,
      });
      updateState({
        opportunityActions: [
          ...state.opportunityActions.filter((item) => item.opportunity_id !== id),
          action,
        ],
      });
      setStatusMessage("Opportunity saved");
    } catch (error) {
      setStatusMessage(`Could not save opportunity: ${errorMessage(error)}`);
    }
  }

  async function createGoalFromOpportunity(opportunity: Opportunity) {
    if (!userId) {
      return;
    }

    setStatusMessage("Creating opportunity goal...");
    try {
      const goal = await createGoal(
        userId,
        state.activeMode,
        `Prepare proof for ${opportunity.title}`,
      );
      updateState({ goals: [...state.goals, goal] });
      setStatusMessage("Goal created from opportunity");
    } catch (error) {
      setStatusMessage(`Could not create goal: ${errorMessage(error)}`);
    }
  }

  async function toggleIntent(intent: ConnectionIntent) {
    if (!userId) {
      return;
    }

    const enabled = enabledIntents.includes(intent);
    setStatusMessage("Saving connection preference...");
    try {
      const preference = await upsertConnectionPreference({
        userId,
        mode: state.activeMode,
        intent,
        enabled: !enabled,
      });
      updateState({
        connectionPreferences: [
          ...state.connectionPreferences.filter(
            (item) =>
              !(item.mode === state.activeMode && item.intent === intent),
          ),
          preference,
        ],
      });
      setStatusMessage("Connection preference saved");
    } catch (error) {
      setStatusMessage(`Could not save connection preference: ${errorMessage(error)}`);
    }
  }

  async function createBuddyPlan() {
    const message = buddyMessage.trim();

    if (!userId || !message) {
      return;
    }

    setIsBuddyLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/ai-buddy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: state.activeMode,
          goal: message,
          history: state.buddyHistory
            .slice(0, 6)
            .reverse()
            .flatMap((item) => [
              { role: "user", content: item.prompt },
              { role: "assistant", content: item.message },
            ]),
        }),
      });
      const data = (await response.json()) as {
        plan?: AiBuddyResponse;
        error?: string;
      };

      if (!response.ok || !data.plan) {
        setStatusMessage(data.error ?? "AI Buddy is temporarily unavailable.");
        return;
      }

      const historyItem = await createAiBuddyHistory({
        userId,
        mode: state.activeMode,
        prompt: message,
        plan: data.plan,
      });
      updateState({
        buddyHistory: [historyItem, ...state.buddyHistory],
      });
      setBuddyMessage("");
    } finally {
      setIsBuddyLoading(false);
    }
  }

  async function checkConnectionIntent() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push("/login");
      return;
    }

    const response = await fetch(
      `/api/connect/can-use?mode=${state.activeMode}&intent=${selectedIntent}`,
      { headers: { Authorization: `Bearer ${session.access_token}` } },
    );
    const data = (await response.json()) as {
      allowed?: boolean;
      reason?: string;
      error?: string;
    };

    setConnectMessage(data.reason ?? data.error ?? "Could not check intent.");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (isLoading) {
    return (
      <main className="dashboard-loading dashboard-shell flex min-h-screen items-center justify-center px-5 text-[#181713]">
        <div className="dashboard-loading-panel premium-panel rounded-[28px] p-8">
          <span className="dashboard-loader" aria-hidden="true" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#7b3f2a]">LifeMode</p>
          <p className="mt-2 text-2xl font-semibold">Bringing your world into focus...</p>
        </div>
      </main>
    );
  }

  return (
      <main className="dashboard-shell min-h-screen bg-[#f3f5f0] pb-24 text-[#181713] lg:pb-0">
      <AmbientScene />
      <header className="dashboard-header border-b border-[#d8d1c2]/70 bg-[#f8f7f1]/92 backdrop-blur lg:sticky lg:top-0 lg:z-20">
        <div className="dashboard-header-inner mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="dashboard-brand text-sm font-semibold uppercase tracking-[0.18em] text-[#7b3f2a]"
              >
                <span className="dashboard-brand-mark" aria-hidden="true">L</span> LifeMode<span className="dashboard-brand-period">.</span>
              </Link>
              <span className="dashboard-badge rounded-md border border-[#d8c49c] bg-[#fff3cf] px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7b4d10]">
                Early access
              </span>
            </div>
            <h1 className="dashboard-welcome mt-2 text-3xl font-semibold tracking-normal">
              Hi, {displayName}
            </h1>
          </div>
          <div className="dashboard-actions flex flex-col gap-3 sm:flex-row">
            <Link href="/profile" className="nav-button">
              Profile
            </Link>

            <Link href="/subscription" className="nav-button">Plus</Link>

            <select
              aria-label="Choose your mode"
              value={state.activeMode}
              onChange={(event) => switchMode(event.target.value as LifeModeId)}
              className="dashboard-mode-select h-11 rounded-lg border border-[#c8beaa] bg-white px-3 text-sm font-semibold outline-none"
            >
              {modes.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.name}
                </option>
              ))}
            </select>
            <div className="dashboard-sync flex h-11 items-center rounded-lg border border-[#c8beaa] bg-white px-3 text-sm font-semibold text-[#5f5a50]" role="status" aria-live="polite">
              <span className="dashboard-sync-dot" aria-hidden="true" />
              {statusMessage}
            </div>
            <button
              onClick={logout}
              className="dashboard-logout h-11 rounded-lg bg-[#181713] px-4 text-sm font-semibold text-white transition hover:bg-[#2a2821]"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="dashboard-notice border-b border-[#d8d1c2] bg-[#fff8e6]/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 text-sm leading-6 text-[#6a4a13] sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <p>
            LifeMode is still in preview. Please use test data and avoid adding
            private or sensitive details.
          </p>
          <Link href="/profile" className="font-semibold text-[#181713]">
            Review your profile
          </Link>
        </div>
      </section>

      <section aria-label="Explore LifeMode" className="lifemode-launchpad mx-auto grid max-w-7xl grid-cols-1 gap-3 px-5 pt-5 sm:grid-cols-2 sm:px-8 sm:pt-7 xl:grid-cols-4">
        <Link href="/discover" className="lifemode-launch-card discover-card group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-2xl border border-[#2f352d] bg-[#151814] p-5 text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7b3f2a] sm:min-h-48 sm:p-6">
          <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[#d6c29d]"><span>01 · Explore</span><span aria-hidden="true" className="text-xl">✳</span></span>
          <span><span className="block text-2xl font-semibold sm:text-3xl">Discover</span><span className="mt-2 block max-w-xs text-sm leading-5 text-[#ddd5c4]">Fresh ideas, technology, science, and stories worth thinking about.</span></span>
          <span className="mt-4 text-sm font-semibold text-[#f1d7a5]">Explore stories <span aria-hidden="true">→</span></span>
        </Link>
        <Link href="/dashboard#goals" className="lifemode-launch-card goals-card group flex min-h-40 flex-col justify-between rounded-2xl border border-[#d8c49c] bg-[#fff8e8] p-5 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7b3f2a] sm:min-h-48 sm:p-6">
          <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]"><span>02 · Build</span><span aria-hidden="true" className="text-xl">↗</span></span>
          <span><span className="block text-2xl font-semibold text-[#25221d] sm:text-3xl">Goals</span><span className="mt-2 block max-w-xs text-sm leading-5 text-[#5f5a50]">Turn what matters to you into small, doable steps.</span></span>
          <span className="mt-4 text-sm font-semibold text-[#7b3f2a]">Work on your goals <span aria-hidden="true">→</span></span>
        </Link>
        <Link href="/planning" className="lifemode-launch-card plan-card group flex min-h-40 flex-col justify-between rounded-2xl border border-[#d8d1c2] bg-white p-5 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7b3f2a] sm:min-h-48 sm:p-6">
          <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[#315260]"><span>03 · Organize</span><span aria-hidden="true" className="text-xl">◷</span></span>
          <span><span className="block text-2xl font-semibold text-[#25221d] sm:text-3xl">Plan</span><span className="mt-2 block max-w-xs text-sm leading-5 text-[#5f5a50]">Shape your day around routines, time, and priorities.</span></span>
          <span className="mt-4 text-sm font-semibold text-[#315260]">Open your plan <span aria-hidden="true">→</span></span>
        </Link>
        <Link href="/buddy" className="lifemode-launch-card group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-2xl border border-[#65704f] bg-[linear-gradient(145deg,#243323,#121a13)] p-5 text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8bd7b] sm:min-h-48 sm:p-6">
          <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[#e2c783]"><span>04 · Assist</span><span aria-hidden="true" className="text-xl">✧</span></span>
          <span><span className="block text-2xl font-semibold sm:text-3xl">AI Buddy</span><span className="mt-2 block max-w-xs text-sm leading-5 text-[#d6dfd0]">Your personal companion for goals, planning and timely reminders.</span></span>
          <span className="mt-4 text-sm font-semibold text-[#e2c783]">Meet your companion <span aria-hidden="true">→</span></span>
        </Link>
      </section>

      <section className="dashboard-overview mx-auto grid max-w-7xl gap-5 px-5 py-8 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="dashboard-command premium-focus rounded-lg border border-[#2f352d] bg-[#151814] p-5 text-white sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="dashboard-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-[#d6c29d]">
                <span className="dashboard-eyebrow-pulse" /> {activeModeData?.name ?? "YOUR MODE"}
              </p>
              <h2 className="dashboard-command-title mt-2 text-3xl font-semibold tracking-normal">
                A little progress goes a long way.
              </h2>
              <p className="dashboard-description mt-3 max-w-2xl text-sm leading-6 text-[#ddd5c4]">
                Choose one small goal. When you finish, save what you did as proof.
              </p>
            </div>
            <div className="dashboard-momentum daily-momentum rounded-lg border border-[#5b554a] bg-[#25231d] p-4">
              <div className="flex items-center gap-4">
                <ProgressRing progress={dailyProgress} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#d6c29d]">
                    Today&apos;s progress
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {modeGoals.length ? `${completedGoals} of ${modeGoals.length} goals` : "Start small"}
                  </p>
                  <p className="mt-1 text-sm text-[#ddd5c4]">
                    {modeGoals.length
                      ? completedGoals === modeGoals.length
                        ? "All done for today!"
                        : completedGoals
                          ? "Nice start. Keep going!"
                          : "One small step at a time."
                      : "One goal is enough to begin."}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#ddd5c4]">Proof saved</span>
                  <span className="font-semibold text-white">
                    {activeProofPosts.length} {activeProofPosts.length === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <figure className="dashboard-inspiration-quote">
            <span aria-hidden="true">“</span>
            <blockquote>Sometimes you gotta run before you can walk.</blockquote>
            <figcaption>Tony Stark <i /> Iron Man</figcaption>
          </figure>
        </div>

        <div className="dashboard-mission premium-panel rounded-lg p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">
            Today&apos;s focus
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {nextGoal ? nextGoal.title : "Choose your first goal"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#5f5a50]">
            One small step is enough. Add a note, photo, or file to show what you did.
          </p>
          {nextGoal ? (
            <button
              onClick={() => startGoalProof(nextGoal)}
              disabled={isSavingGoalProof || proofingGoalId !== null}
              className="mt-5 h-11 w-full rounded-lg bg-[#181713] px-4 text-sm font-semibold text-white"
            >
              {nextGoal.done ? "Add proof" : "Finish & add proof"}
            </button>
          ) : (
            <button
              onClick={beginFirstGoal}
              className="mt-5 h-11 w-full rounded-lg bg-[#181713] px-4 text-sm font-semibold text-white"
            >
              Add your first goal
            </button>
          )}
        </div>
      </section>

      <section className="dashboard-workspace-nav mx-auto max-w-7xl px-5 pt-2 sm:px-8" aria-label="Dashboard workspace">
        <div className="dashboard-view-switcher" role="group" aria-label="Choose a dashboard view">
          {dashboardViews.map((view) => (
            <button
              key={view.id}
              type="button"
              className={"dashboard-view-button " + (dashboardView === view.id ? "is-active" : "")}
              aria-pressed={dashboardView === view.id}
              onClick={() => setDashboardView(view.id)}
            >
              <span>{view.label}</span>
            </button>
          ))}
        </div>
        <div className="dashboard-view-heading" aria-live="polite">
          <div>
            <p className="dashboard-view-kicker">YOUR LIFE, MADE SIMPLE</p>
            <h2>{dashboardViews.find((view) => view.id === dashboardView)?.label}</h2>
          </div>
          <p>{dashboardViews.find((view) => view.id === dashboardView)?.description}</p>
        </div>
      </section>

      {dashboardView === "today" ? (
      <div className="dashboard-view-stage" key={dashboardView}>
      <section className="dashboard-content-grid mx-auto grid max-w-3xl gap-5 px-5 pb-12 sm:px-8">
        <Panel title="A moment for you" eyebrow="Daily check-in">
          <p className="mb-4 text-sm leading-6 text-[#5f5a50]">You don't have to be productive every minute. Take a second to notice how you're feeling.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              { value: "great", label: "Great", emoji: "☀️" },
              { value: "good", label: "Good", emoji: "🙂" },
              { value: "okay", label: "Okay", emoji: "😐" },
              { value: "low", label: "Low", emoji: "🌧️" },
              { value: "stressed", label: "Stressed", emoji: "🌊" },
            ].map((mood) => (
              <button key={mood.value} type="button" onClick={() => { setCheckinMood(mood.value); setCheckinSaved(false); }} aria-pressed={checkinMood === mood.value}
                className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-sm transition ${checkinMood === mood.value ? "border-[#315260] bg-[#e8eeeb] font-semibold text-[#203f42]" : "border-[#dfd8c8] bg-[#fffdf8] hover:border-[#a99e89]"}`}>
                <span className="text-xl" aria-hidden="true">{mood.emoji}</span>{mood.label}
              </button>
            ))}
          </div>
          <label className="mt-4 grid gap-2 text-sm font-semibold text-[#25221d]">
            What would make today a little better? <span className="font-normal text-[#77756d]">(optional)</span>
            <textarea value={checkinNote} onChange={(event) => { setCheckinNote(event.target.value.slice(0, 240)); setCheckinSaved(false); }}
              placeholder="A little rest, finishing one task, talking to someone…" rows={2} maxLength={240}
              className="w-full rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-3 py-2 font-normal outline-none focus:border-[#315260]" />
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={saveDailyCheckin} disabled={!checkinMood} className="h-10 rounded-lg bg-[#181713] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {checkinSaved ? "Check-in saved" : "Save check-in"}
            </button>
            {checkinSaved ? <p role="status" className="text-sm text-[#315260]">Thanks for checking in with yourself. Take today one step at a time.</p> : null}
          </div>
          <p className="mt-3 text-xs leading-5 text-[#77756d]">Your check-in stays in this browser on this device for now. It isn't shared on your profile.</p>
        </Panel>

        <div id="goals" className="scroll-mt-24">
        <Panel title="Today's goals" eyebrow="Your plan">
          <p className="dashboard-goal-guidance mb-4 text-sm leading-6 text-[#5f5a50]">Keep it simple: choose one thing you can finish today.</p>
          <div className="grid gap-3">
            {modeGoals.map((goal) => (
              <div
                key={goal.id}
                className={`goal-row glass-card flex items-center gap-3 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4 ${goal.done ? "is-complete" : ""} ${celebratingGoalId === goal.id ? "completion-burst" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={goal.done}
                  onChange={() => toggleGoal(goal.id)}
                  className="h-4 w-4 accent-[#181713]"
                />
                <span
                  className={`min-w-0 flex-1 text-sm font-semibold ${
                    goal.done ? "text-[#8f8778] line-through" : ""
                  }`}
                >
                  {goal.title}
                </span>
                {goal.done ? (
                  <span
                    className={`goal-complete-mark ${celebratingGoalId === goal.id ? "is-celebrating" : ""}`}
                    aria-label="Goal completed"
                    title="Goal completed"
                  >
                    ✓
                  </span>
                ) : null}
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="rounded-md border border-[#dfd8c8] px-2 py-1 text-xs font-semibold text-[#7b3f2a]"
                >
                  Delete
                </button>
                <button
                  onClick={() => startGoalProof(goal)}
                  disabled={isSavingGoalProof || proofingGoalId !== null}
                  className="rounded-md bg-[#181713] px-2 py-1 text-xs font-semibold text-white"
                >
                  Add proof
                </button>
              </div>
            ))}
            {proofingGoalId ? (
              <form
                onSubmit={saveGoalProof}
                className="glass-card grid gap-3 rounded-lg border border-[#c8beaa] bg-[#f7f5ef] p-4"
              >
                <label className="grid gap-2 text-sm font-semibold text-[#25221d]">
                  Proof for: {state.goals.find((goal) => goal.id === proofingGoalId)?.title}
                  <textarea
                    value={goalProofInput}
                    onChange={(event) => setGoalProofInput(event.target.value)}
                    placeholder="What did you do? Add a result or detail if helpful."
                    maxLength={4000}
                    rows={4}
                    autoFocus
                    className="w-full rounded-lg border border-[#c8beaa] bg-white px-4 py-3 font-normal outline-none focus:border-[#315260]"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[#25221d]">
                  Add an image or file (optional)
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={(event) => setGoalProofFile(event.currentTarget.files?.[0] ?? null)}
                    className="w-full rounded-lg border border-[#c8beaa] bg-white px-3 py-2 text-sm font-normal"
                  />
                  <span className="text-xs font-normal text-[#696257]">Images, PDF, text, CSV, Word, Excel, or PowerPoint. Maximum 10 MB.</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={isSavingGoalProof || (!goalProofInput.trim() && !goalProofFile)}
                    className="h-10 rounded-lg bg-[#181713] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingGoalProof ? "Saving proof..." : "Save proof"}
                  </button>
                  <button
                    type="button"
                    disabled={isSavingGoalProof}
                    onClick={() => {
                      setProofingGoalId(null);
                      setGoalProofInput("");
                      setGoalProofFile(null);
                    }}
                    className="h-10 rounded-lg border border-[#c8beaa] bg-white px-4 text-sm font-semibold text-[#181713] disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
            {!modeGoals.length ? (
              <p className="rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4 text-sm text-[#5f5a50]">
                No goals yet. Add one small thing you would like to get done today.
              </p>
            ) : null}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              ref={goalInputRef}
              value={goalInput}
              onChange={(event) => setGoalInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addGoal();
                }
              }}
              placeholder="What would you like to do today?"
              className="h-12 flex-1 rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-4 outline-none focus:border-[#7b3f2a]"
            />
            <button
              onClick={addGoal}
              className="h-12 rounded-lg bg-[#181713] px-5 text-sm font-semibold text-white"
            >
              Add goal
            </button>
          </div>
                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-[#dfd8c8] bg-white/70 p-4">
              <h3 className="text-lg font-semibold">Short-term goals</h3><p className="mt-2 text-sm text-[#5f5a50]">Goals for the next few days or weeks.</p>
              <div className="mt-3 grid gap-2">{shortTermGoals.map(goal => <div key={goal.id} className="flex items-center gap-2 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-3"><input type="checkbox" checked={goal.done} onChange={() => toggleGoal(goal.id)} aria-label={`Complete ${goal.title}`} className="h-4 w-4"/><span className={goal.done ? "min-w-0 flex-1 text-sm line-through" : "min-w-0 flex-1 text-sm"}>{goal.title}</span><button onClick={() => deleteGoal(goal.id)} className="text-xs text-[#7b3f2a]">Delete</button></div>)}{!shortTermGoals.length && <p className="text-sm text-[#77756d]">No short-term goals yet.</p>}</div>
              <Link href="/goals/short-term" className="mt-3 inline-flex text-sm font-semibold text-[#315260]">Add a short-term goal ↗</Link>
            </section>
            <section className="rounded-xl border border-[#dfd8c8] bg-white/70 p-4">
              <h3 className="text-lg font-semibold">Long-term goals</h3><p className="mt-2 text-sm text-[#5f5a50]">Goals you are building toward over months or years.</p>
              <div className="mt-3 grid gap-2">{longTermGoals.map(goal => <div key={goal.id} className="flex items-center gap-2 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-3"><input type="checkbox" checked={goal.done} onChange={() => toggleGoal(goal.id)} aria-label={`Complete ${goal.title}`} className="h-4 w-4"/><span className={goal.done ? "min-w-0 flex-1 text-sm line-through" : "min-w-0 flex-1 text-sm"}>{goal.title}</span><button onClick={() => deleteGoal(goal.id)} className="text-xs text-[#7b3f2a]">Delete</button></div>)}{!longTermGoals.length && <p className="text-sm text-[#77756d]">No long-term goals yet.</p>}</div>
              <Link href="/goals/long-term" className="mt-3 inline-flex text-sm font-semibold text-[#315260]">Add a long-term goal ↗</Link>
            </section>
          </div>
<button
            onClick={clearCompletedGoals}
            className="mt-3 h-10 rounded-lg border border-[#c8beaa] bg-white px-4 text-sm font-semibold text-[#181713]"
          >
            Clear finished goals
          </button>
        </Panel>
        </div>

              

      </section>
      </div>
      ) : null}

      {dashboardView === "proof" ? (
      <div className="dashboard-view-stage" key={dashboardView}>
      <section className="dashboard-content-grid mx-auto grid max-w-7xl gap-5 px-5 pb-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Your proof" eyebrow="Things you have done">
          <p className="mb-4 text-sm leading-6 text-[#5f5a50]">Add a short note about what you did. Attach a photo or file if it helps.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={proofInput}
              onChange={(event) => setProofInput(event.target.value)}
              placeholder="What did you work on or finish?"
              className="h-12 flex-1 rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-4 outline-none focus:border-[#7b3f2a]"
            />
            <button
              onClick={addProofPost}
              disabled={!proofInput.trim() && !proofFile}
              className="h-12 rounded-lg bg-[#181713] px-5 text-sm font-semibold text-white"
            >
              Add proof
            </button>
          </div>
          <div className="mt-3">
            <label className="grid gap-2 text-sm font-semibold text-[#25221d]">
              Attach an image or file (optional)
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                onChange={(event) => setProofFile(event.currentTarget.files?.[0] ?? null)}
                className="w-full rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-3 py-2 text-sm font-normal"
              />
              <span className="text-xs font-normal text-[#696257]">Images, PDF, text, CSV, Word, Excel, or PowerPoint. Maximum 10 MB.</span>
            </label>
          </div>
          <div className="mt-4 grid gap-3">
            {state.proofPosts.length ? (
              state.proofPosts.map((post) => (
                <article
                  key={post.id}
                  className="glass-card rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7b3f2a]">
                      {post.mode}
                    </span>
                    <span className="text-sm text-[#696257]">
                      {formatDateTime(post.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6">
                    {post.text}
                  </p>
                  <ProofAttachment post={post} />
                  <button
                    onClick={() => deleteProofPost(post.id)}
                    className="mt-3 rounded-md border border-[#dfd8c8] px-2 py-1 text-xs font-semibold text-[#7b3f2a]"
                  >
                    Remove
                  </button>
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4 text-sm text-[#5f5a50]">
                No proof yet. Add one small win to start your timeline.
              </p>
            )}
          </div>
        </Panel>


      </section>
      </div>
      ) : null}

      {dashboardView === "connections" ? (
        <div className="dashboard-view-stage" key={dashboardView}>
          <section className="dashboard-content-grid mx-auto grid max-w-3xl gap-5 px-5 pb-12 sm:px-8">
                    <Panel title="Your connections" eyebrow="Your privacy">
          <p className="mb-4 text-sm leading-6 text-[#5f5a50]">Choose the kinds of connections you may be open to. Keep it private if you prefer.</p>
          <p className="mb-4 rounded-xl border border-[#d8d1c2] bg-white/70 p-3 text-sm leading-6 text-[#5f5a50]">Dating is an adults-only feature (18+). College email alone does not prove age. This preview does not yet provide dating matches or chat; those need separate age assurance, mutual consent, and block/report safeguards before launch.</p>
          <div className="grid gap-3">
            {connectionIntents.map((intent) => (
              <label
                key={intent.value}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-3"
              >
                <span className="text-sm font-semibold">{intent.label}</span>
                <input
                  type="checkbox"
                  checked={enabledIntents.includes(intent.value)}
                  onChange={() => toggleIntent(intent.value)}
                  className="h-4 w-4 accent-[#181713]"
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedIntent}
              onChange={(event) =>
                setSelectedIntent(event.target.value as ConnectionIntent)
              }
              className="h-12 flex-1 rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-4 text-sm font-semibold outline-none focus:border-[#7b3f2a]"
            >
              {connectionIntents.map((intent) => (
                <option key={intent.value} value={intent.value}>
                  {intent.label}
                </option>
              ))}
            </select>
            <button
              onClick={checkConnectionIntent}
              className="h-12 rounded-lg bg-[#181713] px-5 text-sm font-semibold text-white"
            >
              Check safety
            </button>
          </div>
          <p className="mt-4 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4 text-sm leading-6 text-[#5f5a50]">
            {connectMessage ||
              "Choose a connection type to check the mode's safety rule."}
          </p>
        </Panel>
          </section>
        </div>
      ) : null}
      <MobileNav />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f7f4ec] px-5 py-10 text-[#5f5a50]">Loading LifeMode…</main>}>
      <DashboardContent />
    </Suspense>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProofAttachment({ post }: { post: ProofPostRow }) {
  if (!post.media_path) {
    return null;
  }

  if (!post.media_url) {
    return <p className="mt-3 text-sm text-[#7b3f2a]">Attachment link unavailable. Refresh the page to try again.</p>;
  }

  const mediaType = post.media_type ?? "";
  const canPreview = mediaType.startsWith("image/") &&
    !["image/heic", "image/heif"].includes(mediaType);

  return (
    <div className="mt-3 grid gap-2">
      {canPreview ? (
        <a href={post.media_url} target="_blank" rel="noreferrer" aria-label={`Open ${post.media_name ?? "evidence image"}`}>
          <img
            src={post.media_url}
            alt={post.media_name ?? "Proof evidence"}
            className="max-h-80 max-w-full rounded-lg border border-[#dfd8c8] object-contain"
          />
        </a>
      ) : null}
      <a
        href={post.media_url}
        target="_blank"
        rel="noreferrer"
        download={post.media_name ?? true}
        className="w-fit text-sm font-semibold text-[#315260] underline"
      >
        Open or download {post.media_name ?? "attachment"}
      </a>
    </div>
  );
}

function errorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Please try again.";
}

function Panel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dashboard-panel premium-panel rounded-lg p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#181713]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <div
      className={`progress-ring ${progress === 100 ? "is-complete" : ""}`}
      role="img"
      aria-label={`${progress}% of today's goals complete`}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="progress-ring-track" cx="32" cy="32" r={radius} />
        <circle
          className="progress-ring-value"
          cx="32"
          cy="32"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span>{progress}%</span>
    </div>
  );
}
