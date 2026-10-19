"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PrioritizationItem = {
  requestId: string;
  title: string;
  description: string;
  status: string;
  category: string | null;
  createdAt: string;
  voteCount: number;
  effort: number;
  impact: number;
  relatedFeedbackCount: number;
  relatedFeedbackIds: string[];
  totalScore: number;
  scoreExplanation: {
    voteComponent: { points: number; formula: string };
    recencyComponent: { points: number; formula: string; daysAgo: number };
    feedbackComponent: { points: number; formula: string; count: number };
    businessImpactComponent: { points: number; formula: string; level: number };
    effortPenaltyComponent: { points: number; formula: string; level: number };
  };
};

export default function PrioritizationPage() {
  const [items, setItems] = useState<PrioritizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PrioritizationItem | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch("/api/prioritization");
      if (res.ok) {
        const data = await res.json();
        setItems(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function updateImpactEffort(requestId: string, impact: number, effort: number) {
    // Optimistic
    setItems((prev) =>
      prev.map((i) => (i.requestId === requestId ? { ...i, impact, effort } : i))
    );

    try {
      await fetch(`/api/roadmap/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impact, effort }),
      });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evidence-Based Prioritization</h1>
          <p className="mt-1 text-sm text-gray-500">
            Rank customer requests transparently using actual votes, recency, related feedback, and effort.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/roadmap"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← View Roadmap
          </Link>
        </div>
      </div>

      {/* METHODOLOGY EXPLANATION BANNER */}
      <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
        <h3 className="text-xs font-bold text-violet-900 uppercase tracking-wide">
          Transparent Scoring Methodology
        </h3>
        <p className="mt-1 text-xs text-violet-800 leading-relaxed">
          Score = (Votes × 3) + Recency (up to 15) + Related Feedback (up to 30) + (Impact × 5) − (Effort × 3).
          Every point is grounded in actual customer evidence.
        </p>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="py-20 text-center text-sm text-gray-500">Calculating prioritization scores...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <h3 className="text-base font-semibold text-gray-900">No requests to prioritize</h3>
          <p className="mt-1 text-sm text-gray-500">
            Feature requests submitted via the public portal or added to the roadmap will appear here.
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/roadmap"
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700"
            >
              Add a Request to Roadmap
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Rank & Idea</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Votes</th>
                  <th className="px-4 py-3">Related Feedback</th>
                  <th className="px-4 py-3">Impact (1-5)</th>
                  <th className="px-4 py-3">Effort (1-5)</th>
                  <th className="px-4 py-3">Priority Score</th>
                  <th className="px-4 py-3 text-right">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <tr key={item.requestId} className="hover:bg-gray-50/70 transition">
                    {/* Rank & Title */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-700">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-gray-900">{item.title}</div>
                          {item.category && (
                            <span className="text-[10px] text-gray-400">{item.category}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                        {item.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Votes */}
                    <td className="px-4 py-3.5 font-bold text-violet-700">
                      ▲ {item.voteCount}
                    </td>

                    {/* Related Feedback */}
                    <td className="px-4 py-3.5">
                      {item.relatedFeedbackCount > 0 ? (
                        <span className="rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                          {item.relatedFeedbackCount} feedback items
                        </span>
                      ) : (
                        <span className="text-gray-400">None yet</span>
                      )}
                    </td>

                    {/* Impact Selector */}
                    <td className="px-4 py-3.5">
                      <select
                        value={item.impact}
                        onChange={(e) =>
                          updateImpactEffort(item.requestId, parseInt(e.target.value), item.effort)
                        }
                        className="rounded border border-gray-200 bg-white p-1 text-xs"
                      >
                        <option value="1">1 (Low)</option>
                        <option value="2">2</option>
                        <option value="3">3 (Medium)</option>
                        <option value="4">4</option>
                        <option value="5">5 (High)</option>
                      </select>
                    </td>

                    {/* Effort Selector */}
                    <td className="px-4 py-3.5">
                      <select
                        value={item.effort}
                        onChange={(e) =>
                          updateImpactEffort(item.requestId, item.impact, parseInt(e.target.value))
                        }
                        className="rounded border border-gray-200 bg-white p-1 text-xs"
                      >
                        <option value="1">1 (Easy)</option>
                        <option value="2">2</option>
                        <option value="3">3 (Medium)</option>
                        <option value="4">4</option>
                        <option value="5">5 (Hard)</option>
                      </select>
                    </td>

                    {/* Priority Score */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-gray-900">{item.totalScore}</span>
                        <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full bg-violet-600 rounded-full"
                            style={{ width: `${Math.min(100, item.totalScore)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Breakdown button */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="rounded border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                      >
                        Explain Score
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPLAIN SCORE MODAL / DRAWER */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-violet-600 tracking-wider">
                  Transparent Score Breakdown
                </span>
                <h3 className="text-base font-bold text-gray-900">{selectedItem.title}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-violet-50 p-3">
                <span className="font-bold text-violet-900 text-sm">Total Priority Score</span>
                <span className="text-2xl font-black text-violet-700">{selectedItem.totalScore}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-600">Customer Upvotes</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">
                      +{selectedItem.scoreExplanation.voteComponent.points} pts
                    </span>
                    <div className="text-[10px] text-gray-400">
                      {selectedItem.scoreExplanation.voteComponent.formula}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-600">Recency Factor</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">
                      +{selectedItem.scoreExplanation.recencyComponent.points} pts
                    </span>
                    <div className="text-[10px] text-gray-400">
                      {selectedItem.scoreExplanation.recencyComponent.formula}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-600">Related Feedback Mentions</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">
                      +{selectedItem.scoreExplanation.feedbackComponent.points} pts
                    </span>
                    <div className="text-[10px] text-gray-400">
                      {selectedItem.scoreExplanation.feedbackComponent.formula}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between border-b py-2">
                  <span className="text-gray-600">Business Impact Value</span>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600">
                      +{selectedItem.scoreExplanation.businessImpactComponent.points} pts
                    </span>
                    <div className="text-[10px] text-gray-400">
                      {selectedItem.scoreExplanation.businessImpactComponent.formula}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Implementation Effort Cost</span>
                  <div className="text-right">
                    <span className="font-bold text-red-600">
                      {selectedItem.scoreExplanation.effortPenaltyComponent.points} pts
                    </span>
                    <div className="text-[10px] text-gray-400">
                      {selectedItem.scoreExplanation.effortPenaltyComponent.formula}
                    </div>
                  </div>
                </div>
              </div>

              {selectedItem.relatedFeedbackCount > 0 && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <h4 className="text-xs font-bold text-gray-800">
                    Supporting Customer Feedback ({selectedItem.relatedFeedbackCount})
                  </h4>
                  <p className="mt-1 text-[11px] text-gray-500">
                    This request matches customer comments in your inbox discussing similar topics.
                  </p>
                  <div className="mt-2">
                    <Link
                      href="/dashboard/inbox"
                      className="text-xs font-semibold text-violet-600 hover:underline"
                    >
                      View in Feedback Inbox →
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-black"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
