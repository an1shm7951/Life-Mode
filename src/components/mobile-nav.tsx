"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Today" },
  { href: "/dashboard?view=proof", label: "Proof" },
  { href: "/planning", label: "Plan" },
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
        const active = item.href === "/dashboard"
          ? pathname === "/dashboard" && !view
          : item.href.startsWith("/dashboard?")
            ? pathname === "/dashboard" && view === new URLSearchParams(item.href.split("?")[1]).get("view")
            : pathname === item.href;
        return (
          <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={active ? "mobile-nav-item is-active" : "mobile-nav-item"}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
