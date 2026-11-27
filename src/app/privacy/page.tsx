import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "Learn what LifeMode stores, how account information is used, and how to manage your data.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "LifeMode Privacy Notice",
    description: "How LifeMode handles account information and personal data.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f0] px-5 py-10 text-[#181713] sm:px-8">
      <article className="premium-panel mx-auto max-w-3xl rounded-lg p-5 sm:p-8">
        <Link href="/" className="text-sm font-semibold text-[#315260]">LifeMode</Link>
        <h1 className="mt-5 text-4xl font-semibold">Privacy Notice</h1>
        <p className="mt-3 text-sm text-[#696257]">Last updated: November 27, 2026</p>

        <div className="prose-copy mt-8 grid gap-7">
          <PolicySection title="What LifeMode stores">
            Account details, your age band, goals, proof posts, profile data,
            opportunity tracking, connection preferences, and AI Buddy chat
            history may be stored so those features work across devices. The
            exact data used depends on the features you choose to use.
          </PolicySection>
          <PolicySection title="AI processing">
            Messages sent to AI Buddy may be processed by the AI provider
            configured for that feature to generate a reply. The provider and
            processing location can depend on the configuration in use. Do not
            submit passwords, payment details, medical records, or other highly
            sensitive information.
          </PolicySection>
          <PolicySection title="Who can see your data">
            Profiles and personal work are intended to remain private unless a
            feature explicitly lets you share something. Public profile
            discovery is disabled while age eligibility and privacy safeguards
            are reviewed. LifeMode does not sell personal data.
          </PolicySection>
          <PolicySection title="Security and account controls">
            Authentication and database access controls are provided through
            Supabase. You may remove individual items where the app provides
            that control. Settings includes data export and account deletion
            controls; these operations depend on server-side configuration and
            may display an error if the service is unavailable.
          </PolicySection>
          <PolicySection title="Age and eligibility">
            The current sign-up flow asks users to be at least 13. This
            application setting is not a determination that use is lawful for
            every age group or jurisdiction, and it does not replace any
            parental or guardian consent that may be required. Some features
            may have additional age restrictions.
          </PolicySection>
          <PolicySection title="Questions and privacy requests">
            LifeMode's privacy contact, data-retention periods, detailed
            provider list, and jurisdiction-specific privacy request process
            must be published before broad public release. Do not use this
            early-access service for information that requires a guaranteed
            deletion or retention schedule.
          </PolicySection>
        </div>

        <p className="mt-8 rounded-lg border border-[#d8d1c2] bg-white p-4 text-sm leading-6 text-[#5f5a50]">
          This is an early-access privacy notice and is not a substitute for
          jurisdiction-specific legal advice. It must be completed with the
          operator's legal identity, contact details, data-retention schedule,
          processors and applicable user-rights process before general release.
        </p>
        <Link href="/terms" className="mt-8 inline-flex font-semibold text-[#315260]">
          Read the Terms of Use
        </Link>
      </article>
    </main>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[#5f5a50]">{children}</p>
    </section>
  );
}
