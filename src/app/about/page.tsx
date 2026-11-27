import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About LifeMode",
  description:
    "Learn about LifeMode's vision: an AI-assisted personal operating system built around intelligence, integration and personal growth.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About LifeMode",
    description:
      "The thinking behind an AI-assisted personal operating system for everyday life.",
    url: "/about",
  },
};

const pillars = [
  {
    number: "01",
    title: "Intelligence",
    description:
      "AI assistance can help you explore ideas, think through plans and find a useful next step. You remain in control of your decisions.",
  },
  {
    number: "02",
    title: "Integration",
    description:
      "Goals, daily planning, proof of progress and personal workflows belong in a connected experience rather than disconnected lists.",
  },
  {
    number: "03",
    title: "Growth",
    description:
      "Progress is easier to understand when intentions, actions and reflection have a place together. LifeMode is designed to help make that progress visible.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#080807] px-5 py-12 text-[#f3efe6] sm:px-8">
      <article className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d5b978]">
          LifeMode
        </Link>
        <header className="mt-16 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c4a765]">
            The idea behind LifeMode
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight sm:text-7xl">
            Your life,
            <br />
            <span className="font-serif italic text-[#d7bd83]">one system.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-[#c7c0b2]">
            LifeMode is an AI-assisted Personal Operating System in development.
            Its purpose is to bring the everyday work of setting direction,
            planning, tracking progress and personal growth into one considered
            experience.
          </p>
        </header>

        <section className="mt-20 border-t border-[#4a402d] pt-10">
          <h2 className="text-2xl font-semibold sm:text-3xl">Three connected pillars</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => (
              <section key={pillar.number} className="rounded-2xl border border-[#4a402d] bg-[#11100d] p-6">
                <p className="text-xs tracking-[0.2em] text-[#c4a765]">{pillar.number}</p>
                <h3 className="mt-8 text-xl font-semibold">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#c7c0b2]">{pillar.description}</p>
              </section>
            ))}
          </div>
        </section>

        <section className="mt-20 max-w-2xl border-t border-[#4a402d] pt-10">
          <h2 className="text-2xl font-semibold">Built for intentional progress</h2>
          <p className="mt-4 text-base leading-8 text-[#c7c0b2]">
            LifeMode is being developed iteratively. The current experience
            includes tools for daily actions, goals, plans, proof of progress,
            connections, discovery and AI-assisted conversations. Availability
            and behavior can change during early access.
          </p>
          <p className="mt-4 text-base leading-8 text-[#c7c0b2]">
            The long-term direction is a more connected personal system, with
            thoughtful integrations and useful automation added only when they
            make the experience meaningfully better.
          </p>
          <Link href="/signup" className="mt-8 inline-flex rounded-full bg-[#d7bd83] px-6 py-3 text-sm font-semibold text-[#17140e]">
            Explore LifeMode
          </Link>
        </section>
      </article>
    </main>
  );
}
