"use client";

import { useState } from "react";
import Link from "next/link";
import LoopLogo from "@/components/LoopLogo";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "signals" | "roadmap">("overview");
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState("SaaS Core Pro");
  const [jiraCreated, setJiraCreated] = useState(false);

  return (
    <main className="min-h-screen bg-[#070814] text-white selection:bg-purple-600 selection:text-white relative overflow-hidden">
      {/* BACKGROUND COSMIC LIGHT BLOOMS */}
      <div 
        className="pointer-events-none absolute -top-40 right-[-10%] h-[750px] w-[750px] rounded-full blur-[140px] opacity-40"
        style={{ background: "radial-gradient(circle, #A855F7 0%, #D946EF 45%, transparent 70%)" }}
      />
      <div 
        className="pointer-events-none absolute top-[30%] -left-48 h-[600px] w-[600px] rounded-full blur-[160px] opacity-25"
        style={{ background: "radial-gradient(circle, #8B2CFC 0%, #3B82F6 50%, transparent 70%)" }}
      />
      <div 
        className="pointer-events-none absolute bottom-0 right-[20%] h-[500px] w-[500px] rounded-full blur-[150px] opacity-20"
        style={{ background: "radial-gradient(circle, #06B6D4 0%, #8B2CFC 60%, transparent 70%)" }}
      />

      {/* TOP NAVBAR */}
      <nav className="relative z-30 border-b border-white/5 bg-[#070814]/70 backdrop-blur-xl sticky top-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo with Stitch-nav style */}
          <div className="flex items-center gap-3">
            <LoopLogo variant="stitch-nav" badge="AI 2.5" href="/" priority />
          </div>

          {/* Navigation Links */}
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-300 lg:flex">
            <a href="#features" className="transition hover:text-white">Product</a>
            <a href="#workflow" className="transition hover:text-white">Solutions</a>
            <a href="#preview" className="transition hover:text-white">Features</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#resources" className="transition hover:text-white">Resources</a>
            <Link href="/portal/acme-demo" className="transition hover:text-white text-purple-300">
              Changelog
            </Link>
          </div>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-300 hover:text-white transition"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8B2CFC] to-[#D946EF] px-5 py-2 text-sm font-semibold text-white shadow-glow-sm hover:shadow-glow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Free Trial</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-20 pt-16 pb-20 px-6 sm:px-8">
        <div className="mx-auto max-w-5xl text-center">
          {/* Announcement Floating Pill */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-purple-500/30 bg-purple-950/40 px-4 py-1.5 text-xs font-medium text-purple-200 backdrop-blur-md shadow-glow-sm hover:border-purple-400/50 transition cursor-pointer">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>✨ New: Autonomous AI Feedback Clustering & Jira Sync</span>
            <span className="text-purple-400">›</span>
          </div>

          {/* Main Headline */}
          <h1 className="mt-8 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
            Simplify how your{" "}
            <span className="bg-gradient-to-r from-[#E879F9] via-[#C084FC] to-[#38BDF8] bg-clip-text text-transparent">
              Team
            </span>{" "}
            gets
            <br />
            work done
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            A powerful collaboration platform designed to keep your team aligned,
            synthesize incoming user signals, and ship product roadmaps with confidence.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8B2CFC] via-[#A855F7] to-[#D946EF] px-8 py-3.5 text-sm sm:text-base font-semibold text-white shadow-glow-md hover:shadow-glow-lg transition-all duration-200 hover:scale-[1.03]"
            >
              <span>Start your 14-day free trial</span>
              <span>→</span>
            </Link>

            <button
              onClick={() => setShowDemoModal(true)}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-7 py-3.5 text-sm sm:text-base font-medium text-white backdrop-blur-md transition-all hover:border-white/30"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                ▶
              </span>
              <span>Watch product demo (2 min)</span>
            </button>
          </div>

          {/* 4 STAT METRICS CARDS */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#0B1026]/80 p-5 backdrop-blur-md shadow-lg text-center transition hover:border-purple-500/30">
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">50K+</div>
              <div className="mt-1 text-xs sm:text-sm text-slate-400">Teams worldwide</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0B1026]/80 p-5 backdrop-blur-md shadow-lg text-center transition hover:border-purple-500/30">
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">99.9%</div>
              <div className="mt-1 text-xs sm:text-sm text-slate-400">Reliable uptime</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0B1026]/80 p-5 backdrop-blur-md shadow-lg text-center transition hover:border-purple-500/30">
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">4.8/5</div>
              <div className="mt-1 text-xs sm:text-sm text-slate-400">Customer satisfaction</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0B1026]/80 p-5 backdrop-blur-md shadow-lg text-center transition hover:border-purple-500/30">
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">$42M+</div>
              <div className="mt-1 text-xs sm:text-sm text-slate-400">Backlog prioritized</div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DASHBOARD PREVIEW (EXACT GOOGLE STITCH MOCKUP) */}
      <section id="preview" className="relative z-20 pb-28 px-4 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="relative rounded-3xl border border-purple-500/20 bg-[#0B1026]/90 p-3 sm:p-5 shadow-2xl backdrop-blur-2xl shadow-purple-950/50">
            {/* Window Topbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 px-2">
              <div className="flex items-center gap-3">
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
                  <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
                  <span className="h-3 w-3 rounded-full bg-[#10B981]" />
                </div>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <span className="text-xs font-mono text-slate-300">LOOP Enterprise Cloud // v2.4</span>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Realtime Sync Active
                </span>
              </div>

              {/* Center Navigation Tabs */}
              <div className="flex items-center rounded-full bg-white/5 p-1 border border-white/10">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    activeTab === "overview"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("signals")}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    activeTab === "signals"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Live Signals
                </button>
                <button
                  onClick={() => setActiveTab("roadmap")}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    activeTab === "roadmap"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  AI Roadmap
                </button>
              </div>

              {/* Search Bar */}
              <div className="hidden md:flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 border border-white/10 text-xs text-slate-400 w-56">
                <span>🔍</span>
                <span>Search 14,200 feedback vectors...</span>
              </div>
            </div>

            {/* Inner Dashboard Grid */}
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Mini Left Sidebar */}
              <div className="lg:col-span-3 flex flex-col justify-between rounded-2xl bg-[#070B1E]/70 border border-white/5 p-4">
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-3">
                    Workspaces
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { name: "SaaS Core Pro", live: true },
                      { name: "Mobile App V3", live: false },
                      { name: "Growth Onboarding", live: false },
                    ].map((ws) => (
                      <button
                        key={ws.name}
                        onClick={() => setSelectedWorkspace(ws.name)}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition text-left ${
                          selectedWorkspace === ws.name
                            ? "bg-purple-900/50 text-white border border-purple-500/30"
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${selectedWorkspace === ws.name ? "bg-purple-400" : "bg-slate-600"}`} />
                          {ws.name}
                        </span>
                        {ws.live && (
                          <span className="rounded-md bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
                            Live
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Roadmap Alert Card */}
                <div className="mt-6 rounded-xl border border-purple-500/30 bg-purple-950/40 p-3.5 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                    <span>★</span>
                    <span>AI Roadmap Alert</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-300 leading-snug">
                    47 enterprise requests clustered into &ldquo;Slack Notifications&rdquo;. Estimated MRR protection: <span className="font-semibold text-emerald-400">+$14,200/mo</span>.
                  </p>
                  <button
                    onClick={() => setJiraCreated(true)}
                    className="mt-3 w-full rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:opacity-90 transition"
                  >
                    {jiraCreated ? "✓ Jira Issue #LOOP-381 Synced" : "Create Jira Issue"}
                  </button>
                </div>
              </div>

              {/* Main Preview Area */}
              <div className="lg:col-span-9 space-y-5">
                {/* 3 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="rounded-2xl border border-white/5 bg-[#0F1535]/80 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Tracked ARR Impact</span>
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                        +24.2%
                      </span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white tracking-tight">$87,432</div>
                    <div className="mt-1 text-[11px] text-slate-400">+$12,400 from last month</div>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-[#0F1535]/80 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Active Sentiment Users</span>
                      <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400">
                        +32.6%
                      </span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white tracking-tight">16,100</div>
                    <div className="mt-1 text-[11px] text-slate-400">1,940 active this week</div>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-[#0F1535]/80 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Backlog Churn Deficit</span>
                      <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">
                        -4.8%
                      </span>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white tracking-tight">0.5%</div>
                    <div className="mt-1 text-[11px] text-slate-400">Historically low churn index</div>
                  </div>
                </div>

                {/* Main Feature Demand Velocity Chart */}
                <div className="rounded-2xl border border-white/5 bg-[#0F1535]/80 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">Feature Demand Velocity & AI Sentiment</h3>
                      <p className="text-[11px] text-slate-400">Synthesized from Intercom, Zendesk, Discord & Jira</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5 text-purple-300">
                        <span className="h-2 w-2 rounded-sm bg-purple-500" />
                        Positive Feedback
                      </span>
                      <span className="flex items-center gap-1.5 text-cyan-300">
                        <span className="h-2 w-2 rounded-sm bg-cyan-400" />
                        Feature Shipped
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar Chart */}
                  <div className="mt-6 flex h-40 items-end justify-between gap-2 sm:gap-4 px-2">
                    {[
                      { month: "Jan", height: 38, shipped: false },
                      { month: "Feb", height: 52, shipped: false },
                      { month: "Mar", height: 68, shipped: false },
                      { month: "Apr", height: 60, shipped: false },
                      { month: "May", height: 85, shipped: true },
                      { month: "Jun", height: 64, shipped: false },
                      { month: "Jul (Peak)", height: 100, shipped: true },
                    ].map((bar) => (
                      <div key={bar.month} className="group relative flex flex-1 flex-col items-center">
                        <div
                          className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 group-hover:scale-105 shadow-glow-sm ${
                            bar.shipped
                              ? "bg-gradient-to-t from-purple-600 via-fuchsia-500 to-cyan-400"
                              : "bg-gradient-to-t from-purple-800 to-purple-500"
                          }`}
                          style={{ height: `${bar.height}%` }}
                        />
                        <span className="mt-2 text-[10px] font-medium text-slate-400 group-hover:text-white transition">
                          {bar.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0F1535]/80 p-3.5 hover:border-purple-500/30 transition">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/20 text-xs font-bold text-purple-300 border border-purple-500/30">
                        AI
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">One-click SSO with Okta</div>
                        <div className="text-[10px] text-slate-400">128 votes • Priority High</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-medium text-purple-300 border border-purple-500/30">
                      Auto-Queued
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#0F1535]/80 p-3.5 hover:border-cyan-500/30 transition">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600/20 text-xs font-bold text-cyan-300 border border-cyan-500/30">
                        Jira
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Granular Role Permissions</div>
                        <div className="text-[10px] text-slate-400">94 votes • Sprint 44</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/30">
                      Shipped
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE WORKFLOW PILLARS */}
      <section id="workflow" className="relative z-20 border-t border-white/5 bg-[#060919] py-24 px-6 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              The Feedback-to-Roadmap Engine
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Turn scattered feedback into decisions you can defend.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
              Stop guessing what to build next. LOOP connects raw customer comments to an evidence-backed roadmap and closes the loop automatically.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/5 bg-[#0B1026]/70 p-6 backdrop-blur-md hover:border-purple-500/30 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-xl border border-purple-500/20">
                📥
              </div>
              <h3 className="mt-4 text-base font-bold text-white">1. Collect in One Place</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Import customer feedback via CSV or stream it live through incoming webhooks and website widgets.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0B1026]/70 p-6 backdrop-blur-md hover:border-purple-500/30 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-xl border border-purple-500/20">
                🔍
              </div>
              <h3 className="mt-4 text-base font-bold text-white">2. Detect Duplicates</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                AI and deterministic embeddings cluster similar ideas so you discover what customers really want without duplicate noise.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0B1026]/70 p-6 backdrop-blur-md hover:border-purple-500/30 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-xl border border-purple-500/20">
                📊
              </div>
              <h3 className="mt-4 text-base font-bold text-white">3. Evidence Prioritization</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Rank requests with transparent formulas factoring in customer upvotes, recency, related feedback, and effort.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0B1026]/70 p-6 backdrop-blur-md hover:border-purple-500/30 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-xl border border-purple-500/20">
                🚀
              </div>
              <h3 className="mt-4 text-base font-bold text-white">4. Close The Loop</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Publish a public roadmap, notify subscribed customers when ideas ship, and measure follow-up satisfaction.
              </p>
            </div>
          </div>

          {/* CTA BANNER */}
          <div className="mt-20 relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-r from-[#0E1438] via-[#1A1040] to-[#2B0E4E] p-10 sm:p-14 text-center shadow-2xl">
            <h3 className="text-3xl font-extrabold sm:text-4xl text-white">
              Ready to build what customers actually want?
            </h3>
            <p className="mt-4 max-w-xl mx-auto text-sm text-slate-300">
              Start gathering feedback, prioritizing with evidence, and publishing your public roadmap in minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 px-8 py-3.5 text-sm font-bold text-white shadow-glow-md hover:shadow-glow-lg transition hover:scale-105"
              >
                Create Your Workspace
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition backdrop-blur-md"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-20 border-t border-white/5 bg-[#070814] py-8 px-6 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-white">LOOP Inc.</span> © 2025 All rights reserved. Built for modern product teams.
          </div>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-white transition">Privacy Policy</a>
            <a href="#terms" className="hover:text-white transition">Terms of Service</a>
            <a href="#security" className="hover:text-white transition">Security Whitepaper</a>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Systems Normal
            </span>
          </div>
        </div>
      </footer>

      {/* INTERACTIVE DEMO MODAL */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-3xl rounded-3xl border border-purple-500/30 bg-[#0B1026] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs">▶</span>
                <h3 className="text-base font-bold text-white">Product Demo — LOOP AI Intelligence</h3>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 aspect-video w-full rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-[#070814] border border-white/10 flex flex-col items-center justify-center p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-glow-md">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="mt-4 text-lg font-bold text-white">Experience AI Feedback Synthesizing</h4>
              <p className="mt-2 max-w-md text-xs text-slate-300">
                In this walkthrough, see how LOOP automatically ingests thousands of customer comments, groups them into actionable themes, and ranks your roadmap with mathematical evidence.
              </p>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/register"
                  className="rounded-full bg-purple-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition shadow"
                >
                  Start Free Trial Now
                </Link>
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  Close Walkthrough
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}