"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Today", active: (path: string) => path === "/dashboard" },
  { href: "/dashboard?view=proof", label: "Proof", active: (path: string) => path === "/dashboard" && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("view") === "proof" },
  { href: "/planning", label: "Plan", active: (path: string) => path === "/planning" },
  { href: "/dashboard?view=connections", label: "Connections", active: (path: string) => path === "/dashboard" && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("view") === "connections" },
  { href: "/subscription", label: "Plus", active: (path: string) => path === "/subscription" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary navigation" className="mobile-nav lg:hidden">
      {items.map((item) => {
        const active = item.active(pathname);
        return (
          <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={active ? "mobile-nav-item is-active" : "mobile-nav-item"}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
