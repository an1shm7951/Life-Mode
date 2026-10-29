import Link from "next/link";

export function AuthStory({
  mode,
  variant = "signup",
}: {
  mode?: string;
  variant?: "signup" | "login";
}) {
  const isReturning = variant === "login";

  return (
    <section className="auth-story auth-story-v2" data-mode={mode?.toLowerCase() ?? "none"} aria-label="About LifeMode">
      <Link className="auth-brand auth-brand-v2" href="/login" aria-label="LifeMode home">
        <span className="auth-brand-mark auth-brand-mark-v2" aria-hidden="true"><i /><i /><i /></span>
        <span>LIFEMODE<span className="auth-brand-period">.</span></span>
        <span className="auth-brand-tag">MAKE IT YOURS</span>
      </Link>

      <div className="auth-story-copy auth-story-copy-v2">
        <p className="auth-eyebrow"><span className="auth-live-dot" /> YOUR LIFE, IN MOTION</p>
        <h1>
          {isReturning ? <>You’re building<br />something <em>real.</em></> : <>A life that feels<br />like <em>your own.</em></>}
        </h1>
        <p className="auth-story-description">
          {isReturning
            ? "Your next move is waiting. Pick up where you left off and keep building at your pace."
            : "Find your focus. Follow what makes you curious. Turn small promises to yourself into progress you can feel."}
        </p>
      </div>

      <div className="auth-showcase" aria-label="LifeMode at a glance">
        <div className="auth-showcase-glow" />
        <div className="auth-showcase-orbit orbit-one" />
        <div className="auth-showcase-orbit orbit-two" />
        <div className="auth-showcase-core"><span>L</span><i /></div>
        <article className="auth-float-card auth-float-discover">
          <span className="auth-float-icon">✳</span>
          <div><small>01 / DISCOVER</small><strong>Stay curious.</strong><p>Ideas worth your time</p></div>
          <span className="auth-float-arrow">↗</span>
        </article>
        <article className="auth-float-card auth-float-goals">
          <span className="auth-float-icon">↗</span>
          <div><small>02 / GOALS</small><strong>Make it happen.</strong><p>Progress, your way</p></div>
          <span className="auth-float-check">✓</span>
        </article>
        <article className="auth-float-card auth-float-plan">
          <span className="auth-float-icon">◷</span>
          <div><small>03 / PLAN</small><strong>Find your rhythm.</strong><p>A day with intention</p></div>
          <span className="auth-float-arrow">↗</span>
        </article>
        <div className="auth-showcase-note"><span /> A little more you, every day.</div>
      </div>

      <div className="auth-story-footer auth-story-footer-v2">
        <p>YOUR SPACE. YOUR PACE.</p>
        <span className="auth-story-index">L / 01</span>
      </div>
    </section>
  );
}
