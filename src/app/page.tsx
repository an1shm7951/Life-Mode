import Link from "next/link";
import { InstallButton } from "@/components/install-button";
import { LiquidBackground } from "@/components/liquid-background";
import { ScrollReveal } from "@/components/scroll-reveal";

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
          <p className="lm-eyebrow"><span /> A PERSONAL OPERATING SPACE</p>
          <h1>Make your days<br /><em>mean something.</em></h1>
          <p className="lm-hero-copy">A considered space for your goals, plans, progress and the people who move you forward.</p>
          <div className="lm-hero-actions">
            <Link href="/signup" className="lm-button lm-button-gold">Create your LifeMode <span>↗</span></Link>
            <InstallButton />
          </div>
          <p className="lm-hero-note">Your life. Your pace. Your next chapter.</p>
        </div>

        <div className="lm-hero-index" aria-hidden="true"><span>01</span><i /> THE EVERYDAY, INTENTIONALLY</div>
        <div className="lm-hero-bottom" aria-hidden="true"><span>SCROLL TO EXPLORE</span><span>⌄</span><span>EST. FOR WHAT MATTERS</span></div>
      </section>

      <section className="lm-intro" id="philosophy">
        <p className="lm-eyebrow lm-eyebrow-dark">LESS NOISE. MORE DIRECTION.</p>
        <h2>Your life is not a checklist.<br /><em>It is a work in progress.</em></h2>
        <p>LifeMode brings the pieces of personal growth into one calm, intentional space — so you can focus less on keeping everything together and more on moving forward.</p>
      </section>

      <section className="lm-features" id="experience">
        <div className="lm-section-heading">
          <div><p className="lm-eyebrow">THE LIFEMode EXPERIENCE</p><h2>Everything has<br /><em>its place.</em></h2></div>
          <p>Small steps, visible progress, a clearer sense of where you are going.</p>
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
        <p>Make your days mean something.</p>
        <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/login">Log in</Link></div>
        <small>© {new Date().getFullYear()} LifeMode. Built for the life ahead.</small>
      </footer>
    </main>
  );
}
