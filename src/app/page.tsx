import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-[#111827]">
      {/* NAVBAR */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6655e8] text-white text-sm font-bold">
              ◉
            </div>
            <span className="text-xl font-bold tracking-tight">LOOP</span>
          </div>

          {/* Navigation */}
          <div className="hidden items-center gap-9 text-sm text-gray-700 md:flex">
            <button className="flex items-center gap-1">
              Product <span>⌄</span>
            </button>

            <button className="flex items-center gap-1">
              Solutions <span>⌄</span>
            </button>

            <button className="flex items-center gap-1">
              Resources <span>⌄</span>
            </button>

            <span>Pricing</span>

            <button className="flex items-center gap-1">
              Company <span>⌄</span>
            </button>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Log in
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-[#6655e8] px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#5847d8]"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="overflow-hidden bg-gradient-to-br from-white via-white to-[#f3efff]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-8 py-20 lg:grid-cols-2">
          {/* LEFT */}
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#bdb3ff] bg-white px-4 py-2 text-xs font-medium text-[#5b4bdc]">
              ✨ AI-POWERED CUSTOMER FEEDBACK INTELLIGENCE
            </div>

            <h1 className="max-w-xl text-5xl font-bold leading-[1.08] tracking-tight md:text-6xl">
              Turn Customer
              <br />
              Feedback into
              <br />
              <span className="bg-gradient-to-r from-[#6555e8] to-[#8b5cf6] bg-clip-text text-transparent">
                Product Decisions.
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-lg leading-8 text-gray-600">
              LOOP analyzes feedback from all your channels using AI to
              uncover insights, trends, and themes that help you build what
              customers love.
            </p>

            <div className="mt-8 flex gap-4">
              <Link
                href="/register"
                className="rounded-lg bg-[#6655e8] px-7 py-3.5 font-semibold text-white shadow-lg shadow-purple-200 hover:bg-[#5847d8]"
              >
                Start Free
              </Link>

              <button className="rounded-lg border border-gray-300 bg-white px-7 py-3.5 font-semibold hover:bg-gray-50">
                Book a Demo
              </button>
            </div>

            {/* PEOPLE */}
            <div className="mt-9 flex items-center gap-4">
              <div className="flex -space-x-2">
                {["S", "A", "R", "J", "M"].map((letter, index) => (
                  <div
                    key={index}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-purple-300 to-indigo-500 text-xs font-bold text-white"
                  >
                    {letter}
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-600">
                Join <b className="text-gray-900">1,000+</b> product teams
                <br />
                building better products
              </p>
            </div>

            {/* TRUSTED */}
            <div className="mt-10">
              <p className="mb-5 text-xs font-semibold tracking-wide text-gray-400">
                TRUSTED BY INNOVATIVE COMPANIES
              </p>

              <div className="flex flex-wrap items-center gap-7 text-sm font-bold text-gray-600">
                <span>◉ Linear</span>
                <span>▣ Notion</span>
                <span>▲ Vercel</span>
                <span>✚ ClickUp</span>
                <span>HubSpot</span>
                <span>miro</span>
              </div>
            </div>
          </div>

          {/* RIGHT DASHBOARD MOCKUP */}
          <div className="relative">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-purple-200/30 blur-3xl" />

            <div className="relative rounded-2xl border border-purple-100 bg-white p-3 shadow-2xl shadow-purple-200/50">
              {/* Fake browser/header */}
              <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-[#6655e8]" />
                  <span className="text-xs font-bold">LOOP</span>
                </div>

                <div className="h-7 w-48 rounded-md bg-gray-50 text-[10px] text-gray-400 flex items-center px-3">
                  Search feedback, themes, reports...
                </div>

                <div className="rounded-md border px-2 py-1 text-[10px]">
                  Upgrade
                </div>
              </div>

              <div className="grid grid-cols-[105px_1fr] gap-3">
                {/* SIDEBAR */}
                <div className="rounded-lg bg-[#101631] p-3 text-white">
                  <div className="mb-5 text-xs font-bold">Acme Inc.</div>

                  {[
                    "Dashboard",
                    "Inbox",
                    "Analytics",
                    "Themes",
                    "Ask LOOP",
                    "Reports",
                    "Members",
                    "Settings",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className={`mb-2 rounded-md px-2 py-2 text-[9px] ${
                        index === 0 ? "bg-[#6655e8]" : "text-gray-300"
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>

                {/* DASHBOARD */}
                <div>
                  <h3 className="text-sm font-bold">Welcome back, Jane! 👋</h3>
                  <p className="mt-1 text-[9px] text-gray-400">
                    Here's what's happening with your feedback today.
                  </p>

                  {/* STATS */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      ["24,532", "Total Feedback"],
                      ["68%", "Positive Sentiment"],
                      ["10%", "Negative Sentiment"],
                    ].map(([value, label]) => (
                      <div
                        key={label}
                        className="rounded-lg border p-3"
                      >
                        <p className="text-base font-bold">{value}</p>
                        <p className="mt-1 text-[8px] text-gray-400">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* CHARTS */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border p-3">
                      <p className="text-[9px] font-semibold">
                        Feedback Over Time
                      </p>

                      <div className="mt-4 flex h-24 items-end gap-1">
                        {[25, 35, 28, 55, 42, 70, 52, 85, 66].map(
                          (height, index) => (
                            <div
                              key={index}
                              className="flex-1 rounded-t bg-[#7665ed]"
                              style={{ height: `${height}%` }}
                            />
                          )
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border p-3">
                      <p className="text-[9px] font-semibold">
                        Sentiment Distribution
                      </p>

                      <div className="mt-4 flex items-center justify-center">
                        <div className="h-24 w-24 rounded-full border-[15px] border-[#6655e8] border-r-green-400 border-b-gray-200" />
                      </div>

                      <div className="mt-2 text-center text-[8px] text-gray-500">
                        68% Positive
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM CARDS */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border p-3">
                      <p className="text-[9px] font-semibold">
                        Trending Themes
                      </p>

                      <div className="mt-3 space-y-2 text-[8px]">
                        <div className="flex justify-between">
                          <span>Onboarding</span>
                          <b>2,431 ↑</b>
                        </div>
                        <div className="flex justify-between">
                          <span>Performance</span>
                          <b>1,987 ↑</b>
                        </div>
                        <div className="flex justify-between">
                          <span>Pricing</span>
                          <b>1,563 ↓</b>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-[#f6f3ff] p-3">
                      <p className="text-[9px] font-semibold text-purple-700">
                        AI Insight
                      </p>

                      <p className="mt-3 text-[9px] leading-4 text-gray-600">
                        Onboarding experience is receiving high praise this
                        week with a 32% increase in positive sentiment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING AI CARD */}
            <div className="absolute -bottom-7 -left-8 w-64 rounded-xl border border-purple-100 bg-white p-4 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs">
                  ✨
                </div>
                <div>
                  <p className="text-[10px] font-bold">LOOP AI</p>
                  <p className="text-[8px] text-gray-400">
                    What are customers saying?
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-end gap-1">
                {[20, 40, 25, 60, 45, 80].map((height, index) => (
                  <div
                    key={index}
                    className="w-3 rounded-t bg-[#7665ed]"
                    style={{ height: `${height / 2}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM STATS */}
        <div className="mx-auto max-w-7xl px-8 pb-12">
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border bg-white shadow-sm md:grid-cols-4">
            {[
              ["10M+", "Feedback Analyzed"],
              ["3,000+", "Active Workspaces"],
              ["98%", "Accuracy (AI)"],
              ["30+", "Integrations"],
            ].map(([number, label]) => (
              <div
                key={label}
                className="border-r border-gray-100 px-8 py-7 last:border-r-0"
              >
                <p className="text-2xl font-bold text-[#6655e8]">{number}</p>
                <p className="mt-1 text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}