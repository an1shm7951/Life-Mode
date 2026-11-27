import type { Metadata } from "next";
import Link from "next/link";
import { InstallButton } from "@/components/install-button";
import { LiquidBackground } from "@/components/liquid-background";
import { ScrollReveal } from "@/components/scroll-reveal";

export const metadata: Metadata = {
  title: "Your Personal Operating System",
  description:
    "LifeMode brings goals, daily plans, proof of progress and AI assistance together in one personal operating system.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "LifeMode — Your Personal Operating System",
    description:
      "Bring your goals, plans, progress and personal growth into one considered space.",
    url: "/",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://lifemode.vercel.app/#organization",
      name: "LifeMode",
      url: "https://lifemode.vercel.app/",
      logo: "https://lifemode.vercel.app/lifemode-icon.svg",
    },
    {
      "@type": "WebSite",
      "@id": "https://lifemode.vercel.app/#website",
      name: "LifeMode",
      url: "https://lifemode.vercel.app/",
      publisher: { "@id": "https://lifemode.vercel.app/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://lifemode.vercel.app/#software",
      name: "LifeMode",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Web",
      url: "https://lifemode.vercel.app/",
      description:
        "An AI-assisted personal operating system for organizing goals, plans, progress and personal growth.",
      publisher: { "@id": "https://lifemode.vercel.app/#organization" },
    },
  ],
};

const features = [
  { number: "01", name: "Today", detail: "Turn the day into a clear set of meaningful actions.", mark: "◷" },
  { number: "02", name: "Proof", detail: "Keep a record of the work, progress and promises you keep.", mark: "↗" },
  { number: "03", name: "Plan", detail: "Give your short-term goals and long-term direction a home.", mark: "⌁" },
  { number: "04", name: "Connections", detail: "Build accountability around the people and goals that matter.", mark: "◎" },
  { number: "05", name: "Discover", detail: "Explore opportunities and ideas worth acting on.", mark: "✳" },
  { number: "06", name: "AI Buddy", detail: "Think through plans and questions with an AI companion.", mark: "✧" },
];

export default function HomePage() {
  return (
    <main className="lm-launch">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ScrollReveal />
      <section className="lm-hero">
        <LiquidBackground />
        <nav className="lm-nav" aria-label="Main navigation">
          <Link href="/" className="lm-wordmark"><span className="lm-mark">L</span> LIFEMODE</Link>
          <div className="lm-nav-links">
            <a href="#experience">Experience</a>
            <a href="#philosophy">Philosophy</a>
            <Link href="/login">Log in</Link>
          </div>
          <Link className="lm-nav-cta" href="/signup">Get started <span>↗</span></Link>
        </nav>

        <div className="lm-hero-content">
          <p className="lm-eyebrow"><span /> YOUR PERSONAL OPERATING SYSTEM</p>
          <h1>Your life,<br /><em>one system.</em></h1>
          <p className="lm-hero-copy">Bring your goals, daily plans, progress and personal growth into one calm, intelligent space.</p>
          <div className="lm-hero-actions">
            <Link href="/signup" className="lm-button lm-button-gold">Create your LifeMode <span>↗</span></Link>
            <InstallButton />
          </div>
          <p className="lm-hero-note">Think clearly. Act intentionally. Keep growing.</p>
        </div>

        <div className="lm-hero-index" aria-hidden="true"><span>01</span><i /> THE EVERYDAY, INTENTIONALLY</div>
        <div className="lm-hero-bottom" aria-hidden="true"><span>SCROLL TO EXPLORE</span><span>⌄</span><span>EST. FOR WHAT MATTERS</span></div>
      </section>

      <section className="lm-intro" id="philosophy">
        <p className="lm-eyebrow lm-eyebrow-dark">INTELLIGENCE. INTEGRATION. GROWTH.</p>
        <h2>Your life is not a checklist.<br /><em>It is a system you shape.</em></h2>
        <p>LifeMode connects the everyday work of living well: setting direction, planning what matters, keeping proof of progress and reflecting on what comes next. AI assistance helps you think through the work without taking your decisions away.</p>
      </section>

      <section className="lm-features" id="experience">
        <div className="lm-section-heading">
          <div><p className="lm-eyebrow">THE LIFEMODE EXPERIENCE</p><h2>Everything has<br /><em>its place.</em></h2></div>
          <p>One connected place for the goals you set, the actions you take and the progress you make.</p>
        </div>
        <div className="lm-feature-grid">
          {features.map((feature) => (
            <article className="lm-feature-card" key={feature.name} tabIndex={0}>
              <div className="lm-feature-top"><span>{feature.number}</span><span className="lm-feature-mark">{feature.mark}</span></div>
              <div><h3>{feature.name}</h3><p>{feature.detail}</p></div>
              <span className="lm-feature-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
        <p className="lm-feature-footnote">LifeMode is evolving. Features and integrations may vary during early access.</p>
      </section>

      <section className="lm-manifesto">
        <div className="lm-manifesto-glow" aria-hidden="true" />
        <p className="lm-eyebrow">A BETTER WAY TO SHOW UP</p>
        <h2>Progress is built<br />in the <em>ordinary.</em></h2>
        <p>Make space for what matters. Keep showing up. Let the small things add up.</p>
        <Link href="/signup" className="lm-button lm-button-gold">Begin with today <span>↗</span></Link>
      </section>

      <footer className="lm-footer">
        <Link href="/" className="lm-wordmark"><span className="lm-mark">L</span> LIFEMODE</Link>
        <p>Your life. One system.</p>
        <div><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login">Log in</Link></div>
        <small>© {new Date().getFullYear()} LifeMode. Built for the life ahead.</small>
      </footer>
    </main>
  );
}
