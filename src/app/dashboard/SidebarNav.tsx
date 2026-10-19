"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  name: string;
  href: string;
  icon: string;
  badge?: string;
  roles: string[];
  external?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type SidebarNavProps = {
  role?: string;
  workspaceSlug?: string;
  feedbackCount?: number;
};

export default function SidebarNav({
  role = "VIEWER",
  workspaceSlug = "acme-demo",
  feedbackCount,
}: SidebarNavProps) {
  const pathname = usePathname();

  const sections: NavSection[] = [
    {
      title: "MAIN",
      items: [
        {
          name: "Overview",
          href: "/dashboard",
          icon: "grid",
          roles: ["ADMIN", "ANALYST", "VIEWER"],
        },
        {
          name: "Inbox",
          href: "/dashboard/inbox",
          icon: "inbox",
          badge: feedbackCount ? String(feedbackCount) : "128",
          roles: ["ADMIN", "ANALYST", "VIEWER"],
        },
        {
          name: "Roadmap",
          href: "/dashboard/roadmap",
          icon: "kanban",
          roles: ["ADMIN", "ANALYST", "VIEWER"],
        },
        {
          name: "Prioritization",
          href: "/dashboard/prioritization",
          icon: "sliders",
          badge: "Algorithmic",
          roles: ["ADMIN", "ANALYST"],
        },
        {
          name: "Analytics",
          href: "/dashboard/analytics",
          icon: "chart",
          roles: ["ADMIN", "ANALYST"],
        },
      ],
    },
    {
      title: "INTELLIGENCE",
      items: [
        {
          name: "AI Themes",
          href: "/dashboard/themes",
          icon: "sparkles",
          roles: ["ADMIN", "ANALYST", "VIEWER"],
        },
        {
          name: "Ask LOOP",
          href: "/dashboard/ask",
          icon: "chat-ai",
          badge: "AI",
          roles: ["ADMIN", "ANALYST"],
        },
        {
          name: "VoC Reports",
          href: "/dashboard/reports",
          icon: "document",
          roles: ["ADMIN", "ANALYST"],
        },
      ],
    },
    {
      title: "PORTAL & CONFIG",
      items: [
        {
          name: "Public Portal",
          href: `/portal/${workspaceSlug}`,
          icon: "globe",
          external: true,
          roles: ["ADMIN", "ANALYST", "VIEWER"],
        },
        {
          name: "Team Members",
          href: "/dashboard/members",
          icon: "users",
          roles: ["ADMIN"],
        },
        {
          name: "Settings",
          href: "/dashboard/settings",
          icon: "gear",
          roles: ["ADMIN"],
        },
      ],
    },
  ];

  function renderIcon(icon: string) {
    switch (icon) {
      case "grid":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        );
      case "inbox":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        );
      case "kanban":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        );
      case "sliders":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        );
      case "chart":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case "sparkles":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case "chat-ai":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        );
      case "document":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "globe":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        );
      case "users":
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case "gear":
      default:
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const visibleItems = section.items.filter((item) =>
          item.roles.includes(role)
        );

        if (visibleItems.length === 0) return null;

        return (
          <div key={section.title}>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {section.title}
            </div>

            <nav className="flex flex-col gap-1">
              {visibleItems.map((item) => {
                const isActive =
                  !item.external &&
                  (pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href)));

                const content = (
                  <div
                    className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition duration-150 ${
                      isActive
                        ? "bg-purple-600/90 text-white font-semibold shadow-glow-sm"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-purple-300 transition"}`}>
                        {renderIcon(item.icon)}
                      </span>
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : item.badge === "Algorithmic"
                            ? "bg-purple-900/40 text-purple-300 border border-purple-500/30"
                            : item.badge === "AI"
                            ? "bg-purple-600/40 text-purple-200 border border-purple-500/30"
                            : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                );

                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <Link key={item.href} href={item.href}>
                    {content}
                  </Link>
                );
              })}
            </nav>
          </div>
        );
      })}
    </div>
  );
}