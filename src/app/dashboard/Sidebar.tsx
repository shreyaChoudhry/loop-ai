"use client";

import { useState } from "react";
import SidebarNav from "./SidebarNav";

type SidebarProps = {
  role?: string;
};

export default function Sidebar({ role }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between bg-[#0b1026] px-4 text-white md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-sm font-bold">
            ◉
          </div>

          <span className="text-xl font-bold tracking-wide">LOOP</span>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-white"
          aria-label="Open navigation"
        >
          ☰
        </button>
      </header>

      {/* Mobile Overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-[#0b1026] px-4 py-5 text-white transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-sm font-bold">
              ◉
            </div>

            <span className="text-xl font-bold tracking-wide">LOOP</span>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* Workspace */}
        <div className="mb-6 rounded-lg bg-white/10 px-3 py-3">
          <p className="text-xs text-gray-400">WORKSPACE</p>

          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-medium">Acme Inc.</span>

            <span className="text-xs text-gray-400">▼</span>
          </div>
        </div>

        {/* Navigation */}
        <div onClick={() => setOpen(false)}>
          <SidebarNav role={role} />
        </div>

        {/* Bottom */}
        <div className="mt-auto border-t border-white/10 pt-4">
          <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-400 hover:bg-white/10 hover:text-white">
            ? &nbsp; Help & Support
          </button>
        </div>
      </aside>
    </>
  );
}