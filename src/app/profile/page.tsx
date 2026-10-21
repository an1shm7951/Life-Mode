"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { MobileNav } from "@/components/mobile-nav";
import { ThemePicker } from "@/components/theme-picker";
import type { LifeModeId } from "@/lib/lifemode/types";
import {
  ensureProfile,
  fetchGoals,
  fetchOpportunityActions,
  fetchProofPosts,
  updateProfile,
  type GoalRow,
  type OpportunityActionRow,
  type ProfileRow,
  type ProofPostRow,
} from "@/lib/lifemode/database";

const modeNames: Record<LifeModeId, string> = {
  student: "Student",
  gym: "Gym",
  career: "Career",
  business: "Business",
  law: "Law",
  creator: "Creator",
};

export default function ProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [activeMode, setActiveMode] = useState<LifeModeId>("student");
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [proofPosts, setProofPosts] = useState<ProofPostRow[]>([]);
  const [opportunityActions, setOpportunityActions] = useState<
    OpportunityActionRow[]
  >([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [skillsText, setSkillsText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Saved to Supabase");
  const [accountMessage, setAccountMessage] = useState("");

  const completedGoals = useMemo(
    () => goals.filter((goal) => goal.done).length,
    [goals],
  );
  const proofScore = Math.min(
    100,
    proofPosts.length * 12 + completedGoals * 8,
  );
  const recentProof = proofPosts.slice(0, 4);

  useEffect(() => {
    async function loadProfile() {
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

      if (!hasAgeAccess || typeof metadata?.first_mode !== "string") {
        router.push("/onboarding");
        return;
      }

      setEmail(user.email ?? "");
      const firstName = metadata?.first_name;
      const name =
        typeof firstName === "string" && firstName.trim()
          ? firstName
          : user.email?.split("@")[0] ?? "LifeMode user";
      setDisplayName(name);
      setUserId(user.id);

      const userMode = metadata?.first_mode;
      const normalizedMode =
        typeof userMode === "string" ? userMode.toLowerCase() : "student";
      const fallbackMode = Object.hasOwn(modeNames, normalizedMode)
        ? (normalizedMode as LifeModeId)
        : "student";
      const loadedProfile = await ensureProfile({
        userId: user.id,
        displayName: name,
        activeMode: fallbackMode,
        ageBand:
          metadata?.age_band === "under_18" ||
          Number(metadata?.age) < 18
            ? "under_18"
            : "adult",
      });
      const [loadedGoals, loadedProofPosts, loadedOpportunityActions] =
        await Promise.all([
          fetchGoals(user.id),
          fetchProofPosts(user.id),
          fetchOpportunityActions(user.id),
        ]);

      setProfile(loadedProfile);
      setActiveMode(loadedProfile.active_mode);
      setSkillsText(loadedProfile.skills.join(", "));
      setGoals(loadedGoals);
      setProofPosts(loadedProofPosts);
      setOpportunityActions(loadedOpportunityActions);

      setIsLoading(false);
    }

    loadProfile();
  }, [router]);

  async function saveProfile() {
    if (!profile || !userId) {
      return;
    }

    setStatusMessage("Saving profile...");
    const updatedProfile = await updateProfile(userId, {
      bio: profile.bio,
      skills: skillsText
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      is_public: profile.is_public,
      active_mode: activeMode,
    });
    setProfile(updatedProfile);
    setSkillsText(updatedProfile.skills.join(", "));
    setStatusMessage("Saved to Supabase");
  }

  async function exportAccountData() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push("/login");
      return;
    }

    setAccountMessage("Preparing your export...");
    const response = await fetch("/api/account/export", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) {
      setAccountMessage("Your export could not be created.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lifemode-data.json";
    link.click();
    URL.revokeObjectURL(url);
    setAccountMessage("Export downloaded.");
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Delete your LifeMode account and all of its stored data? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.push("/login");
      return;
    }

    setAccountMessage("Deleting account...");
    const response = await fetch("/api/account/delete", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setAccountMessage(result.error ?? "Account deletion failed.");
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
  }

  if (isLoading) {
    return <LoadingCard label="Loading proof profile..." />;
  }

  return (
    <main className="min-h-screen bg-[#f3f5f0] pb-24 text-[#181713] lg:pb-0">
      <AppHeader title="Proof Profile" subtitle="Show proof, not just claims." />

      <section className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
        <ThemePicker />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="premium-panel rounded-lg p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">
                {modeNames[activeMode]}
              </p>
              <h1 className="mt-2 text-4xl font-semibold">{displayName}</h1>
              <p className="mt-2 text-sm text-[#5f5a50]">{email}</p>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-[#dfd8c8] bg-[#fffdf8] px-3 py-2 text-sm font-semibold">
              Public
              <input
                type="checkbox"
                checked={profile?.is_public ?? false}
                onChange={() =>
                  setProfile((current) =>
                    current
                      ? { ...current, is_public: !current.is_public }
                      : current,
                  )
                }
                className="h-4 w-4 accent-[#181713]"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">
              Bio
              <textarea
                value={profile?.bio ?? ""}
                onChange={(event) =>
                  setProfile((current) =>
                    current ? { ...current, bio: event.target.value } : current,
                  )
                }
                className="min-h-28 rounded-lg border border-[#c8beaa] bg-[#fffdf8] p-3 font-normal leading-6 outline-none focus:border-[#7b3f2a]"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Skills and signals
              <input
                value={skillsText}
                onChange={(event) => setSkillsText(event.target.value)}
                className="h-12 rounded-lg border border-[#c8beaa] bg-[#fffdf8] px-4 font-normal outline-none focus:border-[#7b3f2a]"
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={saveProfile}
                className="h-11 rounded-lg bg-[#181713] px-4 text-sm font-semibold text-white"
              >
                Save profile
              </button>
              <span className="text-sm font-semibold text-[#5f5a50]">
                {statusMessage}
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Metric label="Proof score" value={`${proofScore}%`} />
            <Metric
              label="Proof posts"
              value={String(proofPosts.length)}
            />
            <Metric label="Goals completed" value={String(completedGoals)} />
            <Metric
              label="Applications"
              value={String(opportunityActions.length)}
            />
          </div>
          <div className="rounded-lg border border-[#d8d1c2] bg-[#181713] p-5 text-[#f5f1e8] shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d6c29d]">
              Profile promise
            </p>
            <p className="mt-3 text-2xl font-semibold">
              Traditional profiles show what you claim. LifeMode shows what you prove.
            </p>
          </div>
        </section>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
        <section className="premium-panel rounded-lg p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7b3f2a]">
            Recent Proof
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recentProof.length ? (
              recentProof.map((proof) => (
                <article
                  key={proof.id}
                  className="glass-card rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7b3f2a]">
                      {modeNames[proof.mode]}
                    </span>
                    <span className="text-sm text-[#696257]">
                      {formatDateTime(proof.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-6">
                    {proof.text}
                  </p>
                  <ProofAttachment proof={proof} />
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-[#dfd8c8] bg-[#fffdf8] p-4 text-sm text-[#5f5a50]">
                Add proof from the dashboard and it will appear here.
              </p>
            )}
          </div>
        </section>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
        <section className="premium-panel rounded-lg p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#315260]">
            Account and data
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={exportAccountData}
              className="h-11 rounded-lg border border-[#aeb8ad] bg-white px-4 text-sm font-semibold"
            >
              Export my data
            </button>
            <button
              onClick={deleteAccount}
              className="h-11 rounded-lg border border-[#d8a7a0] bg-[#fff7f5] px-4 text-sm font-semibold text-[#8c3027]"
            >
              Delete account
            </button>
          </div>
          {accountMessage ? (
            <p className="mt-3 text-sm text-[#5f5a50]">{accountMessage}</p>
          ) : null}
          <div className="mt-4 flex gap-5 text-sm font-semibold text-[#315260]">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </section>
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

function AppHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="border-b border-[#d8d1c2] bg-[#fbfaf6]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7b3f2a]"
          >
            LifeMode
          </Link>
          <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-[#5f5a50]">{subtitle}</p>
        </div>
        <nav className="flex flex-col gap-3 sm:flex-row">
          <Link className="nav-button" href="/dashboard">
            Dashboard
          </Link>
          <Link className="nav-button-dark" href="/opportunities">
            Opportunities
          </Link>
          <Link className="nav-button" href="/subscription">
            Plus
          </Link>
        </nav>
      </div>
    </header>
  );
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

function ProofAttachment({ proof }: { proof: ProofPostRow }) {
  if (!proof.media_path) {
    return null;
  }

  if (!proof.media_url) {
    return <p className="mt-3 text-sm text-[#7b3f2a]">Attachment link unavailable. Refresh the page to try again.</p>;
  }

  const mediaType = proof.media_type ?? "";
  const canPreview = mediaType.startsWith("image/") &&
    !["image/heic", "image/heif"].includes(mediaType);

  return (
    <div className="mt-3 grid gap-2">
      {canPreview ? (
        <a href={proof.media_url} target="_blank" rel="noreferrer" aria-label={`Open ${proof.media_name ?? "evidence image"}`}>
          <img
            src={proof.media_url}
            alt={proof.media_name ?? "Proof evidence"}
            className="max-h-80 max-w-full rounded-lg border border-[#dfd8c8] object-contain"
          />
        </a>
      ) : null}
      <a
        href={proof.media_url}
        target="_blank"
        rel="noreferrer"
        download={proof.media_name ?? true}
        className="w-fit text-sm font-semibold text-[#315260] underline"
      >
        Open or download {proof.media_name ?? "attachment"}
      </a>
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
