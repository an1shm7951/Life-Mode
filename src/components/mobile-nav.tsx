"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Today", icon: "⌂" },
  { href: "/dashboard?view=proof", label: "Proof", icon: "◈" },
  { href: "/planning", label: "Plan", icon: "▦" },
  { href: "/dashboard?view=connections", label: "Connections", icon: "◎" },
  { href: "/subscription", label: "Plus", icon: "+" },
];

function NavigationItems({ pathname, view }: { pathname: string; view: string }) {
  return (
    <>
      {items.map((item) => {
        const active = item.href === "/dashboard"
          ? pathname === "/dashboard" && !view
          : item.href.startsWith("/dashboard?")
            ? pathname === "/dashboard" && view === new URLSearchParams(item.href.split("?")[1]).get("view")
            : pathname === item.href;
        return (
          <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={active ? "mobile-nav-item is-active" : "mobile-nav-item"}>
            <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

export function MobileNav() {
  return (
    <Suspense fallback={<nav aria-label="Primary navigation" className="mobile-nav">{items.map(item => <Link key={item.label} href={item.href} className="mobile-nav-item"><span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span><span className="mobile-nav-label">{item.label}</span></Link>)}</nav>}>
      <MobileNavContent />
    </Suspense>
  );
}

function MobileNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "";
  return <nav aria-label="Primary navigation" className="mobile-nav"><NavigationItems pathname={pathname} view={view} /></nav>;
}
