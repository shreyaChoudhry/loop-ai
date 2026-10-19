"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

type TopbarProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  workspaceSlug?: string;
};

export default function Topbar({ user, workspaceSlug = "acme-demo" }: TopbarProps) {
  const pathname = usePathname();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("Feature");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Derive page title for breadcrumb
  const pageName = (() => {
    if (pathname.includes("/prioritization")) return "Evidence-Based Prioritization";
    if (pathname.includes("/inbox")) return "Feedback Inbox";
    if (pathname.includes("/roadmap")) return "Roadmap";
    if (pathname.includes("/analytics")) return "Analytics";
    if (pathname.includes("/themes")) return "AI Themes";
    if (pathname.includes("/ask")) return "Ask LOOP";
    if (pathname.includes("/reports")) return "VoC Reports";
    if (pathname.includes("/members")) return "Team Members";
    if (pathname.includes("/settings")) return "Settings";
    return "Overview";
  })();

  const initial = (user?.name?.charAt(0) || "A").toUpperCase();

  async function handleQuickFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedbackContent.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: feedbackContent,
          category: feedbackCategory,
          source: "WEBSITE",
        }),
      });

      if (res.ok) {
        setFeedbackSuccess(true);
        setFeedbackContent("");
        setTimeout(() => {
          setFeedbackSuccess(false);
          setShowFeedbackModal(false);
        }, 1200);
      } else {
        alert("Failed to submit feedback.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-6">
        {/* Left Breadcrumb & Environment Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="hover:text-slate-800 transition">Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold">{pageName}</span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-cyan-50 border border-cyan-200/60 px-2.5 py-0.5 text-[10px] font-medium text-cyan-700">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
            Production
          </span>
        </div>

        {/* Center Search Input */}
        <div className="hidden lg:flex items-center w-80 xl:w-96">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search feedback, ideas, themes, or command"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-10 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500 transition"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-2.5">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* View Live Portal */}
          <Link
            href={`/portal/${workspaceSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
          >
            <span>View Live Portal</span>
            <span className="text-[11px] text-slate-400">↗</span>
          </Link>

          {/* + New Feedback button */}
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:shadow transition"
          >
            <span>+</span>
            <span>New Feedback</span>
          </button>

          {/* Notifications bell */}
          <button
            title="Notifications"
            className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-purple-600 ring-2 ring-white" />
          </button>

          {/* User Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
            {initial}
          </div>
        </div>
      </header>

      {/* Quick Add Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Customer Feedback</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="my-6 rounded-xl bg-emerald-50 p-4 text-center text-xs font-semibold text-emerald-800">
                ✓ Feedback submitted successfully! Synthesizing insights...
              </div>
            ) : (
              <form onSubmit={handleQuickFeedbackSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Customer Quote or Feedback
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    placeholder="Paste user comment, Intercom message, or customer request..."
                    required
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Domain / Category
                  </label>
                  <select
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-700 outline-none focus:border-purple-500"
                  >
                    <option value="Billing">Billing & Stripe</option>
                    <option value="API & Webhooks">API & Webhooks</option>
                    <option value="Integrations">Integrations (Linear, Jira, Slack)</option>
                    <option value="Core UX">Core UX & Performance</option>
                    <option value="Feature">General Feature Request</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Feedback"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}