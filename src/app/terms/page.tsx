import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Read the early-access terms for using LifeMode.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "LifeMode Terms of Use",
    description: "Terms for using the LifeMode early-access service.",
    url: "/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f3f5f0] px-5 py-10 text-[#181713] sm:px-8">
      <article className="premium-panel mx-auto max-w-3xl rounded-lg p-5 sm:p-8">
        <Link href="/" className="text-sm font-semibold text-[#315260]">LifeMode</Link>
        <h1 className="mt-5 text-4xl font-semibold">Terms of Use</h1>
        <p className="mt-3 text-sm text-[#696257]">Last updated: November 27, 2026</p>
        <div className="mt-8 grid gap-7">
          <Term title="Early access">
            LifeMode is early-access software. Features may change, and
            interruptions or data loss may occur while the product is being
            tested. Do not rely on the service as the sole copy of important
            information.
          </Term>
          <Term title="Your account and eligibility">
            Provide accurate account information, protect your login details,
            and use only your own account. The current sign-up flow asks users
            to be at least 13. That setting does not override applicable age,
            parental-consent or guardian requirements. Some features may be
            restricted by age or jurisdiction.
          </Term>
          <Term title="Respect and safety">
            Harassment, impersonation, coercion, evading a block or rejection,
            and illegal or harmful activity are prohibited. Dating-related
            features, if offered, are restricted to eligible adults and require
            explicit opt-in.
          </Term>
          <Term title="AI Buddy">
            AI output can be incorrect, incomplete or out of date. It is not a
            substitute for qualified medical, legal, financial or emergency
            support. You remain responsible for decisions made from its output.
          </Term>
          <Term title="Opportunities and third-party services">
            Listings and links may be supplied by third parties. Verify them
            independently. LifeMode does not promise employment, admission,
            payment or the legitimacy of a third-party listing, and third-party
            services are governed by their own terms.
          </Term>
          <Term title="Availability and changes">
            The service is provided during early access and may be changed,
            suspended or discontinued. The final service terms, governing law,
            dispute process, liability provisions and operator contact details
            must be completed before general public release.
          </Term>
        </div>
        <p className="mt-8 rounded-lg border border-[#d8d1c2] bg-white p-4 text-sm leading-6 text-[#5f5a50]">
          This is an early-access terms summary, not a final legal agreement.
          The operator's legal identity, contact details, governing law,
          consumer requirements and other jurisdiction-specific terms require
          review by qualified counsel.
        </p>
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
