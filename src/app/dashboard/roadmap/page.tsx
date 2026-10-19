"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RoadmapItem = {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  status: "UNDER_REVIEW" | "PLANNED" | "IN_PROGRESS" | "SHIPPED" | "NOT_PLANNED";
  voteCount: number;
  effort?: number | null;
  impact?: number | null;
  releaseNote?: string | null;
  shippedAt?: string | null;
  canonicalRequestId?: string | null;
  duplicates: Array<{ id: string; title: string; voteCount: number }>;
  _count?: { votes: number; followUps: number };
  createdAt: string;
};

type PortalSettings = {
  slug?: string | null;
  portalEnabled: boolean;
};

export default function DashboardRoadmapPage() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [portalSettings, setPortalSettings] = useState<PortalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);

  // Status edit modal
  const [editStatus, setEditStatus] = useState<string>("");
  const [editReleaseNote, setEditReleaseNote] = useState<string>("");
  const [editEffort, setEditEffort] = useState<number>(3);
  const [editImpact, setEditImpact] = useState<number>(3);
  const [updating, setUpdating] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  // New request modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("Core UX");
  const [newStatus, setNewStatus] = useState("PLANNED");
  const [creating, setCreating] = useState(false);

  // Merge modal
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [merging, setMerging] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [roadmapRes, portalRes] = await Promise.all([
        fetch("/api/roadmap"),
        fetch("/api/portal-settings"),
      ]);

      if (roadmapRes.ok) {
        const data = await roadmapRes.json();
        setItems(data.data || []);
      }
      if (portalRes.ok) {
        const pData = await portalRes.json();
        setPortalSettings(pData.settings);
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

  function openEdit(item: RoadmapItem) {
    setSelectedItem(item);
    setEditStatus(item.status);
    setEditReleaseNote(item.releaseNote || "");
    setEditEffort(item.effort ?? 3);
    setEditImpact(item.impact ?? 3);
    setNotificationStatus(null);
  }

  async function handleSaveStatus() {
    if (!selectedItem) return;
    try {
      setUpdating(true);
      setNotificationStatus(null);

      const patchRes = await fetch(`/api/roadmap/requests/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          releaseNote: editReleaseNote,
          effort: editEffort,
          impact: editImpact,
        }),
      });

      const data = await patchRes.json();
      if (!patchRes.ok) throw new Error(data.error || "Failed to update status");

      if (data.notifications && data.notifications.sentCount > 0) {
        setNotificationStatus(
          `✓ Updated! Sent notification updates to ${data.notifications.sentCount} subscribed customer(s).`
        );
      } else {
        setNotificationStatus("✓ Status updated successfully.");
      }

      await loadData();
      setTimeout(() => {
        setSelectedItem(null);
      }, 1400);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
          status: newStatus,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create request");

      await loadData();
      setIsCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewCategory("Core UX");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Creation failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleMerge() {
    if (!selectedItem || !mergeTargetId) return;
    try {
      setMerging(true);
      const res = await fetch(`/api/roadmap/requests/${selectedItem.id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canonicalRequestId: mergeTargetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to link duplicate");

      alert(data.message);
      setIsMergeOpen(false);
      setSelectedItem(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Merge failed");
    } finally {
      setMerging(false);
    }
  }

  const columns = [
    { key: "UNDER_REVIEW", label: "Under Review", badgeColor: "bg-slate-100 text-slate-700 border-slate-200" },
    { key: "PLANNED", label: "Planned", badgeColor: "bg-purple-50 text-purple-700 border-purple-200" },
    { key: "IN_PROGRESS", label: "In Progress", badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { key: "SHIPPED", label: "Shipped", badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { key: "NOT_PLANNED", label: "Not Planned", badgeColor: "bg-slate-100 text-slate-500 border-slate-200" },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Product Roadmap
            </h1>
            <span className="rounded-full bg-purple-100 border border-purple-200/80 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
              {items.length} Total Requests
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Drag, prioritize, and publish planned initiatives to close the feedback loop.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {portalSettings?.slug && (
            <Link
              href={`/portal/${portalSettings.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <span>🔗 Public Portal</span>
              <span className="text-[10px] text-slate-400">↗</span>
            </Link>
          )}

          <Link
            href="/dashboard/prioritization"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <span>Prioritization Matrix</span>
            <span>→</span>
          </Link>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <span>+</span>
            <span>New Request</span>
          </button>
        </div>
      </div>

      {/* ROADMAP KANBAN */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500">
          <span className="inline-block animate-spin mr-2">↺</span>
          Loading roadmap backlog...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 items-start">
          {columns.map((col) => {
            const colItems = items.filter((item) => item.status === col.key);

            return (
              <div
                key={col.key}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 min-h-[550px]"
              >
                <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2 px-1">
                  <span className="text-xs font-bold text-slate-800">{col.label}</span>
                  <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600 shadow-sm">
                    {colItems.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {colItems.length === 0 ? (
                    <div className="py-16 text-center text-[11px] text-slate-400">
                      No requests
                    </div>
                  ) : (
                    colItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => openEdit(item)}
                        className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-purple-400 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 line-clamp-2 transition">
                            {item.title}
                          </h4>
                          <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 shrink-0">
                            ▲ {item.voteCount}
                          </span>
                        </div>

                        {item.description && (
                          <p className="mt-1.5 text-[11px] text-slate-500 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {item.category && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                              {item.category}
                            </span>
                          )}

                          {item.duplicates.length > 0 && (
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 border border-amber-200">
                              🔗 {item.duplicates.length} duplicate{item.duplicates.length > 1 ? "s" : ""}
                            </span>
                          )}

                          {item.releaseNote && (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 border border-emerald-200">
                              ✓ Release Note
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">
                  Request Editor
                </span>
                <h2 className="text-base font-bold text-slate-900 leading-snug">{selectedItem.title}</h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedItem.description}
              </p>

              {notificationStatus && (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 border border-emerald-200">
                  {notificationStatus}
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Roadmap Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-medium text-slate-800 outline-none focus:border-purple-500"
                >
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SHIPPED">Shipped (Notifies Subscribed Voters)</option>
                  <option value="NOT_PLANNED">Not Planned</option>
                </select>
              </div>

              {/* Release Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Release Note & Changelog Update
                </label>
                <textarea
                  rows={3}
                  value={editReleaseNote}
                  onChange={(e) => setEditReleaseNote(e.target.value)}
                  placeholder="Tell voters what was built and how to use it..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500"
                />
              </div>

              {/* Impact & Effort */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Impact (1-5)
                  </label>
                  <select
                    value={editImpact}
                    onChange={(e) => setEditImpact(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-purple-500"
                  >
                    <option value="1">1 - Minor</option>
                    <option value="2">2 - Low</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - High</option>
                    <option value="5">5 - Critical/Revenue Blocker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Implementation Effort (1-5)
                  </label>
                  <select
                    value={editEffort}
                    onChange={(e) => setEditEffort(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-purple-500"
                  >
                    <option value="1">1 - Trivial (1 day)</option>
                    <option value="2">2 - Easy (Sprint)</option>
                    <option value="3">3 - Moderate</option>
                    <option value="4">4 - Complex</option>
                    <option value="5">5 - Massive overhaul</option>
                  </select>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsMergeOpen(true)}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-800"
                >
                  🔗 Link as Duplicate...
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStatus}
                    disabled={updating}
                    className="rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW REQUEST MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Create Feature Request</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Feature Request Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Automated EU VAT & Stripe Tax Validation"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Explain why customers need this and what problem it solves..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-purple-500"
                  >
                    <option value="Billing">Billing</option>
                    <option value="API & Webhooks">API & Webhooks</option>
                    <option value="Integrations">Integrations</option>
                    <option value="Core UX">Core UX</option>
                    <option value="Feature">General Feature</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-purple-500"
                  >
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MERGE DUPLICATE MODAL */}
      {isMergeOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Link Duplicate Request</h3>
              <button
                onClick={() => setIsMergeOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-600">
              Link &ldquo;<b>{selectedItem.title}</b>&rdquo; as a duplicate child of another canonical request. Its votes and subscribers will automatically transfer.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Canonical Parent Request
              </label>
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-purple-500"
              >
                <option value="">Choose canonical request...</option>
                {items
                  .filter((i) => i.id !== selectedItem.id && !i.canonicalRequestId)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title} ({i.voteCount} votes)
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsMergeOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMerge}
                disabled={!mergeTargetId || merging}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {merging ? "Linking..." : "Confirm & Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
