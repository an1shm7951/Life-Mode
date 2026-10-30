"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const items = [
  { href: "/discover", label: "Discover" },
  { href: "/dashboard#goals", label: "Goals" },
  { href: "/planning", label: "Plan" },
  { href: "/buddy", label: "AI Buddy" },
  { href: "/dashboard?view=connections", label: "Connections" },
  { href: "/subscription", label: "Plus" },
];

export function MobileNav() {
  return (
    <Suspense fallback={<nav aria-label="Primary navigation" className="mobile-nav lg:hidden">{items.map(item => <Link key={item.label} href={item.href} className="mobile-nav-item">{item.label}</Link>)}</nav>}>
      <MobileNavContent />
    </Suspense>
  );
}

function MobileNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "";

  return (
    <nav aria-label="Primary navigation" className="mobile-nav lg:hidden">
      {items.map((item) => {
        const active = item.href === "/dashboard#goals"
          ? pathname === "/dashboard" && (!view || view === "today")
          : item.href === "/dashboard?view=connections"
            ? pathname === "/dashboard" && view === "connections"
            : pathname === item.href || (item.href === "/discover" && pathname.startsWith("/discover"));
        return (
          <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={active ? "mobile-nav-item is-active" : "mobile-nav-item"}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
