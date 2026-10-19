"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import SidebarNav from "./SidebarNav";
import LoopLogo from "@/components/LoopLogo";

type UserSession = {
  name?: string | null;
  email?: string | null;
  role?: string;
};

type SidebarProps = {
  user?: UserSession;
  workspaceName?: string;
  workspaceSlug?: string;
  feedbackCount?: number;
};

export default function Sidebar({
  user,
  workspaceName = "Acme SaaS",
  workspaceSlug = "acme-demo",
  feedbackCount = 128,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const displayName = user?.name || "Alex Rivera";
  const displayEmail = user?.email || "alex@acme.com";
  const displayRole = user?.role ? (user.role.charAt(0) + user.role.slice(1).toLowerCase()) : "Admin";
  const initial = (displayName.charAt(0) || "A").toUpperCase();

  // Quota calculation (e.g., feedbackCount vs 200 plan limit)
  const quotaLimit = 200;
  const quotaPercent = Math.min(100, Math.round(((feedbackCount || 128) / quotaLimit) * 100));

  return (
    <>
      {/* Mobile Top Header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#0B1026] px-4 text-white md:hidden">
        <div className="flex items-center gap-2">
          <LoopLogo variant="sidebar" href="/dashboard" showTagline={false} badge="v1.0" />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white transition"
          aria-label="Open navigation"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[#1B2244] bg-[#0B1026] text-white transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
          <LoopLogo variant="sidebar" href="/dashboard" showTagline={false} badge="v1.0" priority />

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* Workspace Switcher Pill */}
        <div className="px-3 pt-4 pb-2">
          <div
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10 hover:border-purple-500/30 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-xs font-black text-white shadow-sm">
                {workspaceName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-white truncate max-w-[115px]">
                  {workspaceName}
                </span>
                <span className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Neon DB • US-East
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-400">⌄</span>
          </div>

          {/* Simple Workspace Dropdown menu */}
          {workspaceMenuOpen && (
            <div className="mt-2 rounded-xl border border-purple-500/30 bg-[#0E1538] p-2 shadow-xl space-y-1 text-xs">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">Current Workspace</div>
              <div className="rounded-lg bg-purple-900/40 px-2 py-1.5 text-white font-medium flex items-center justify-between">
                <span>{workspaceName}</span>
                <span className="text-emerald-400 text-[10px]">Active</span>
              </div>
              <div className="border-t border-white/10 pt-1 text-[11px] text-slate-400 px-2 py-1">
                Connected to Postgres Pool
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div
          className="flex-1 overflow-y-auto px-3 py-2"
          onClick={() => setMobileOpen(false)}
        >
          <SidebarNav
            role={user?.role}
            workspaceSlug={workspaceSlug}
            feedbackCount={feedbackCount}
          />
        </div>

        {/* Bottom User Profile & Quota */}
        <div className="border-t border-white/5 bg-[#070A1E]/80 p-3.5 space-y-3">
          {/* User Profile Card */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow-glow-sm">
                {initial}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{displayName}</span>
                  <span className="rounded bg-purple-500/30 px-1.5 py-0.2 text-[9px] font-semibold text-purple-300">
                    {displayRole}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                  {displayEmail}
                </span>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Quota Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Quota (Feedback)</span>
              <span className="font-semibold text-slate-300">{quotaPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 transition-all duration-300 shadow-glow-sm"
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}