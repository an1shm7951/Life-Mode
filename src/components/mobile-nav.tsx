"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Today" },
  { href: "/goals/daily", label: "Daily" },
  { href: "/goals/short-term", label: "Short-term" },
  { href: "/goals/long-term", label: "Long-term" },
  { href: "/subscription", label: "Plus" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary navigation"
      className="mobile-nav lg:hidden"
    >
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={active ? "mobile-nav-item is-active" : "mobile-nav-item"}
          >
            {item.label}
          </Link>
        );
      })}

    </nav>
  );
}
