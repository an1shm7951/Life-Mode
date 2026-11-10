"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const primaryItems = [
  { href: "/dashboard", label: "Today", icon: "◷", key: "today" },
  { href: "/dashboard?view=proof", label: "Proof", icon: "◇", key: "proof" },
  { href: "/planning", label: "Plan", icon: "▤", key: "plan" },
  { href: "/dashboard?view=connections", label: "Connections", icon: "⌘", key: "connections" },
  { href: "/subscription", label: "Plus", icon: "＋", key: "plus" },
];

const moreItems = [
  { href: "/discover", label: "Discover" },
  { href: "/stories", label: "Story Room" },
  { href: "/buddy", label: "AI Buddy" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export function MobileNav() {
  return (
    <Suspense fallback={<nav aria-label="Primary navigation" className="mobile-nav lm-floating-nav" />}>
      <MobileNavContent />
    </Suspense>
  );
}

function MobileNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "";
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname, view]);

  useEffect(() => {
    if (!moreOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moreOpen]);

  function isActive(key: string) {
    if (key === "today") return pathname === "/dashboard" && !view;
    if (key === "proof") return pathname === "/dashboard" && view === "proof";
    if (key === "plan") return pathname === "/planning";
    if (key === "connections") return pathname === "/dashboard" && view === "connections";
    if (key === "plus") return pathname === "/subscription";
    return false;
  }

  const moreActive = moreItems.some((item) =>
    item.href === "/stories" ? pathname.startsWith("/stories") :
    item.href === "/discover" ? pathname === "/discover" :
    pathname === item.href
  );

  return (
    <>
      <header className="lm-desktop-nav">
        <Link href="/dashboard" className="lm-desktop-brand">life<span>mode</span><i>.</i></Link>
        <nav aria-label="Desktop navigation" className="lm-desktop-links">
          {primaryItems.map((item) => (
            <Link key={item.key} href={item.href} aria-current={isActive(item.key) ? "page" : undefined} className={isActive(item.key) ? "is-active" : ""}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="lm-desktop-actions">
          <button type="button" className={moreOpen || moreActive ? "lm-more-trigger is-active" : "lm-more-trigger"} aria-expanded={moreOpen} aria-haspopup="menu" aria-controls="lifemode-more-menu" aria-label="More navigation" onClick={() => setMoreOpen((open) => !open)}>More <span aria-hidden="true">⌄</span></button>
        </div>
      </header>

      <header className="lm-tablet-nav">
        <Link href="/dashboard" className="lm-tablet-brand">life<span>mode</span><i>.</i></Link>
        <nav aria-label="Tablet navigation" className="lm-tablet-links">
          {primaryItems.map((item) => (
            <Link key={item.key} href={item.href} aria-current={isActive(item.key) ? "page" : undefined} className={isActive(item.key) ? "is-active" : ""}>
              <span aria-hidden="true">{item.icon}</span><small>{item.label}</small>
            </Link>
          ))}
        </nav>
        <button type="button" className={moreOpen || moreActive ? "lm-more-trigger is-active" : "lm-more-trigger"} aria-expanded={moreOpen} aria-haspopup="menu" onClick={() => setMoreOpen((open) => !open)}>Explore <span aria-hidden="true">⌄</span></button>
      </header>

      <button type="button" className={moreOpen || moreActive ? "lm-mobile-more-trigger is-active" : "lm-mobile-more-trigger"} aria-expanded={moreOpen} aria-haspopup="menu" onClick={() => setMoreOpen((open) => !open)}>
        Explore <span aria-hidden="true">⌄</span>
      </button>

      {moreOpen ? (
        <>
          <button type="button" aria-label="Close Explore menu" className="mobile-more-backdrop lm-more-backdrop" onClick={() => setMoreOpen(false)} />
          <div id="lifemode-more-menu" className="mobile-more-menu lm-more-menu" role="menu" aria-label="More LifeMode pages">
            {moreItems.map((item) => (
              <Link key={item.href} href={item.href} role="menuitem" onClick={() => setMoreOpen(false)} aria-current={(item.href === "/stories" ? pathname.startsWith("/stories") : pathname === item.href) ? "page" : undefined} className="mobile-more-link lm-more-link">
                <span>{item.label}</span><span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <nav aria-label="Primary navigation" className="mobile-nav lm-floating-nav">
        {primaryItems.map((item) => (
          <Link key={item.key} href={item.href} aria-current={isActive(item.key) ? "page" : undefined} className={isActive(item.key) ? "mobile-nav-item lm-floating-nav-item is-active" : "mobile-nav-item lm-floating-nav-item"}>
            <span className="mobile-nav-icon lm-floating-nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
