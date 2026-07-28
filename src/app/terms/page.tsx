import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f0] px-5 py-10 text-[#181713] sm:px-8">
      <article className="premium-panel mx-auto max-w-3xl rounded-lg p-5 sm:p-8">
        <Link href="/" className="text-sm font-semibold text-[#315260]">
          LifeMode
        </Link>
        <h1 className="mt-5 text-4xl font-semibold">Terms of Use</h1>
        <p className="mt-3 text-sm text-[#696257]">Effective June 19, 2026</p>
        <div className="mt-8 grid gap-7">
          <Term title="Early access">
            LifeMode is currently early-access software. Features may change,
            and interruptions or data loss may occur while the product is being
            tested.
          </Term>
          <Term title="Your account">
            Provide accurate age eligibility, protect your login details, and
            use only your own account. Users must currently be at least 13.
          </Term>
          <Term title="Respect and safety">
            Harassment, impersonation, coercion, evading a block or rejection,
            and illegal or harmful activity are prohibited. Dating is 18+ and
            opt-in only.
          </Term>
          <Term title="AI Buddy">
            AI output can be incorrect. It is not a substitute for qualified
            medical, legal, financial, or emergency support. You remain
            responsible for decisions made from its output.
          </Term>
          <Term title="Opportunities">
            Listings must be verified independently. LifeMode does not promise
            employment, admission, payment, or the legitimacy of a third-party
            listing.
          </Term>
        </div>
        <Link href="/privacy" className="mt-8 inline-flex font-semibold text-[#315260]">
          Read the Privacy Notice
        </Link>
      </article>
    </main>
  );
}

function Term({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[#5f5a50]">{children}</p>
    </section>
  );
}
