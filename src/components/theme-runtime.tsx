"use client";

import { useEffect } from "react";

export type ThemePreference = "light" | "dark" | "system";

export function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  const isDark =
    preference === "dark" ||
    (preference === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.add("theme-switching");
  root.dataset.themePreference = preference;
  root.dataset.theme = isDark ? "dark" : "light";
  void root.offsetWidth;
  window.requestAnimationFrame(() => root.classList.remove("theme-switching"));
}

export function ThemeRuntime() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      if (document.documentElement.dataset.themePreference === "system") {
        applyThemePreference("system");
      }
    };

    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, []);

  return null;
}
