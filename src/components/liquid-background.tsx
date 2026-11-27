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
      <svg className="lm-liquid-defs" xmlns="http://www.w3.org/2000/svg" focusable="false"><filter id="lm-liquid-warp" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.009 0.015" numOctaves="2" seed="5" result="noise"><animate attributeName="baseFrequency" dur="18s" values="0.009 0.015;0.016 0.023;0.009 0.015" repeatCount="indefinite" /></feTurbulence><feDisplacementMap in="SourceGraphic" in2="noise" scale="34" xChannelSelector="R" yChannelSelector="G" /></filter></svg>
      <div className="lm-liquid-orb lm-liquid-orb-one" />
      <div className="lm-liquid-orb lm-liquid-orb-two" />
      <div className="lm-liquid-cursor" />
      <div className="lm-liquid-grain" />
    </div>
  );
}
