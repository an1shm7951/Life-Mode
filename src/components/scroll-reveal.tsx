"use client";

import { useEffect } from "react";

const revealSelector =
  "main > section, main > article, main > div, .glass-card, .premium-panel, .premium-surface, .premium-focus";

export function ScrollReveal() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in-view");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
    );

    let revealIndex = 0;
    function observeWithin(root: ParentNode) {
      root.querySelectorAll(revealSelector).forEach((target) => {
        if (target.classList.contains("scroll-reveal")) return;
        target.classList.add("scroll-reveal");
        (target as HTMLElement).style.setProperty(
          "--reveal-delay",
          `${Math.min(revealIndex % 4, 3) * 55}ms`,
        );
        revealIndex += 1;
        observer.observe(target);
      });
    }

    observeWithin(document);
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) observeWithin(node);
        });
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return null;
}
