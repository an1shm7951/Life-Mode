"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const motionTargets = [
  ".premium-panel",
  ".glass-card",
  ".lm-goals-card",
  ".lm-proof-item",
  ".lm-mode-switcher",
  ".lm-checkin",
  ".lm-home-hero",
  ".lm-quick-actions > *",
  ".lm-proof-metrics > *",
  ".lm-stat-card",
  ".connection-card",
  ".story-card",
  ".discover-card",
  ".buddy-card",
  ".plan-card",
  ".schedule-card",
  ".settings-card",
  ".profile-motion-card",
  "[class*='card']",
  "article",
  "[data-motion]",
].join(",");

export function GlobalMotion({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observed = new WeakSet<Element>();
    const revealObserver =
      !reduceMotion && "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add("lm-motion-visible", "is-in-view");
                  revealObserver.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.06, rootMargin: "0px 0px -4% 0px" },
          )
        : null;

    const enhance = (scope: ParentNode) => {
      const candidates: Element[] = [];
      if (scope instanceof Element && scope.matches(motionTargets)) candidates.push(scope);
      scope.querySelectorAll?.(motionTargets).forEach((element) => candidates.push(element));
      candidates.forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);
        element.classList.add("lm-global-motion-card");
        if (reduceMotion || !revealObserver) {
          element.classList.add("lm-motion-visible", "is-in-view");
        } else {
          revealObserver.observe(element);
        }
      });
    };

    enhance(root);
    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) enhance(node);
        });
      });
    });
    mutationObserver.observe(root, { childList: true, subtree: true });

    const handlePointerMove = (event: PointerEvent) => {
      if (reduceMotion || event.pointerType !== "mouse") return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const card = target.closest<HTMLElement>(".lm-global-motion-card");
      if (!card || card.classList.contains("profile-motion-card")) return;
      const bounds = card.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      card.style.setProperty("--lm-pointer-x", `${Math.round(x * 100)}%`);
      card.style.setProperty("--lm-pointer-y", `${Math.round(y * 100)}%`);
      card.style.setProperty("--lm-tilt-x", `${(x - 0.5) * 7}deg`);
      card.style.setProperty("--lm-tilt-y", `${(0.5 - y) * 6}deg`);
      card.classList.add("lm-pointer-active");
    };

    const resetCard = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const card = target.closest<HTMLElement>(".lm-global-motion-card");
      if (!card || card.contains(event.relatedTarget as Node | null)) return;
      card.style.removeProperty("--lm-tilt-x");
      card.style.removeProperty("--lm-tilt-y");
      card.classList.remove("lm-pointer-active");
    };

    let tapTimer: number | undefined;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      target.closest(".lm-global-motion-card, button, a")?.classList.add("lm-motion-pressed");
    };
    const handlePointerUp = () => {
      root.querySelectorAll(".lm-motion-pressed").forEach((element) => {
        element.classList.remove("lm-motion-pressed");
        element.classList.add("lm-motion-tap");
      });
      window.clearTimeout(tapTimer);
      tapTimer = window.setTimeout(() => {
        root.querySelectorAll(".lm-motion-tap").forEach((element) => element.classList.remove("lm-motion-tap"));
      }, 460);
    };

    root.addEventListener("pointermove", handlePointerMove, { passive: true });
    root.addEventListener("pointerout", resetCard);
    root.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });

    return () => {
      mutationObserver.disconnect();
      revealObserver?.disconnect();
      window.clearTimeout(tapTimer);
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerout", resetCard);
      root.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.remove("lm-route-enter");
    const frame = window.requestAnimationFrame(() => root.classList.add("lm-route-enter"));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div ref={rootRef} className="lm-global-motion-root">
      {children}
    </div>
  );
}
