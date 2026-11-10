"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const primaryItems = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/goals/daily", label: "Goals", icon: "◎" },
  { href: "/planning", label: "Plan", icon: "▦" },
  { href: "/buddy", label: "AI", icon: "✧" },
];

const moreItems = [
  { href: "/dashboard?view=proof", label: "Proof" },
  { href: "/discover", label: "Discover" },
  { href: "/dashboard?view=connections", label: "Connections" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export function MobileNav() {
  return (
    <Suspense fallback={<nav aria-label="Primary navigation" className="mobile-nav lg:hidden" />}>
      <MobileNavContent />
    </Suspense>
  );
}

function MobileNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "";
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = pathname === "/discover" || pathname === "/profile" || pathname === "/settings" || view === "proof" || view === "connections";

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard" && !view;
    if (href === "/goals/daily") return pathname.startsWith("/goals");
    if (href === "/planning") return pathname === "/planning";
    if (href === "/buddy") return pathname === "/buddy";
    return false;
  }

  return (
    <>
      {moreOpen ? (
        <button
          type="button"
          aria-label="Close more navigation"
          className="mobile-more-backdrop"
          onClick={() => setMoreOpen(false)}
        />
      ) : null}
      {moreOpen ? (
        <div className="mobile-more-menu" role="menu" aria-label="More LifeMode pages">
          {moreItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setMoreOpen(false)}
              className="mobile-more-link"
            >
              <span>{item.label}</span><span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      ) : null}
      <nav aria-label="Primary navigation" className="mobile-nav lg:hidden">
        {primaryItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={isActive(item.href) ? "mobile-nav-item is-active" : "mobile-nav-item"}
          >
            <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
          </Link>
        ))}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          onClick={() => setMoreOpen((open) => !open)}
          className={moreOpen || isMoreActive ? "mobile-nav-item is-active" : "mobile-nav-item"}
        >
          <span className="mobile-nav-icon" aria-hidden="true">{moreOpen ? "×" : "＋"}</span><span>More</span>
        </button>
      </nav>
    </>
  );
}
