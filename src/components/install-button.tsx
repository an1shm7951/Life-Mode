"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(ios);
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setPromptEvent(null);
      setGuideOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setIsInstalled(true);
      setPromptEvent(null);
      return;
    }
    setGuideOpen(true);
  }

  return (
    <>
      <button type="button" className="lm-button lm-button-quiet" onClick={handleInstall} disabled={isInstalled}>
        {isInstalled ? "LifeMode installed" : "Install LifeMode"} <span>{isInstalled ? "✓" : "↓"}</span>
      </button>
      {guideOpen && (
        <div className="lm-install-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setGuideOpen(false);
        }}>
          <section className="lm-install-dialog" role="dialog" aria-modal="true" aria-labelledby="lm-install-title">
            <button className="lm-install-close" type="button" onClick={() => setGuideOpen(false)} aria-label="Close">×</button>
            <p className="lm-eyebrow lm-eyebrow-dark">TAKE IT WITH YOU</p>
            <h2 id="lm-install-title">Install LifeMode</h2>
            {isIOS ? (
              <ol><li>Open this page in <strong>Safari</strong>.</li><li>Tap the <strong>Share</strong> button.</li><li>Choose <strong>Add to Home Screen</strong>, then tap Add.</li></ol>
            ) : (
              <ol><li>Open LifeMode in <strong>Chrome or Edge</strong>.</li><li>Open the browser menu.</li><li>Choose <strong>Install LifeMode</strong> or <strong>Install app</strong>.</li></ol>
            )}
            <p className="lm-install-hint">If the install option is unavailable, try the browser's menu or check that the site is open over HTTPS.</p>
            <button type="button" className="lm-button lm-button-gold" onClick={() => setGuideOpen(false)}>Got it <span>✓</span></button>
          </section>
        </div>
      )}
    </>
  );
}
