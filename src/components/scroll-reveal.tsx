"use client";

import { useEffect } from "react";

const revealSelector =
  "main > section, main > article, main > div, .glass-card, .premium-panel, .premium-surface, .premium-focus";

export function ScrollReveal() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in-view");
          } else {
            // Remember which edge the element left through. When it comes back
            // into view, it should enter from that same edge in reverse.
            const target = entry.target as HTMLElement;
            target.style.setProperty(
              "--reveal-offset",
              entry.boundingClientRect.top < 0 ? "-42px" : "42px",
            );
            target.classList.remove("is-in-view");
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    let revealIndex = 0;
    function observeWithin(root: ParentNode) {
      const targets = root.querySelectorAll(revealSelector);
      targets.forEach((target) => {
        if (target.classList.contains("scroll-reveal")) {
          return;
        }

        target.classList.add("scroll-reveal");
        (target as HTMLElement).style.setProperty(
          "--reveal-delay",
          `${(revealIndex % 4) * 95}ms`,
        );
        (target as HTMLElement).style.setProperty(
          "--reveal-x",
          revealIndex % 3 === 0 ? "-34px" : revealIndex % 3 === 1 ? "34px" : "0px",
        );
        revealIndex += 1;
        observer.observe(target);
      });
    }

    observeWithin(document);
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            if (node.matches(revealSelector)) {
              observeWithin(node.parentNode ?? document);
            } else {
              observeWithin(node);
            }
          }
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
