"use client";

import { useEffect } from "react";

export function LiquidBackground() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduceMotion || coarse) return;
    let frame = 0;
    let latestX = window.innerWidth * 0.72;
    let latestY = window.innerHeight * 0.38;
    const root = document.documentElement;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      latestX = event.clientX;
      latestY = event.clientY;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        root.style.setProperty("--lm-pointer-x", latestX + "px");
        root.style.setProperty("--lm-pointer-y", latestY + "px");
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="lm-liquid" aria-hidden="true">
      <div className="lm-liquid-orb lm-liquid-orb-one" />
      <div className="lm-liquid-orb lm-liquid-orb-two" />
      <div className="lm-liquid-cursor" />
      <div className="lm-liquid-grain" />
    </div>
  );
}
