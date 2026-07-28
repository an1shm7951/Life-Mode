import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f0] px-5 py-10 text-[#181713] sm:px-8">
      <article className="premium-panel mx-auto max-w-3xl rounded-lg p-5 sm:p-8">
        <Link href="/" className="text-sm font-semibold text-[#315260]">
          LifeMode
        </Link>
        <h1 className="mt-5 text-4xl font-semibold">Privacy Notice</h1>
        <p className="mt-3 text-sm text-[#696257]">Effective June 19, 2026</p>

        <div className="prose-copy mt-8 grid gap-7">
          <PolicySection title="What LifeMode stores">
            Account details, your age band, goals, proof posts, profile data,
            opportunity tracking, connection preferences, and AI Buddy chat
            history are stored so those features work across devices.
          </PolicySection>
          <PolicySection title="AI processing">
            Messages sent to AI Buddy may be processed by the configured AI
            provider to generate a reply. Do not submit passwords, payment
            details, medical records, or other highly sensitive information.
          </PolicySection>
          <PolicySection title="Who can see your data">
            Personal work is private by default. A proof profile is only public
            when you explicitly enable its public setting. LifeMode does not
            sell personal data.
          </PolicySection>
          <PolicySection title="Security and control">
            Authentication and database access rules are provided through
            Supabase. You may remove individual goals, proof posts, and tracked
            opportunities inside the app. Account export and full deletion are
            available from the Proof Profile page.
          </PolicySection>
          <PolicySection title="Age limits">
            Accounts currently require users to be at least 13. Dating remains
            unavailable to users under 18 and must be explicitly enabled by
            eligible adults.
          </PolicySection>
        </div>

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
