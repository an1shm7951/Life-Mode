"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  { href: "/dashboard", label: "Today" },
  { href: "/dashboard?view=proof", label: "Proof" },
  { href: "/planning", label: "Plan" },
  { href: "/dashboard?view=connections", label: "Connections" },
  { href: "/subscription", label: "Plus" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [view, setView] = useState("");
  useEffect(() => {
    const syncView = () => setView(new URLSearchParams(window.location.search).get("view") ?? "");
    syncView();
    window.addEventListener("popstate", syncView);
    return () => window.removeEventListener("popstate", syncView);
  }, [pathname]);

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
