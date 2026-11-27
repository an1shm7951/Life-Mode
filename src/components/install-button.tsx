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
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    setPlatform(isIOS ? "ios" : isAndroid ? "android" : "desktop");

    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const onPrompt = (event: Event) => {
      // Keep the browser's native install prompt until the user taps our button.
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
    if (isInstalled) return;

    if (promptEvent) {
      // Android Chrome/Edge (and supported desktop browsers) show the real
      // operating-system/browser install confirmation from this user gesture.
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setIsInstalled(true);
      setPromptEvent(null);
      return;
    }

    // iOS does not expose a web API for programmatic Home Screen installation.
    // On Android, this is only a fallback when the browser has not made the
    // native beforeinstallprompt event available.
    setGuideOpen(true);
  }

  const isIOS = platform === "ios";
  const isAndroid = platform === "android";

  return (
    <>
      <button
        type="button"
        className="lm-button lm-button-quiet"
        onClick={handleInstall}
        disabled={isInstalled}
        aria-label={isInstalled ? "LifeMode is installed" : "Install LifeMode"}
      >
        {isInstalled ? "LifeMode installed" : "Install LifeMode"} <span>{isInstalled ? "✓" : "↓"}</span>
      </button>

      {guideOpen && (
        <div
          className="lm-install-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setGuideOpen(false);
          }}
        >
          <section className="lm-install-dialog" role="dialog" aria-modal="true" aria-labelledby="lm-install-title">
            <button className="lm-install-close" type="button" onClick={() => setGuideOpen(false)} aria-label="Close">×</button>
            <p className="lm-eyebrow lm-eyebrow-dark">TAKE IT WITH YOU</p>
            <h2 id="lm-install-title">Install LifeMode</h2>
            {isIOS ? (
              <>
                <p>Safari requires your confirmation before a website can be added to the Home Screen.</p>
                <ol>
                  <li>Open this page in <strong>Safari</strong>.</li>
                  <li>Tap the <strong>Share</strong> button.</li>
                  <li>Choose <strong>Add to Home Screen</strong>, then tap Add.</li>
                </ol>
              </>
            ) : isAndroid ? (
              <>
                <p>Your browser has not made its one-tap install prompt available yet.</p>
                <ol>
                  <li>Open LifeMode in the latest <strong>Chrome</strong>.</li>
                  <li>Make sure you are visiting the secure LifeMode website.</li>
                  <li>If Chrome offers <strong>Install app</strong> in its menu, you can use that while the native button becomes available.</li>
                </ol>
              </>
            ) : (
              <>
                <p>This browser has not made its native install prompt available yet.</p>
                <ol>
                  <li>Open LifeMode in the latest <strong>Chrome or Edge</strong>.</li>
                  <li>Open the browser menu.</li>
                  <li>Choose <strong>Install LifeMode</strong> or <strong>Install app</strong>, if shown.</li>
                </ol>
              </>
            )}
            <p className="lm-install-hint">The direct install prompt appears only when the browser confirms that LifeMode meets its installability requirements and is not already installed.</p>
            <button type="button" className="lm-button lm-button-gold" onClick={() => setGuideOpen(false)}>Got it <span>✓</span></button>
          </section>
        </div>
      )}
    </>
  );
}
