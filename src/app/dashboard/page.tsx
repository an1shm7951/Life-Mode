"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { MobileNav } from "@/components/mobile-nav";
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

export default function DashboardPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [userId, setUserId] = useState("");
  const [modes, setModes] = useState<LifeMode[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [state, setState] = useState<AppState>(defaultState);
  const [goalInput, setGoalInput] = useState("");
  const [proofInput, setProofInput] = useState("");
  const [buddyMessage, setBuddyMessage] = useState("");
  const [selectedIntent, setSelectedIntent] =
    useState<ConnectionIntent>("private");
  const [connectMessage, setConnectMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Saved to Supabase");
  const [isBuddyLoading, setIsBuddyLoading] = useState(false);

  const activeModeData = useMemo(
    () => modes.find((mode) => mode.id === state.activeMode),
    [state.activeMode, modes],
  );
  const modeGoals = state.goals.filter((goal) => goal.mode === state.activeMode);
  const completedGoals = modeGoals.filter((goal) => goal.done).length;
  const proofScore = Math.min(
    100,
    state.proofPosts.length * 12 + completedGoals * 8,
  );
  const savedOpportunityIds = state.opportunityActions
    .filter((action) => action.status === "saved")
    .map((action) => action.opportunity_id);
  const appliedOpportunityIds = state.opportunityActions
    .filter((action) => action.status === "applied")
    .map((action) => action.opportunity_id);
  const enabledIntents = state.connectionPreferences
    .filter((preference) => preference.mode === state.activeMode && preference.enabled)
    .map((preference) => preference.intent);
  const savedCount = opportunities.filter((opportunity) =>
    savedOpportunityIds.includes(opportunity.id),
  ).length;
  const activeProofPosts = state.proofPosts.filter(
    (post) => post.mode === state.activeMode,
  );
  const activeOpportunityActions = state.opportunityActions.filter((action) =>
    opportunities.some(
      (opportunity) =>
        opportunity.id === action.opportunity_id &&
        opportunity.mode === state.activeMode,
    ),
  );
  const nextGoal = modeGoals.find((goal) => !goal.done) ?? modeGoals[0];
  const latestProof = activeProofPosts[0];
  const appliedCount = activeOpportunityActions.filter(
    (action) => action.status === "applied",
  ).length;
  const modeProofScore = Math.min(
    100,
    activeProofPosts.length * 18 + completedGoals * 10 + appliedCount * 14,
  );
  const nextActionText = nextGoal
    ? nextGoal.done
      ? "Turn your finished goal into proof so it strengthens your profile."
      : nextGoal.title
    : "Add one clear goal to start today's Life Loop.";
  const readinessLabel =
    modeProofScore >= 70 ? "Ready to show" : modeProofScore >= 35 ? "Building" : "Needs proof";

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
    updateState({ activeMode: modeId });
    setConnectMessage("");

    if (userId) {
      setStatusMessage("Saving mode...");
      await updateProfile(userId, { active_mode: modeId });
      setStatusMessage("Saved to Supabase");
    }
  }

  async function addGoal() {
    const title = goalInput.trim();

    if (!title || !userId) {
      return;
    }

    setStatusMessage("Saving goal...");
    const goal = await createGoal(userId, state.activeMode, title);
    updateState({ goals: [...state.goals, goal] });
    setGoalInput("");
    setStatusMessage("Saved to Supabase");
  }

  async function toggleGoal(goalId: string) {
    const currentGoal = state.goals.find((goal) => goal.id === goalId);

    if (!currentGoal) {
      return;
    }

    setStatusMessage("Updating goal...");
    const updatedGoal = await updateGoalDone(goalId, !currentGoal.done);
    updateState({
      goals: state.goals.map((goal) =>
        goal.id === goalId ? updatedGoal : goal,
      ),
    });
    setStatusMessage("Saved to Supabase");
  }

  async function deleteGoal(goalId: string) {
    setStatusMessage("Deleting goal...");
    await deleteGoalRow(goalId);
    updateState({ goals: state.goals.filter((goal) => goal.id !== goalId) });
    setStatusMessage("Saved to Supabase");
  }

  async function clearCompletedGoals() {
    const completedGoalIds = state.goals
      .filter((goal) => goal.mode === state.activeMode && goal.done)
      .map((goal) => goal.id);

    if (!completedGoalIds.length) {
      return;
    }

    setStatusMessage("Clearing goals...");
    await Promise.all(completedGoalIds.map((goalId) => deleteGoalRow(goalId)));
    updateState({
      goals: state.goals.filter((goal) => !completedGoalIds.includes(goal.id)),
    });
    setStatusMessage("Saved to Supabase");
  }

  async function addProofPost() {
    const text = proofInput.trim();

    if (!text || !userId) {
      return;
    }

    setStatusMessage("Saving proof...");
    const proofPost = await createProofPost(userId, state.activeMode, text);
    updateState({
      proofPosts: [proofPost, ...state.proofPosts],
    });
    setProofInput("");
    setStatusMessage("Saved to Supabase");
  }

  async function turnGoalIntoProof(goal: GoalRow) {
    if (!userId) {
      return;
    }

    setStatusMessage("Creating proof...");
    const updatedGoals = goal.done
      ? state.goals
      : state.goals.map((item) =>
          item.id === goal.id ? { ...item, done: true } : item,
        );

    if (!goal.done) {
      await updateGoalDone(goal.id, true);
    }

    const proofPost = await createProofPost(
      userId,
      state.activeMode,
      `Completed: ${goal.title}`,
    );
    updateState({
      goals: updatedGoals,
      proofPosts: [proofPost, ...state.proofPosts],
    });
    setStatusMessage("Proof added");
  }

  async function deleteProofPost(postId: string) {
    setStatusMessage("Removing proof...");
    await deleteProofPostRow(postId);
    updateState({
      proofPosts: state.proofPosts.filter((post) => post.id !== postId),
    });
    setStatusMessage("Saved to Supabase");
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
    setStatusMessage("Saved to Supabase");
  }

  async function createGoalFromOpportunity(opportunity: Opportunity) {
    if (!userId) {
      return;
    }

    setStatusMessage("Creating opportunity goal...");
    const goal = await createGoal(
      userId,
      state.activeMode,
      `Prepare proof for ${opportunity.title}`,
    );
    updateState({ goals: [...state.goals, goal] });
    setStatusMessage("Goal created from opportunity");
  }

  async function toggleIntent(intent: ConnectionIntent) {
    if (!userId) {
      return;
    }

    const enabled = enabledIntents.includes(intent);
    setStatusMessage("Saving connection preference...");
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
    setStatusMessage("Saved to Supabase");
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
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] px-5 text-[#181713]">
        <div className="rounded-lg border border-[#d8d1c2] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">
            LifeMode
          </p>
          <p className="mt-3 text-2xl font-semibold">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f5f0] pb-24 text-[#181713] lg:pb-0">
      <header className="border-b border-[#d8d1c2]/70 bg-[#f8f7f1]/92 backdrop-blur lg:sticky lg:top-0 lg:z-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7b3f2a]"
              >
                LifeMode
              </Link>
              <span className="rounded-md border border-[#d8c49c] bg-[#fff3cf] px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7b4d10]">
                Early access
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">
              Welcome, {displayName}
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/profile" className="nav-button">
              Proof Profile
            </Link>
            <Link href="/opportunities" className="nav-button">
              Opportunities
            </Link>
            <Link href="/subscription" className="nav-button">
              Plus
            </Link>
            <select
              value={state.activeMode}
              onChange={(event) => switchMode(event.target.value as LifeModeId)}
              className="h-11 rounded-lg border border-[#c8beaa] bg-white px-3 text-sm font-semibold outline-none"
            >
              {modes.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.name}
                </option>
              ))}
            </select>
            <div className="flex h-11 items-center rounded-lg border border-[#c8beaa] bg-white px-3 text-sm font-semibold text-[#5f5a50]">
              {statusMessage}
            </div>
            <button
              onClick={logout}
              className="h-11 rounded-lg bg-[#181713] px-4 text-sm font-semibold text-white transition hover:bg-[#2a2821]"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-[#d8d1c2] bg-[#fff8e6]/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 text-sm leading-6 text-[#6a4a13] sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <p>
            Early-access rule: use LifeMode with non-sensitive test data while
            AI providers and safety systems are still being finalized.
          </p>
          <Link href="/profile" className="font-semibold text-[#181713]">
            Review your profile
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="premium-focus rounded-lg border border-[#2f352d] bg-[#151814] p-5 text-white sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d6c29d]">
                Life Loop
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal">
                {activeModeData?.name ?? "Your"} command center
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#ddd5c4]">
                Pick one goal, create proof, strengthen your profile, then use
                that proof to move toward opportunities.
              </p>
            </div>
            <div className="rounded-lg border border-[#5b554a] bg-[#25231d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#d6c29d]">
                Readiness
              </p>
              <p className="mt-2 text-3xl font-semibold">{modeProofScore}%</p>
              <p className="mt-1 text-sm text-[#ddd5c4]">{readinessLabel}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <LoopStep label="Next action" value={nextActionText} />
            <LoopStep
              label="Latest proof"
              value={latestProof?.text ?? "No proof in this mode yet."}
            />
            <LoopStep
              label="Opportunity motion"
              value={`${savedCount} saved, ${appliedCount} applied`}
            />
          </div>
        </div>

        <div className="premium-panel rounded-lg p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">
            Today&apos;s mission
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {nextGoal ? nextGoal.title : "Create one useful proof item"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#5f5a50]">
            LifeMode should make daily work visible. Finish one thing, save it
            as proof, and let that proof improve your profile.
          </p>
          {nextGoal ? (
            <button
              onClick={() => turnGoalIntoProof(nextGoal)}
              className="mt-5 h-11 w-full rounded-lg bg-[#181713] px-4 text-sm font-semibold text-white"
            >
              {nextGoal.done ? "Add proof from this goal" : "Finish and add proof"}
            </button>
          ) : (
            <button
              onClick={() => setGoalInput("Create one proof item today")}
              className="mt-5 h-11 w-full rounded-lg bg-[#181713] px-4 text-sm font-semibold text-white"
            >
              Prepare first goal
            </button>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-5">
        <Metric label="Mode" value={activeModeData?.name ?? "Mode"} />
        <Metric label="Goals done" value={`${completedGoals}/${modeGoals.length}`} />
        <Metric label="Proof posts" value={String(state.proofPosts.length)} />
        <Metric label="Proof score" value={`${proofScore}%`} />
        <Metric label="Saved roles" value={String(savedCount)} />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-6 sm:px-8 lg:grid-cols-[1fr_1fr]">
        <Panel title="Today's Goals" eyebrow="Plan">
          <div className="grid gap-3">
            {modeGoals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-3 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4"
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
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="rounded-md border border-[#dfd8c8] px-2 py-1 text-xs font-semibold text-[#7b3f2a]"
                >
                  Delete
                </button>
                <button
                  onClick={() => turnGoalIntoProof(goal)}
                  className="rounded-md bg-[#181713] px-2 py-1 text-xs font-semibold text-white"
                >
                  Proof
                </button>
              </div>
            ))}
            {!modeGoals.length ? (
              <p className="rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4 text-sm text-[#5f5a50]">
                No goals in this mode yet. Add one and make the day real.
              </p>
            ) : null}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={goalInput}
              onChange={(event) => setGoalInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addGoal();
                }
              }}
              placeholder="Add a goal for this mode"
              className="h-12 flex-1 rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-4 outline-none focus:border-[#7b3f2a]"
            />
            <button
              onClick={addGoal}
              className="h-12 rounded-lg bg-[#181713] px-5 text-sm font-semibold text-white"
            >
              Add goal
            </button>
          </div>
          <button
            onClick={clearCompletedGoals}
            className="mt-3 h-10 rounded-lg border border-[#c8beaa] bg-white px-4 text-sm font-semibold text-[#181713]"
          >
            Clear completed
          </button>
        </Panel>

        <Panel title="Mode Overview" eyebrow="Current data">
          <p className="text-sm leading-6 text-[#5f5a50]">
            {activeModeData?.focus}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="Goals" value={String(modeGoals.length)} />
            <Metric label="Proof" value={String(activeProofPosts.length)} />
            <Metric label="Applied" value={String(appliedCount)} />
          </div>
        </Panel>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Proof Timeline" eyebrow="Evidence">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={proofInput}
              onChange={(event) => setProofInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addProofPost();
                }
              }}
              placeholder="What did you prove today?"
              className="h-12 flex-1 rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-4 outline-none focus:border-[#7b3f2a]"
            />
            <button
              onClick={addProofPost}
              className="h-12 rounded-lg bg-[#181713] px-5 text-sm font-semibold text-white"
            >
              Add proof
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            {state.proofPosts.length ? (
              state.proofPosts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7b3f2a]">
                      {post.mode}
                    </span>
                    <span className="text-sm text-[#696257]">
                      {formatDateTime(post.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-6">
                    {post.text}
                  </p>
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

        <Panel title="Connect + Safety" eyebrow="Preferences">
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
              Check
            </button>
          </div>
          <p className="mt-4 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4 text-sm leading-6 text-[#5f5a50]">
            {connectMessage ||
              "Choose a connection type to check the mode's safety rule."}
          </p>
        </Panel>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 sm:px-8 lg:grid-cols-2">
        <Panel title="Opportunities" eyebrow="Discovery">
          <div className="grid gap-3">
            {opportunities.map((opportunity) => {
              const saved = savedOpportunityIds.includes(opportunity.id);
              const applied = appliedOpportunityIds.includes(opportunity.id);

              return (
                <article
                  key={opportunity.id}
                  className="rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7b3f2a]">
                    {opportunity.type.replace("_", " ")}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">
                    {opportunity.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#5f5a50]">
                    {opportunity.organization} - {opportunity.location}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {opportunity.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-[#dfd8c8] bg-white px-2 py-1 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => toggleOpportunity(opportunity.id, "saved")}
                      className={`h-10 rounded-lg px-4 text-sm font-semibold ${
                        saved
                          ? "bg-[#e7f0dd] text-[#315b36]"
                          : "border border-[#c8beaa] bg-white text-[#181713]"
                      }`}
                    >
                      {saved ? "Saved" : "Save"}
                    </button>
                    <button
                      onClick={() => toggleOpportunity(opportunity.id, "applied")}
                      className={`h-10 rounded-lg px-4 text-sm font-semibold ${
                        applied
                          ? "bg-[#181713] text-white"
                          : "border border-[#c8beaa] bg-white text-[#181713]"
                      }`}
                    >
                      {applied ? "Applied" : "Mark applied"}
                    </button>
                    <button
                      onClick={() => createGoalFromOpportunity(opportunity)}
                      className="h-10 rounded-lg border border-[#c8beaa] bg-white px-4 text-sm font-semibold text-[#181713]"
                    >
                      Add goal
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel title="AI Buddy" eyebrow="Conversation">
          <p className="mb-3 rounded-lg border border-[#d8c49c] bg-[#fff8e6] p-3 text-sm leading-6 text-[#6a4a13]">
            Beta note: AI Buddy is for planning and testing right now. Do not
            enter passwords, private documents, medical details, or sensitive
            personal information.
          </p>
          <div className="rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-3">
            <textarea
              value={buddyMessage}
              onChange={(event) => setBuddyMessage(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                  createBuddyPlan();
                }
              }}
              placeholder="Talk to your AI Buddy. Ask anything, explain what happened, or plan your next move."
              rows={4}
              className="min-h-28 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-[#8f8778]"
            />
            <button
              onClick={createBuddyPlan}
              disabled={isBuddyLoading || !buddyMessage.trim()}
              className="mt-3 h-11 w-full rounded-lg bg-[#181713] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#8f8778]"
            >
              {isBuddyLoading ? "Thinking..." : "Send to AI Buddy"}
            </button>
          </div>
          <div className="mt-4 flex max-h-[520px] flex-col-reverse gap-4 overflow-y-auto pr-1">
            {state.buddyHistory.length ? (
              state.buddyHistory.map((plan) => (
                <article key={plan.id} className="grid gap-3">
                  <div className="ml-auto max-w-[86%] rounded-lg bg-[#181713] px-4 py-3 text-white">
                    <p className="text-sm leading-6">{plan.prompt}</p>
                    <span className="mt-2 block text-right text-xs text-[#d8d1c2]">
                      {formatDateTime(plan.created_at)}
                    </span>
                  </div>
                  <div className="mr-auto max-w-[92%] rounded-lg border border-[#dfd8c8] bg-white px-4 py-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7b3f2a]">
                        {plan.buddy_mode}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-[#5f5a50]">
                      {plan.message}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4 text-sm text-[#5f5a50]">
                Start a private conversation with AI Buddy. It can help you
                plan, reflect, practice, or get unstuck in the mode you are
                using.
              </p>
            )}
          </div>
        </Panel>
      </section>
      <MobileNav />
    </main>
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
    <section className="premium-panel rounded-lg p-4 sm:p-5">
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

function LoopStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#4b5547] bg-[#202820] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#d6c29d]">
        {label}
      </p>
      <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-[#f5f1e8]">
        {value}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-surface rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#696257]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[#181713]">{value}</p>
    </div>
  );
}
