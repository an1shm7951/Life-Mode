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
    <div className="lm-signature">
      <div className="lm-shell">
        <header className="lm-header">
          <div>
            <div className="lm-brand"><span className="lm-brand-mark">✧</span><span>LIFE<span>MODE</span></span></div>
            <div className="lm-greeting">Hi, {displayName || "there"} <span>✦</span></div>
          </div>
          <div className="lm-header-actions">
            <button type="button" className="lm-avatar" aria-label="Open profile" onClick={() => router.push("/profile")}>◉</button>
            <button type="button" className="lm-settings" onClick={() => router.push("/settings")}>⚙ <span>Settings</span></button>
          </div>
        </header>

        <div className="lm-quick-actions">
          <button type="button" onClick={beginFirstGoal}>ϟ <span>Quick Actions</span></button>
          <button type="button" onClick={() => router.push("/stats")}>▥ <span>Stats</span></button>
          <button type="button" onClick={() => router.push("/subscription")}>♛ <span>Premium</span></button>
          <button type="button" onClick={() => router.push("/planning")}>▦ <span>Calendar</span></button>
          <select aria-label="Choose your mode" value={state.activeMode} onChange={e => switchMode(e.target.value as LifeModeId)}>
            {modes.map(mode => <option key={mode.id} value={mode.id}>{mode.name}</option>)}
          </select>
        </div>

        <main className="lm-main">
          {dashboardView === "proof" ? (
            <section className="lm-goals-card lm-subpage">
              <div className="lm-goals-head"><h2><span>♧</span> Your Proof</h2><span className="lm-subtitle">Small wins, saved over time</span></div>
              <textarea value={proofInput} onChange={e=>setProofInput(e.target.value)} placeholder="What did you work on or accomplish?" rows={3} className="lm-proof-input"/>
              <div className="lm-proof-actions"><label className="lm-file-label">＋ Attach file<input type="file" accept="image/*,application/pdf" onChange={e=>setProofFile(e.target.files?.[0]??null)}/></label><button type="button" onClick={()=>void addProofPost()}>Save proof</button></div>
              {proofFile ? <p className="lm-status-message">Selected: {proofFile.name}</p> : null}
              <div className="lm-proof-list">{activeProofPosts.length ? activeProofPosts.map(post=><article className="lm-proof-item" key={post.id}><p>{post.text}</p><ProofAttachment post={post}/><button type="button" onClick={()=>void deleteProofPost(post.id)}>Remove</button></article>) : <p className="lm-empty">Your proof timeline will appear here as you save your progress.</p>}</div>
            </section>
          ) : dashboardView === "connections" ? (
            <section className="lm-goals-card lm-subpage">
              <div className="lm-goals-head"><h2><span>♙</span> Connections</h2></div>
              <p className="lm-subtitle">Choose the kinds of supportive, interest-based connections you are comfortable with.</p>
              <div className="lm-connection-grid">{connectionIntents.map(intent=><button type="button" key={intent.value} className={enabledIntents.includes(intent.value)?"is-enabled":""} onClick={()=>void toggleIntent(intent.value)}><span>{enabledIntents.includes(intent.value)?"✓":"＋"}</span>{intent.label}</button>)}</div>
              <p className="lm-status-message">{connectMessage || "Your preferences stay under your control. Connections are for shared interests, learning and collaboration."}</p>
            </section>
          ) : (
          <>
          <section className="lm-checkin">
            <div className="lm-section-top">
              <div><span className="lm-green-dot">✓</span><div><h2>Daily Check-In</h2><p>How are you feeling today?</p></div></div>
              <span className={checkinSaved ? "lm-status is-done" : "lm-status"}>{checkinSaved ? "✓ Completed" : "○ Not completed"}</span>
            </div>
            <div className="lm-checkin-body">
              <div className="lm-moods">
                {[
                  ["Happy","😃"],["Good","😌"],["Okay","😐"],["Low","😟"],["Excited","🤩"]
                ].map(([mood,emoji]) => <button type="button" key={mood} onClick={() => {setCheckinMood(mood);setCheckinSaved(false);}} className={checkinMood===mood?"is-selected":""}><span>{emoji}</span>{mood}</button>)}
              </div>
              <div className="lm-feeling-input">
                <input value={checkinNote} onChange={e=>{setCheckinNote(e.target.value);setCheckinSaved(false);}} placeholder="✎  Or tell us how you feel..." aria-label="How are you feeling?" maxLength={240}/>
                <button type="button" aria-label="Save check-in" onClick={saveDailyCheckin}>→</button>
              </div>
            </div>
            <div className="lm-checkin-foot"><span>“ A little progress, every day. ”</span><div><i style={{width:checkinSaved?"100%":"38%"}}/></div></div>
          </section>

          <section className="lm-spaces-section">
            <div className="lm-spaces-heading"><h2>Your LifeMode Spaces</h2><span>Explore your world ↗</span></div>
            <div className="lm-spaces">
              <Link href="/discover"><b>◈</b><span>Discover</span></Link>
              <Link href="/goals/daily"><b>◎</b><span>Goals</span></Link>
              <Link href="/planning"><b>▦</b><span>Plan</span></Link>
              <Link href="/discover"><b>▤</b><span>Stories</span></Link>
            </div>
          </section>

          <section className="lm-overview-grid">
            <article className="lm-progress-card">
              <h2><span>▥</span> Today’s Progress</h2>
              <div className="lm-progress-content">
                <div className="lm-progress-ring" style={{"--progress":dailyProgress+"%"} as React.CSSProperties}><strong>{dailyProgress}%</strong></div>
                <div><strong className="lm-progress-count">{completedGoals} / {modeGoals.length}</strong><span>Goals Done</span></div>
              </div>
              <div className="lm-progress-links"><Link href="/goals/daily">◎ Daily goals</Link><Link href="/goals/daily">✦ Long-term</Link></div>
            </article>
            <article className="lm-ai-card">
              <div className="lm-ai-heading"><h2>✧ AI Buddy</h2><span /></div>
              <div className="lm-ai-copy"><h3>Hey {displayName || "there"}! 👋</h3><p>Ready to plan your day, set new goals or think something through?</p></div>
              <div className="lm-ai-orb">✧</div>
              <Link href="/buddy" className="lm-ai-button">▢ &nbsp; Chat with AI</Link>
            </article>
          </section>

          <section className="lm-goals-card" id="goals">
            <div className="lm-goals-head"><h2><span>✓</span> Today’s goals</h2><Link href="/goals/daily">View all →</Link></div>
            {modeGoals.length ? modeGoals.slice(0,4).map(goal => (
              <div className="lm-goal-row" key={goal.id}>
                <button type="button" className={goal.done?"lm-goal-check done":"lm-goal-check"} aria-label={goal.done?"Mark incomplete":"Complete goal"} onClick={()=>toggleGoal(goal.id)}>{goal.done?"✓":""}</button>
                <span className={goal.done?"lm-goal-title done": "lm-goal-title"}>{goal.title}</span>
                <span className={goal.done?"lm-goal-tag done":"lm-goal-tag"}>{goal.done?"Done ✓":"Today"}</span>
                <button type="button" className="lm-goal-more" aria-label={"Delete "+goal.title} onClick={()=>deleteGoal(goal.id)}>×</button>
              </div>
            )) : <p className="lm-empty">Your next chapter starts with one small goal.</p>}
            <div className="lm-add-goal">
              <input ref={goalInputRef} value={goalInput} onChange={e=>setGoalInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void addGoal();}}} placeholder="Add a goal for today…" aria-label="New daily goal"/>
              <button type="button" onClick={()=>void addGoal()}>＋ Add Goal</button>
            </div>
            <div className="lm-goals-foot"><span>{completedGoals} of {modeGoals.length} completed</span><div><i style={{width:dailyProgress+"%"}}/></div><b>{dailyProgress}%</b></div>
          </section>

          <section className="lm-lower-grid">
            <article className="lm-mini-card"><span className="lm-card-kicker">YOUR NEXT STEP</span><h3>{nextGoal?.title ?? "Choose your first goal"}</h3><p>{nextGoal ? "Keep your focus on one meaningful action." : "Start with something small and achievable."}</p><button type="button" onClick={()=>nextGoal?toggleGoal(nextGoal.id):beginFirstGoal()}>{nextGoal?"Mark complete":"Create a goal"} →</button></article>
            <article className="lm-mini-card"><span className="lm-card-kicker">YOUR JOURNEY</span><h3>{shortTermGoals.length} short-term · {longTermGoals.length} long-term</h3><p>Keep daily actions connected to the bigger picture.</p><Link href="/goals/daily">Explore your goals →</Link></article>
          </section>
          <p className="lm-status-message" role="status">{statusMessage}</p>
          </>)}
        </main>
      </div>

      <MobileNav />
    </div>
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
