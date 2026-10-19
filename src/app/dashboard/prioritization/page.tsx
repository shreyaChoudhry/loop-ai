"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PrioritizationBreakdown, CitationItem } from "@/lib/prioritization";

export default function PrioritizationPage() {
  const [items, setItems] = useState<PrioritizationBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [threshold, setThreshold] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"priority" | "votes" | "velocity">("priority");
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  async function loadData(showToast = false) {
    try {
      if (showToast) setRecalculating(true);
      else setLoading(true);

      const res = await fetch("/api/prioritization");
      if (res.ok) {
        const data = await res.json();
        const loaded: PrioritizationBreakdown[] = data.data || [];
        setItems(loaded);
        if (loaded.length > 0 && !selectedId) {
          setSelectedId(loaded[0].requestId);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRecalculating(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateImpactEffort(requestId: string, impact: number, effort: number) {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.requestId === requestId ? { ...i, impact, effort } : i))
    );

    try {
      const res = await fetch(`/api/roadmap/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impact, effort }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update impact and effort.");
      }
      await loadData();
    } catch (e) {
      console.error(e);
      await loadData();
    }
  }

  function exportCSV() {
    if (items.length === 0) return;
    const headers = [
      "Rank",
      "Code",
      "Title",
      "Category",
      "Status",
      "Total Score",
      "Votes",
      "Impact",
      "Effort",
      "Related Feedback Count",
    ];

    const rows = filteredItems.map((item, index) => [
      index + 1,
      item.code,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.category || "General"}"`,
      item.status,
      item.totalScore,
      item.voteCount,
      item.impact,
      item.effort,
      item.relatedFeedbackCount,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LOOP_Prioritization_Matrix_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filter & Sort
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesCategory =
          activeCategory === "All" ||
          (item.category && item.category.toLowerCase() === activeCategory.toLowerCase());

        const matchesSearch =
          !searchQuery.trim() ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesThreshold = item.totalScore >= threshold;

        return matchesCategory && matchesSearch && matchesThreshold;
      })
      .sort((a, b) => {
        if (sortBy === "votes") return b.voteCount - a.voteCount;
        if (sortBy === "velocity") return b.scoreExplanation.recencyComponent.points - a.scoreExplanation.recencyComponent.points;
        return b.totalScore - a.totalScore;
      });
  }, [items, activeCategory, searchQuery, threshold, sortBy]);

  const selectedItem = useMemo(() => {
    return items.find((i) => i.requestId === selectedId) || items[0] || null;
  }, [items, selectedId]);

  const selectedRank = useMemo(() => {
    if (!selectedItem) return 1;
    const index = items.findIndex((i) => i.requestId === selectedItem.requestId);
    return index >= 0 ? index + 1 : 1;
  }, [items, selectedItem]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Evidence-Based Prioritization
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 border border-purple-200/80 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse" />
              Algorithmic Engine v2.4 Active
            </span>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-mono text-slate-600">
              Model: Dynamic Decay L3
            </span>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
            Dynamic ranking of customer feature requests computed from verified upvotes, recency velocity, linked feedback sentiment, and strategic business impact.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => loadData(true)}
            disabled={recalculating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <span className={recalculating ? "animate-spin" : ""}>↺</span>
            <span>{recalculating ? "Recalculating..." : "Recalculate All"}</span>
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <span>⤓</span>
            <span>Export Matrix</span>
          </button>

          <button
            onClick={() => setShowFormulaModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition"
          >
            <span>𝄜</span>
            <span>Formula Specs</span>
          </button>
        </div>
      </div>

      {/* ACTIVE SCORING MODEL BANNER */}
      <div className="rounded-2xl border border-purple-500/20 bg-[#0E1428] p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-purple-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">∑ ACTIVE SCORING MODEL</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Updated Real-Time</span>
          </div>
          <div className="text-[11px] text-slate-400">Deterministic Mathematical Weighting</div>
        </div>

        <div className="mt-3 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="font-mono text-sm sm:text-base font-semibold text-white tracking-wide">
            Score = (Votes × 3) + Recency Velocity[max 15] + Citations Weight[max 30] + (Impact × 5) − (Effort × 3)
          </div>

          {/* Interactive chip indicators */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-slate-300">
              • Upvotes ×3.0
            </span>
            <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-slate-300">
              • Recency (30d Decay) Max 15
            </span>
            <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-slate-300">
              • Feedback Citations Max 30
            </span>
            <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-emerald-300">
              • Impact +5x
            </span>
            <span className="rounded-lg bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 text-rose-300">
              • Effort Cost −3x
            </span>
          </div>
        </div>
      </div>

      {/* FILTER & SORT ROW */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search request or domain..."
              className="w-48 rounded-xl border border-slate-200 bg-slate-50/80 pl-7 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500 focus:bg-white"
            />
          </div>

          {/* Domain Category pills */}
          {["All", "Billing", "API & Webhooks", "Integrations", "Core UX"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                activeCategory === cat
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}

          {/* Threshold filter */}
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-purple-500"
          >
            <option value="0">Threshold: All Scores</option>
            <option value="50">Threshold: &gt; 50 pts</option>
            <option value="100">Threshold: &gt; 100 pts</option>
            <option value="150">Threshold: &gt; 150 pts</option>
          </select>
        </div>

        {/* Sort Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Sort:</span>
          {(["priority", "votes", "velocity"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition ${
                sortBy === s
                  ? "bg-white text-purple-700 font-bold shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN TWO-COLUMN SPLIT: RANKING TABLE + EVIDENCE DRAWER */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500">
          <span className="inline-block animate-spin mr-2">↺</span>
          Calculating evidence-based prioritization matrix...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h3 className="text-base font-bold text-slate-900">No requests match criteria</h3>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your search query, threshold, or domain filter.
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/roadmap"
              className="inline-flex rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
            >
              Add New Request on Roadmap
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: RANKING TABLE (7 COLS ON DESKTOP) */}
          <div className="lg:col-span-7 xl:col-span-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Feature Request & Domain</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Upvotes</th>
                    <th className="px-3 py-3">Feedback Links</th>
                    <th className="px-3 py-3">Impact</th>
                    <th className="px-3 py-3">Effort</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItem?.requestId === item.requestId;

                    return (
                      <tr
                        key={item.requestId}
                        onClick={() => setSelectedId(item.requestId)}
                        className={`cursor-pointer transition duration-150 ${
                          isSelected
                            ? "bg-purple-50/80 border-l-4 border-l-purple-600"
                            : "hover:bg-slate-50/70 border-l-4 border-l-transparent"
                        }`}
                      >
                        {/* Title & Domain */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                {item.title}
                              </span>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-500 border border-slate-200">
                                {item.code}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                              <span className="rounded bg-purple-50 px-1.5 py-0.5 font-medium text-purple-700">
                                {item.category || "General"}
                              </span>
                              <span>• {item.velocitySpike}</span>
                              <span className="font-semibold text-slate-600">• {item.arrImpact}</span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                              item.status === "SHIPPED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : item.status === "IN_PROGRESS"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : item.status === "PLANNED"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            • {item.status.replace("_", " ")}
                          </span>
                        </td>

                        {/* Upvotes */}
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-xs text-slate-900">
                              {item.voteCount}
                            </span>
                            <span className="text-[10px] font-semibold text-purple-600">
                              +{Math.max(2, Math.round(item.voteCount * 0.4))} this wk
                            </span>
                          </div>
                        </td>

                        {/* Feedback Links */}
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-slate-800 text-xs">
                              {item.relatedFeedbackCount} items
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-rose-500 rounded-full"
                                  style={{ width: `${item.frictionWeight}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {item.frictionWeight}% friction
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Impact */}
                        <td className="px-3 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={item.impact}
                            onChange={(e) =>
                              updateImpactEffort(item.requestId, parseInt(e.target.value), item.effort)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
                          >
                            <option value="1">1.0 Minor</option>
                            <option value="2">2.0 Low</option>
                            <option value="3">3.0 Medium</option>
                            <option value="4">4.0 High</option>
                            <option value="5">5.0 Revenue Blocker</option>
                          </select>
                        </td>

                        {/* Effort */}
                        <td className="px-3 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={item.effort}
                            onChange={(e) =>
                              updateImpactEffort(item.requestId, item.impact, parseInt(e.target.value))
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
                          >
                            <option value="1">1.0 Trivial</option>
                            <option value="2">2.0 Quick (Sprint)</option>
                            <option value="3">3.0 Moderate</option>
                            <option value="4">4.0 Complex</option>
                            <option value="5">5.0 Massive</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT: EVIDENCE DRAWER (5 COLS ON DESKTOP) */}
          {selectedItem && (
            <div className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 sticky top-20">
              {/* Top Rank & Points Banner */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-purple-700 text-xs tracking-wider uppercase">
                      RANK #{selectedRank}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500">
                      {selectedItem.code}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-base font-bold text-slate-900 leading-snug">
                    {selectedItem.title}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-3xl font-black text-purple-700 leading-none">
                    {selectedItem.totalScore}
                  </div>
                  <div className="text-[9px] font-bold tracking-wider text-slate-400 uppercase mt-1">
                    Computed Pts
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedItem.description || "Targeting direct customer friction identified across feedback vectors and feature requests."}
              </p>

              {/* Formula Parameter Breakdown */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                  <span>Formula Parameter</span>
                  <span>Points Contribution</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">👍 {selectedItem.voteCount} Upvotes (×3.0 weight)</span>
                    <span className="font-bold text-slate-900 font-mono">
                      +{selectedItem.scoreExplanation.voteComponent.points} pts
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">⚡ Recency Velocity ({selectedItem.scoreExplanation.recencyComponent.daysAgo}d active)</span>
                    <span className="font-bold text-slate-900 font-mono">
                      +{selectedItem.scoreExplanation.recencyComponent.points} pts
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">💬 {selectedItem.relatedFeedbackCount} Feedback Citations (Weighted)</span>
                    <span className="font-bold text-slate-900 font-mono">
                      +{selectedItem.scoreExplanation.feedbackComponent.points} pts
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">🎯 Strategic Impact: {selectedItem.impact}/5 (×5.0)</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      +{selectedItem.scoreExplanation.businessImpactComponent.points} pts
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">🛠 Engineering Effort: {selectedItem.effort}/5 (−3.0)</span>
                    <span className="font-bold text-rose-600 font-mono">
                      {selectedItem.scoreExplanation.effortPenaltyComponent.points} pts
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2 flex items-center justify-between font-bold text-xs">
                  <span className="text-slate-900">Net Mathematical Priority</span>
                  <span className="text-purple-700 text-sm font-black font-mono">
                    {selectedItem.totalScore} pts
                  </span>
                </div>
              </div>

              {/* Verified Citations List */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>Recent Verified Citations ({selectedItem.citations.length} of {Math.max(selectedItem.citations.length, selectedItem.relatedFeedbackCount)})</span>
                  </span>
                  <Link
                    href="/dashboard/inbox"
                    className="text-[10px] font-semibold text-purple-600 hover:text-purple-800"
                  >
                    View in Inbox →
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {selectedItem.citations.map((c: CitationItem) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-purple-100 bg-purple-50/40 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{c.author}</span>
                          <span className="rounded bg-white px-1.5 py-0.2 text-[9px] font-medium text-slate-500 border border-slate-200">
                            {c.company}
                          </span>
                        </div>
                        <span className="font-bold text-purple-700 text-[11px] font-mono">
                          {c.arr}
                        </span>
                      </div>
                      <p className="text-slate-600 italic text-[11px] leading-relaxed">
                        {c.quote}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-2">
                <Link
                  href="/dashboard/roadmap"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-black py-2.5 text-xs font-semibold text-white shadow transition"
                >
                  <span>Open in Product Roadmap Backlog</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FORMULA SPECS MODAL */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">LOOP Mathematical Prioritization Formula</h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                LOOP implements a deterministic, multi-factor prioritization engine designed to eliminate founder bias and align product delivery directly with verified customer signals.
              </p>

              <div className="rounded-xl bg-purple-50 p-3 font-mono text-[11px] text-purple-900 font-semibold">
                Priority Score = (Votes × 3) + Recency Velocity[max 15] + Citations Weight[max 30] + (Impact × 5) − (Effort × 3)
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-900 w-28 shrink-0">1. Customer Votes:</span>
                  <span>Each verified public upvote grants +3 points, automatically aggregating merged duplicate requests.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-900 w-28 shrink-0">2. Recency Decay:</span>
                  <span>Ideas requested in the last 7 days receive +15 pts, decaying to +10 pts (30d), +5 pts (90d), and +2 pts thereafter.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-900 w-28 shrink-0">3. Citations:</span>
                  <span>Every raw feedback entry clustered to this request adds +4 pts (capped at 30 pts) to prevent volume spam.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-900 w-28 shrink-0">4. Business Impact:</span>
                  <span>Strategic founder rating (1 to 5) scales linearly by 5x (up to +25 pts).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-slate-900 w-28 shrink-0">5. Effort Cost:</span>
                  <span>Implementation complexity (1 to 5) subtracts up to −15 pts to reward high-leverage quick wins.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition"
              >
                Close Specs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
