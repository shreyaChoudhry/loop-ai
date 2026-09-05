"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    roles: ["ADMIN", "ANALYST", "VIEWER"],
  },
  {
    name: "Inbox",
    href: "/dashboard/inbox",
    badge: "120",
    roles: ["ADMIN", "ANALYST", "VIEWER"],
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    roles: ["ADMIN", "ANALYST"],
  },
  {
    name: "Themes",
    href: "/dashboard/themes",
    roles: ["ADMIN", "ANALYST", "VIEWER"],
  },
  {
    name: "Ask LOOP",
    href: "/dashboard/ask-loop",
    roles: ["ADMIN", "ANALYST"],
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    roles: ["ADMIN", "ANALYST"],
  },
  {
    name: "Members",
    href: "/dashboard/members",
    roles: ["ADMIN"],
  },
  {
    name: "Settings",
    href: "/settings/users",
    roles: ["ADMIN"],
  },
];

type SidebarNavProps = {
  role?: string;
};

export default function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(role ?? "")
  );

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {visibleItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" &&
            pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
              isActive
                ? "bg-violet-600 text-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>{item.name}</span>

            {item.badge && (
              <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-xs">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}