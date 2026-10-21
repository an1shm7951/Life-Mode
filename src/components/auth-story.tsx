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
    <section className="auth-story" data-mode={mode?.toLowerCase() ?? "none"} aria-label="About LifeMode">
      <Link className="auth-brand" href="/login" aria-label="LifeMode home">
        <span className="auth-brand-mark" aria-hidden="true"><i /><i /><i /></span>
        <span>LIFEMODE<span className="auth-brand-period">.</span></span>
      </Link>

      <div className="auth-story-copy">
        <p className="auth-eyebrow"><span className="auth-live-dot" /> A personal operating system</p>
        <h1>
          {isReturning ? <>Pick up<br />your <em>momentum.</em></> : <>Make your<br />next move <em>matter.</em></>}
        </h1>
        <p className="auth-story-description">
          {isReturning
            ? "Your goals, proof, and next opportunities are right where you left them."
            : "One clear focus. Real proof. A life that moves forward in a way you can see."}
        </p>
      </div>

      <div className="auth-orbit-scene" aria-hidden="true">
        <div className="auth-orbit auth-orbit-outer"><i /></div>
        <div className="auth-orbit auth-orbit-middle"><i /></div>
        <div className="auth-orbit auth-orbit-inner"><i /></div>
        <div className="auth-orbit-core"><span className="auth-core-glint" /></div>
        <div className="auth-orbit-label auth-label-focus"><span>01</span> FOCUS</div>
        <div className="auth-orbit-label auth-label-proof"><span>02</span> PROOF</div>
        <div className="auth-orbit-label auth-label-motion"><span>03</span> MOMENTUM</div>
        <div className="auth-orbit-caption">{mode ? `${mode.toUpperCase()} MODE SELECTED` : "YOUR LIFE · IN MOTION"}</div>
      </div>

      <div className="auth-story-footer">
        <span className="auth-story-line" />
        <p>Private by default<span> · </span>proof stays yours</p>
        <span className="auth-story-index">L / 01</span>
      </div>
    </section>
  );
}
