"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { MobileNav } from "@/components/mobile-nav";
import type { LifeMode, LifeModeId, Opportunity } from "@/lib/lifemode/types";
import {
  deleteOpportunityAction,
  fetchOpportunities,
  fetchOpportunityActions,
  upsertOpportunityAction,
  type OpportunityActionRow,
} from "@/lib/lifemode/database";

type TrackerItem = {
  status: "saved" | "applied" | "interview" | "rejected" | "won";
  notes: string;
  deadline: string;
  followUp: string;
};

type TrackerState = Record<string, OpportunityActionRow>;
type DraftState = Record<string, TrackerItem>;

function trackerItemFromAction(action?: OpportunityActionRow): TrackerItem {
  return action
    ? {
        status: action.status,
        notes: action.notes,
        deadline: action.deadline ?? "",
        followUp: action.follow_up ?? "",
      }
    : defaultTrackerItem;
}

const defaultTrackerItem: TrackerItem = {
  status: "saved",
  notes: "",
  deadline: "",
  followUp: "",
};

export default function OpportunitiesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [modes, setModes] = useState<LifeMode[]>([]);
  const [activeMode, setActiveMode] = useState<LifeModeId>("student");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tracker, setTracker] = useState<TrackerState>({});
  const [drafts, setDrafts] = useState<DraftState>({});
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Saved to Supabase");
  const [savingId, setSavingId] = useState<string | null>(null);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opportunity) => {
      const matchesType =
        typeFilter === "all" || opportunity.type === typeFilter;
      const searchText = `${opportunity.title} ${opportunity.organization} ${opportunity.tags.join(" ")}`.toLowerCase();
      const matchesSearch = searchText.includes(search.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [opportunities, search, typeFilter]);

  const trackedItems = opportunities
    .map((opportunity) => tracker[opportunity.id])
    .filter((action): action is OpportunityActionRow => Boolean(action));
  const trackedCount = trackedItems.length;
  const appliedCount = trackedItems.filter(
    (item) => item.status === "applied" || item.status === "interview",
  ).length;

  useEffect(() => {
    async function loadPage() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);

        const configResponse = await fetch("/api/app-config");
        if (!configResponse.ok) {
          throw new Error("Could not load LifeMode settings.");
        }
        const config = (await configResponse.json()) as { modes: LifeMode[] };
        setModes(config.modes);

        const actions = await fetchOpportunityActions(user.id);
        setTracker(
          Object.fromEntries(
            actions.map((action) => [action.opportunity_id, action]),
          ),
        );
        setStatusMessage("Tracker ready");
      } catch (error) {
        setStatusMessage(`Could not load tracker: ${errorMessage(error)}`);
      } finally {
        setIsLoading(false);
      }
    }

    loadPage();
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    async function loadOpportunities() {
      try {
        const data = await fetchOpportunities(activeMode);
        if (!cancelled) {
          setOpportunities(data);
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(`Could not load opportunities: ${errorMessage(error)}`);
        }
      }
    }

    loadOpportunities();

    return () => {
      cancelled = true;
    };
  }, [activeMode]);

  function updateTracker(id: string, update: Partial<TrackerItem>) {
    const current = drafts[id] ?? trackerItemFromAction(tracker[id]);
    setDrafts((previous) => ({
      ...previous,
      [id]: { ...current, ...update },
    }));
    setStatusMessage("Unsaved tracker changes");
  }

  async function saveTracker(id: string) {
    if (!userId || savingId) {
      return;
    }

    const draft = drafts[id] ?? trackerItemFromAction(tracker[id]);
    setSavingId(id);
    setStatusMessage("Saving tracker changes...");
    try {
      const action = await upsertOpportunityAction({
        userId,
        opportunityId: id,
        status: draft.status,
        notes: draft.notes,
        deadline: draft.deadline || null,
        followUp: draft.followUp || null,
      });
      setTracker((previous) => ({ ...previous, [id]: action }));
      setDrafts((previous) => {
        const next = { ...previous };
        delete next[id];
        return next;
      });
      setStatusMessage("Tracker changes saved");
    } catch (error) {
      setStatusMessage(`Could not save tracker changes: ${errorMessage(error)}`);
    } finally {
      setSavingId(null);
    }
  }

  async function removeTracker(id: string) {
    const action = tracker[id];

    if (!action) {
      setDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setStatusMessage("Tracking draft cleared");
      return;
    }

    setStatusMessage("Removing from tracker...");
    try {
      await deleteOpportunityAction(action.id);
      setTracker((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setStatusMessage("Removed from tracker");
    } catch (error) {
      setStatusMessage(`Could not remove from tracker: ${errorMessage(error)}`);
    }
  }

  if (isLoading) {
    return <LoadingCard label="Loading opportunities..." />;
  }

  return (
    <main className="min-h-screen bg-[#f3f5f0] pb-24 text-[#181713] lg:pb-0">
      <header className="border-b border-[#d8d1c2] bg-[#fbfaf6]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7b3f2a]"
            >
              LifeMode
            </Link>
            <h1 className="mt-2 text-3xl font-semibold">
              Opportunity Tracker
            </h1>
            <p className="mt-1 text-sm text-[#5f5a50]">
              Track jobs, internships, freelance gigs, scholarships, and startup roles.
            </p>
          </div>
          <nav className="flex flex-col gap-3 sm:flex-row">
            <Link className="nav-button" href="/dashboard">
              Dashboard
            </Link>
            <Link className="nav-button-dark" href="/profile">
              Proof Profile
            </Link>
            <Link className="nav-button" href="/subscription">
              Plus
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-4">
        <Metric label="Mode" value={modeLabel(activeMode, modes)} />
        <Metric label="Tracked" value={String(trackedCount)} />
        <Metric label="Active applications" value={String(appliedCount)} />
        <Metric label="Save status" value={statusMessage} />
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-6 sm:px-8 lg:grid-cols-[1fr_1fr_1.2fr]">
        <select
          value={activeMode}
          onChange={(event) => setActiveMode(event.target.value as LifeModeId)}
          className="h-12 rounded-lg border border-[#c8beaa] bg-white px-4 text-sm font-semibold outline-none"
        >
          {modes.map((mode) => (
            <option key={mode.id} value={mode.id}>
              {mode.name}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="h-12 rounded-lg border border-[#c8beaa] bg-white px-4 text-sm font-semibold outline-none"
        >
          <option value="all">All types</option>
          <option value="job">Jobs</option>
          <option value="internship">Internships</option>
          <option value="freelance">Freelance</option>
          <option value="scholarship">Scholarships</option>
          <option value="competition">Competitions</option>
          <option value="startup_role">Startup roles</option>
        </select>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, company, or tag"
          className="h-12 rounded-lg border border-[#c8beaa] bg-white px-4 outline-none focus:border-[#7b3f2a]"
        />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 sm:px-8 lg:grid-cols-[1fr_1fr]">
        {filteredOpportunities.map((opportunity) => {
          const tracked = tracker[opportunity.id];
          const draft = drafts[opportunity.id] ?? trackerItemFromAction(tracked);
          const isSaving = savingId === opportunity.id;

          return (
            <article
              key={opportunity.id}
              className="glass-card rounded-lg border border-[#d8d1c2] bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7b3f2a]">
                {opportunity.type.replace("_", " ")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {opportunity.title}
              </h2>
              <p className="mt-1 text-sm text-[#5f5a50]">
                {opportunity.organization} - {opportunity.location}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {opportunity.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-[#dfd8c8] bg-[#fffdf8] px-2 py-1 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid gap-3">
                <label className="grid gap-1 text-xs font-semibold text-[#696257]">
                  Status
                  <select
                    value={draft.status}
                    aria-label="Application status"
                    onChange={(event) =>
                      updateTracker(opportunity.id, {
                        status: event.target.value as TrackerItem["status"],
                      })
                    }
                    className="h-11 rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-3 text-sm font-semibold text-[#181713] outline-none"
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="rejected">Rejected</option>
                    <option value="won">Won</option>
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-semibold text-[#696257]">
                    Deadline
                    <input
                      type="date"
                      aria-label="Application deadline"
                      value={draft.deadline}
                      onChange={(event) =>
                        updateTracker(opportunity.id, {
                          deadline: event.target.value,
                        })
                      }
                      className="h-11 rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-3 text-sm font-normal text-[#181713] outline-none"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-[#696257]">
                    Follow-up date
                    <input
                      type="date"
                      aria-label="Follow-up date"
                      value={draft.followUp}
                      onChange={(event) =>
                        updateTracker(opportunity.id, {
                          followUp: event.target.value,
                        })
                      }
                      className="h-11 rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-3 text-sm font-normal text-[#181713] outline-none"
                    />
                  </label>
                </div>
                <textarea
                  value={draft.notes}
                  onChange={(event) =>
                    updateTracker(opportunity.id, {
                      notes: event.target.value,
                    })
                  }
                  placeholder="Notes, proof to attach, follow-up plan..."
                  className="min-h-24 rounded-lg border border-[#c8beaa] bg-[#fffdf8] p-3 text-sm leading-6 outline-none focus:border-[#7b3f2a]"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => saveTracker(opportunity.id)}
                    disabled={isSaving || savingId !== null || !userId}
                    className="h-10 rounded-lg bg-[#181713] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Saving..." : tracked ? "Save changes" : "Track opportunity"}
                  </button>
                  <button
                    onClick={() => removeTracker(opportunity.id)}
                    disabled={isSaving || savingId !== null}
                    className="h-10 rounded-lg border border-[#c8beaa] bg-white px-4 text-sm font-semibold text-[#181713] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {tracked ? "Remove from tracker" : "Clear draft"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!filteredOpportunities.length ? (
          <p className="rounded-lg border border-[#d8d1c2] bg-white p-5 text-sm text-[#5f5a50] shadow-sm">
            No opportunities match this filter yet. Try another mode, type, or search.
          </p>
        ) : null}
      </section>
      <MobileNav />
    </main>
  );
}

function modeLabel(activeMode: LifeModeId, modes: LifeMode[]) {
  return modes.find((mode) => mode.id === activeMode)?.name ?? activeMode;
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

function LoadingCard({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] px-5 text-[#181713]">
      <div className="rounded-lg border border-[#d8d1c2] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">
          LifeMode
        </p>
        <p className="mt-3 text-2xl font-semibold">{label}</p>
      </div>
    </main>
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
