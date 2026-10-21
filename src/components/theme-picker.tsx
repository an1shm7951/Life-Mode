"use client";

import { useSyncExternalStore } from "react";
import {
  applyThemePreference,
  type ThemePreference,
} from "@/components/theme-runtime";

const options: { value: ThemePreference; label: string; symbol: string; note: string }[] = [
  { value: "light", label: "Light", symbol: "☼", note: "Warm and bright" },
  { value: "dark", label: "Dark", symbol: "◐", note: "Deep and cinematic" },
  { value: "system", label: "System", symbol: "◉", note: "Follows your device" },
];

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("lifemode-theme-change", onChange);
  return () => window.removeEventListener("lifemode-theme-change", onChange);
}

function getThemePreference(): ThemePreference {
  const saved = document.documentElement.dataset.themePreference;
  return saved === "light" || saved === "dark" ? saved : "system";
}

function getServerThemePreference(): ThemePreference {
  return "system";
}

export function ThemePicker() {
  const preference = useSyncExternalStore(
    subscribeToTheme,
    getThemePreference,
    getServerThemePreference,
  );

  function chooseTheme(next: ThemePreference) {
    try {
      localStorage.setItem("lifemode-theme", next);
    } catch {
      // The selected theme still applies for this session if storage is blocked.
    }
    applyThemePreference(next);
    window.dispatchEvent(new Event("lifemode-theme-change"));
  }

  return (
    <section aria-labelledby="appearance-title" className="premium-panel rounded-[26px] p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b3f2a]">Make it yours</p>
          <h2 id="appearance-title" className="mt-2 text-2xl font-semibold">Appearance</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#5f5a50]">Choose the atmosphere that feels right. Your choice stays with you on every visit.</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3" role="group" aria-label="Choose appearance">
        {options.map((option) => {
          const selected = preference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => chooseTheme(option.value)}
              className={`theme-choice ${selected ? "is-selected" : ""}`}
            >
              <span className="theme-choice-symbol" aria-hidden="true">{option.symbol}</span>
              <span className="min-w-0 text-left">
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="mt-1 block text-xs font-medium opacity-70">{option.note}</span>
              </span>
              <span className="theme-choice-indicator" aria-hidden="true">{selected ? "✓" : ""}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
