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
  const [newCategory, setNewCategory] = useState("");
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
      if (!res.ok) throw new Error("Failed to create request");

      await loadData();
      setIsCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewCategory("");
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
    { key: "UNDER_REVIEW", label: "Under Review", color: "#64748b" },
    { key: "PLANNED", label: "Planned", color: "#3b82f6" },
    { key: "IN_PROGRESS", label: "In Progress", color: "#8b5cf6" },
    { key: "SHIPPED", label: "Shipped", color: "#10b981" },
    { key: "NOT_PLANNED", label: "Not Planned", color: "#9ca3af" },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roadmap Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize customer feature requests, prioritize development, and update status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {portalSettings?.slug && (
            <Link
              href={`/portal/${portalSettings.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <span>🔗 Public Portal</span>
              <span className="text-[10px] text-gray-400">↗</span>
            </Link>
          )}

          <Link
            href="/dashboard/prioritization"
            className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
          >
            📊 Prioritization Matrix
          </Link>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            + New Request
          </button>
        </div>
      </div>

      {/* ROADMAP KANBAN */}
      {loading ? (
        <div className="py-20 text-center text-sm text-gray-500">Loading roadmap items...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {columns.map((col) => {
            const colItems = items.filter((item) => item.status === col.key);

            return (
              <div
                key={col.key}
                className="flex flex-col rounded-xl border border-gray-200 bg-gray-50/70 p-3 min-h-[500px]"
              >
                <div className="mb-3 flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="text-xs font-bold text-gray-900">{col.label}</span>
                  </div>
                  <span className="rounded-full bg-gray-200/60 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                    {colItems.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {colItems.length === 0 ? (
                    <div className="py-12 text-center text-[11px] text-gray-400">Empty</div>
                  ) : (
                    colItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => openEdit(item)}
                        className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-violet-300 hover:shadow"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-semibold text-gray-900 line-clamp-2">
                            {item.title}
                          </h4>
                          <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                            ▲ {item.voteCount}
                          </span>
                        </div>

                        {item.category && (
                          <span className="mt-2 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-gray-600">
                            {item.category}
                          </span>
                        )}

                        {item.duplicates.length > 0 && (
                          <div className="mt-2 text-[10px] text-amber-700">
                            🔗 {item.duplicates.length} duplicate(s) linked
                          </div>
                        )}

                        {item.releaseNote && (
                          <div className="mt-2 border-t pt-1 text-[10px] text-emerald-700 line-clamp-1">
                            Note: {item.releaseNote}
                          </div>
                        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs text-gray-400">Request Details</span>
                <h2 className="text-base font-bold text-gray-900">{selectedItem.title}</h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                {selectedItem.description}
              </p>

              {notificationStatus && (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                  {notificationStatus}
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700">Roadmap Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm outline-none"
                >
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SHIPPED">Shipped 🎉</option>
                  <option value="NOT_PLANNED">Not Planned</option>
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  Changing status will automatically notify interested customers who voted for this idea.
                </p>
              </div>

              {/* Release note if shipped */}
              {editStatus === "SHIPPED" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700">
                    Release Note / Announcement
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tell your customers what shipped and how to use it..."
                    value={editReleaseNote}
                    onChange={(e) => setEditReleaseNote(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm outline-none"
                  />
                </div>
              )}

              {/* Effort & Impact */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    Business Impact (1-5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={editImpact}
                    onChange={(e) => setEditImpact(parseInt(e.target.value) || 3)}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    Effort / Complexity (1-5)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={editEffort}
                    onChange={(e) => setEditEffort(parseInt(e.target.value) || 3)}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-xs"
                  />
                </div>
              </div>

              {/* Duplicate linking info */}
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {selectedItem.duplicates.length} duplicate(s) linked
                </span>
                <button
                  type="button"
                  onClick={() => setIsMergeOpen(true)}
                  className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                >
                  🔗 Link as Duplicate
                </button>
              </div>

              {/* Actions */}
              <div className="border-t pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-lg border px-4 py-2 text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleSaveStatus}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {updating ? "Saving & Notifying..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MERGE DUPLICATE MODAL */}
      {isMergeOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">Link Duplicate Request</h3>
            <p className="mt-1 text-xs text-gray-500">
              Link &quot;{selectedItem.title}&quot; to a primary idea. Votes will be preserved.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700">
                Select Primary Request
              </label>
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-xs"
              >
                <option value="">Choose primary request...</option>
                {items
                  .filter((i) => i.id !== selectedItem.id && !i.canonicalRequestId)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title} ({i.voteCount} votes)
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsMergeOpen(false)}
                className="rounded-lg border px-3 py-1.5 text-xs text-gray-700"
              >
                Cancel
              </button>
              <button
                disabled={!mergeTargetId || merging}
                onClick={handleMerge}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {merging ? "Linking..." : "Confirm Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW REQUEST MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900">Create Roadmap Request</h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Dark Mode Theme"
                  className="mt-1 w-full rounded-lg border p-2 text-xs outline-none focus:border-violet-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Details about what customers need..."
                  className="mt-1 w-full rounded-lg border p-2 text-xs outline-none focus:border-violet-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="UI, API, etc."
                    className="mt-1 w-full rounded-lg border p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border p-2 text-xs"
                  >
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border px-3 py-1.5 text-xs text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-violet-700"
                >
                  {creating ? "Creating..." : "Create Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
