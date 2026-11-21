"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Keep this component intentionally lightweight. Motion must never hide page
 * content or depend on IntersectionObserver/pointer events to make the app usable.
 */
export function GlobalMotion({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.classList.remove("lm-route-enter");
    // Force a style boundary so the entrance animation can replay on navigation.
    void root.offsetWidth;
    root.classList.add("lm-route-enter");

    return () => root.classList.remove("lm-route-enter");
  }, [pathname]);

  return (
    <div ref={rootRef} className="lm-global-motion-root">
      {children}
    </div>
  );
}
