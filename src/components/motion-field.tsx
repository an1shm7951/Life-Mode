"use client";

import { useEffect } from "react";

const surfaceSelector = ".premium-panel, .glass-card, .theme-choice, .auth-story";

export function MotionField() {
  useEffect(() => {
    const supportsHover = !window.matchMedia("(hover: none)").matches;

    let activeSurface: HTMLElement | null = null;
    let pendingEvent: PointerEvent | null = null;
    let pendingCursorEvent: PointerEvent | null = null;
    let frame = 0;
    let cursorFrame = 0;
    let scrollFrame = 0;

    function handlePointerMove(event: PointerEvent) {
      pendingCursorEvent = event;
      if (!cursorFrame) {
        cursorFrame = window.requestAnimationFrame(() => {
          cursorFrame = 0;
          if (!pendingCursorEvent) return;
          document.documentElement.style.setProperty(
            "--scene-pointer-x",
            `${pendingCursorEvent.clientX}px`,
          );
          document.documentElement.style.setProperty(
            "--scene-pointer-y",
            `${pendingCursorEvent.clientY}px`,
          );
        });
      }
      const target = event.target;
      const surface =
        target instanceof Element
          ? (target.closest(surfaceSelector) as HTMLElement | null)
          : null;

      if (surface !== activeSurface) {
        activeSurface?.classList.remove("pointer-lit");
        activeSurface?.style.removeProperty("--tilt-x");
        activeSurface?.style.removeProperty("--tilt-y");
        activeSurface = surface;
        activeSurface?.classList.add("pointer-lit");
      }

      if (!activeSurface) {
        return;
      }

      pendingEvent = event;
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (!activeSurface || !pendingEvent) {
          return;
        }

        const bounds = activeSurface.getBoundingClientRect();
        const horizontal = (pendingEvent.clientX - bounds.left) / bounds.width;
        const vertical = (pendingEvent.clientY - bounds.top) / bounds.height;
        activeSurface.style.setProperty(
          "--pointer-x",
          `${pendingEvent.clientX - bounds.left}px`,
        );
        activeSurface.style.setProperty(
          "--pointer-y",
          `${pendingEvent.clientY - bounds.top}px`,
        );
        activeSurface.style.setProperty(
          "--tilt-x",
          `${(0.5 - vertical) * 5}deg`,
        );
        activeSurface.style.setProperty(
          "--tilt-y",
          `${(horizontal - 0.5) * 5}deg`,
        );
      });
    }

    function clearActiveSurface() {
      activeSurface?.classList.remove("pointer-lit");
      activeSurface?.style.removeProperty("--tilt-x");
      activeSurface?.style.removeProperty("--tilt-y");
      activeSurface = null;
      pendingEvent = null;
    }

    function updateScrollProgress() {
      if (scrollFrame) {
        return;
      }

      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress =
          scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        const scroll = window.scrollY;
        document.documentElement.style.setProperty(
          "--page-scroll",
          String(Math.max(0, Math.min(1, progress))),
        );
        document.documentElement.style.setProperty(
          "--scene-drift-slow",
          `${Math.max(-260, -scroll * 0.12)}px`,
        );
        document.documentElement.style.setProperty(
          "--scene-drift-medium",
          `${Math.max(-440, -scroll * 0.22)}px`,
        );
        document.documentElement.style.setProperty(
          "--scene-drift-grid",
          `${Math.max(-120, -scroll * 0.055)}px`,
        );
      });
    }

    if (supportsHover) {
      document.addEventListener("pointermove", handlePointerMove, { passive: true });
      document.addEventListener("pointerleave", clearActiveSurface);
    }
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);
    updateScrollProgress();
    return () => {
      if (supportsHover) {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerleave", clearActiveSurface);
      }
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      if (cursorFrame) {
        window.cancelAnimationFrame(cursorFrame);
      }
      if (scrollFrame) {
        window.cancelAnimationFrame(scrollFrame);
      }
    };
  }, []);

  return null;
}
