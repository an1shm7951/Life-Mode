"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Keep this component intentionally lightweight. Motion must never hide page
 * content or depend on IntersectionObserver/pointer events to make the app usable.
 *
 * Search parameters are part of the navigation state too: Today, Proof, and
 * Connections share /dashboard and switch through ?view=..., so watching only
 * pathname would leave those transitions without an entrance animation.
 */
export function GlobalMotion({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="lm-global-motion-root">{children}</div>}>
      <GlobalMotionContent>{children}</GlobalMotionContent>
    </Suspense>
  );
}

function GlobalMotionContent({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigationKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.classList.remove("lm-route-enter");
    // Force a style boundary so the entrance animation can replay on navigation.
    void root.offsetWidth;
    root.classList.add("lm-route-enter");

    return () => root.classList.remove("lm-route-enter");
  }, [navigationKey]);

  return (
    <div ref={rootRef} className="lm-global-motion-root">
      {children}
    </div>
  );
}
