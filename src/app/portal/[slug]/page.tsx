"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type PortalData = {
  name: string;
  description: string;
  logoUrl?: string | null;
  accentColor: string;
  showNotPlanned: boolean;
  slug: string;
};

type FeatureRequest = {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  status: "UNDER_REVIEW" | "PLANNED" | "IN_PROGRESS" | "SHIPPED" | "NOT_PLANNED";
  voteCount: number;
  shippedAt?: string | null;
  releaseNote?: string | null;
  createdAt: string;
  hasVoted: boolean;
};

type DuplicateMatch = {
  id: string;
  title: string;
  description: string;
  status: string;
  voteCount: number;
  similarity: number;
  reason: string;
};

export default function PublicPortalPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"board" | "roadmap" | "changelog">("board");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"popular" | "recent">("popular");

  // Voter identity token stored in localStorage for duplicate vote prevention
  const [voterToken, setVoterToken] = useState("");

  // Submission Modal state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [notifyOnUpdate, setNotifyOnUpdate] = useState(true);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Live duplicate suggestion
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Initialize voter token on mount
  useEffect(() => {
    let token = localStorage.getItem("loop_voter_token");
    if (!token) {
      token = "voter_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("loop_voter_token", token);
    }
    setVoterToken(token);
  }, []);

  // Fetch Portal and Requests
  useEffect(() => {
    if (!slug) return;

    async function loadPortal() {
      try {
        setLoading(true);
        const res = await fetch(`/api/portal/${slug}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load portal");
        }
        const data = await res.json();
        setPortal(data.portal);

        // Load requests with voter token
        const currentToken = localStorage.getItem("loop_voter_token") || "";
        const reqRes = await fetch(`/api/portal/${slug}/requests?voterToken=${currentToken}`);
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setRequests(reqData.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Portal not found or unavailable.");
      } finally {
        setLoading(false);
      }
    }

    loadPortal();
  }, [slug]);

  // Live duplicate check debounce
  useEffect(() => {
    if (!title || title.trim().length < 4 || !isSubmitOpen) {
      setDuplicateMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingDuplicates(true);
        const res = await fetch(`/api/portal/${slug}/check-duplicates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });
        if (res.ok) {
          const data = await res.json();
          setDuplicateMatches(data.matches || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCheckingDuplicates(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [title, description, isSubmitOpen, slug]);

  // Voting action
  async function handleVote(requestId: string) {
    if (!voterToken) return;

    // Optimistic UI update
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const newVoted = !r.hasVoted;
          return {
            ...r,
            hasVoted: newVoted,
            voteCount: newVoted ? r.voteCount + 1 : Math.max(0, r.voteCount - 1),
          };
        }
        return r;
      })
    );

    try {
      const res = await fetch(`/api/portal/${slug}/requests/${requestId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterToken, notifyOnUpdate: true }),
      });

      if (!res.ok) {
        // Revert on error
        const reqRes = await fetch(`/api/portal/${slug}/requests?voterToken=${voterToken}`);
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setRequests(reqData.data || []);
        }
      }
    } catch (e) {
      console.error("Vote failed", e);
    }
  }

  // Submit new request
  async function handleSubmit(e: React.FormEvent, force = false) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/portal/${slug}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category: category || undefined,
          authorEmail: authorEmail || undefined,
          notifyOnUpdate,
          voterToken,
          honeypot,
          forceSubmit: force,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.hasSimilar && data.similarRequests) {
          setDuplicateMatches(data.similarRequests);
          setSubmitError(data.message);
          return;
        }
        throw new Error(data.error || "Failed to submit request.");
      }

      setSubmitSuccess("Your idea was submitted successfully!");
      if (data.request) {
        setRequests((prev) => [data.request, ...prev]);
      }

      setTimeout(() => {
        setIsSubmitOpen(false);
        setTitle("");
        setDescription("");
        setCategory("");
        setSubmitSuccess(null);
        setDuplicateMatches([]);
      }, 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error submitting request.");
    } finally {
      setSubmitting(false);
    }
  }

  // Filtered & sorted requests
  const filteredRequests = useMemo(() => {
    return requests
      .filter((r) => {
        if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "recent") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return b.voteCount - a.voteCount;
      });
  }, [requests, statusFilter, search, sortBy]);

  // Roadmap grouped columns
  const roadmapColumns = useMemo(() => {
    return {
      UNDER_REVIEW: requests.filter((r) => r.status === "UNDER_REVIEW"),
      PLANNED: requests.filter((r) => r.status === "PLANNED"),
      IN_PROGRESS: requests.filter((r) => r.status === "IN_PROGRESS"),
      SHIPPED: requests.filter((r) => r.status === "SHIPPED"),
    };
  }, [requests]);

  // Shipped changelog items
  const changelogItems = useMemo(() => {
    return requests
      .filter((r) => r.status === "SHIPPED")
      .sort((a, b) => new Date(b.shippedAt || b.createdAt).getTime() - new Date(a.shippedAt || a.createdAt).getTime());
  }, [requests]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading feedback portal...</p>
        </div>
      </div>
    );
  }

  if (error || !portal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
            ✕
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">Portal Unavailable</h1>
          <p className="mt-2 text-sm text-gray-600">{error || "This feedback portal does not exist."}</p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              Go to LOOP
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const accentColor = portal.accentColor || "#6655e8";

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            {portal.logoUrl ? (
              <img src={portal.logoUrl} alt={portal.name} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                {portal.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">{portal.name}</h1>
              <p className="text-xs text-gray-500">Feedback & Public Roadmap</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSubmitOpen(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              <span>+</span>
              <span>Submit Idea</span>
            </button>
          </div>
        </div>

        {/* TABS & DESCRIPTION */}
        <div className="mx-auto max-w-5xl px-4 pt-2 sm:px-6">
          <p className="pb-4 text-sm text-gray-600">{portal.description}</p>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("board")}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === "board"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              💡 Feature Requests ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab("roadmap")}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === "roadmap"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              🗺️ Roadmap
            </button>
            <button
              onClick={() => setActiveTab("changelog")}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === "changelog"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              🚀 Shipped ({changelogItems.length})
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* TAB 1: FEATURE REQUESTS BOARD */}
        {activeTab === "board" && (
          <div>
            {/* Search and Filters */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SHIPPED">Shipped</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none"
                >
                  <option value="popular">Most Upvoted</option>
                  <option value="recent">Newest</option>
                </select>
              </div>
            </div>

            {/* List */}
            {filteredRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-2xl">
                  ✨
                </div>
                <h3 className="text-base font-semibold text-gray-900">No requests found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search ? "Try adjusting your search terms." : "Be the first to suggest an idea for this product!"}
                </p>
                <div className="mt-5">
                  <button
                    onClick={() => setIsSubmitOpen(true)}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
                  >
                    Submit an Idea
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300"
                  >
                    {/* Upvote Button */}
                    <button
                      onClick={() => handleVote(req.id)}
                      className={`flex flex-col items-center justify-center rounded-lg border px-3 py-2 transition min-w-[54px] ${
                        req.hasVoted
                          ? "border-violet-600 bg-violet-50 text-violet-700 font-bold"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                      }`}
                      aria-label="Upvote this request"
                    >
                      <span className="text-sm">▲</span>
                      <span className="text-xs">{req.voteCount}</span>
                    </button>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{req.title}</h3>
                        <StatusBadge status={req.status} />
                        {req.category && (
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {req.category}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-3">{req.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ROADMAP VIEW */}
        {activeTab === "roadmap" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* Under Review */}
            <RoadmapColumn
              title="Under Review"
              color="#64748b"
              count={roadmapColumns.UNDER_REVIEW.length}
              items={roadmapColumns.UNDER_REVIEW}
              onVote={handleVote}
            />

            {/* Planned */}
            <RoadmapColumn
              title="Planned"
              color="#3b82f6"
              count={roadmapColumns.PLANNED.length}
              items={roadmapColumns.PLANNED}
              onVote={handleVote}
            />

            {/* In Progress */}
            <RoadmapColumn
              title="In Progress"
              color="#8b5cf6"
              count={roadmapColumns.IN_PROGRESS.length}
              items={roadmapColumns.IN_PROGRESS}
              onVote={handleVote}
            />

            {/* Shipped */}
            <RoadmapColumn
              title="Shipped"
              color="#10b981"
              count={roadmapColumns.SHIPPED.length}
              items={roadmapColumns.SHIPPED}
              onVote={handleVote}
            />
          </div>
        )}

        {/* TAB 3: SHIPPED CHANGELOG */}
        {activeTab === "changelog" && (
          <div className="max-w-2xl mx-auto space-y-6">
            {changelogItems.length === 0 ? (
              <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
                No shipped features recorded yet. Features marked as "Shipped" on the roadmap will appear here.
              </div>
            ) : (
              changelogItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Shipped 🎉
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.shippedAt || item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.description}</p>

                  {item.releaseNote && (
                    <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-900">
                      <strong>Release Note:</strong> {item.releaseNote}
                    </div>
                  )}

                  {/* Follow-up question */}
                  <FollowUpWidget requestId={item.id} slug={slug} />
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t bg-white py-6 text-center text-xs text-gray-400">
        Powered by{" "}
        <Link href="/" className="font-semibold text-violet-600 hover:underline">
          LOOP
        </Link>{" "}
        &bull; Feedback-to-Roadmap Intelligence
      </footer>

      {/* SUBMISSION MODAL */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Submit an Idea or Feedback</h2>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
                  ✓
                </div>
                <h3 className="mt-3 text-lg font-bold text-gray-900">Thank you!</h3>
                <p className="mt-1 text-sm text-gray-600">{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={(e) => handleSubmit(e, false)} className="mt-4 space-y-4">
                {/* Honeypot anti-spam field */}
                <input
                  type="text"
                  name="honeypot"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {submitError && (
                  <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    Idea Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Export reports as CSV"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-600"
                  />
                </div>

                {/* Live duplicate suggestion box */}
                {duplicateMatches.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-900">
                      ⚡ We found similar ideas already requested:
                    </p>
                    <div className="mt-2 space-y-2">
                      {duplicateMatches.slice(0, 2).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between rounded border border-amber-200 bg-white p-2 text-xs"
                        >
                          <div>
                            <span className="font-medium text-gray-900">{m.title}</span>
                            <span className="ml-2 text-[10px] text-gray-500">({m.reason})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleVote(m.id);
                              setIsSubmitOpen(false);
                            }}
                            className="rounded bg-violet-600 px-2 py-1 font-bold text-white hover:bg-violet-700"
                          >
                            ▲ Upvote ({m.voteCount})
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-amber-700">
                      You can upvote an existing idea above, or continue submitting yours below.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    What problem would this solve? *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe how this feature would help you..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-600"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">
                      Category (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Integrations, UI, Billing"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700">
                      Your Email (optional)
                    </label>
                    <input
                      type="email"
                      placeholder="alex@acme.com"
                      value={authorEmail}
                      onChange={(e) => setAuthorEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-600"
                    />
                  </div>
                </div>

                {authorEmail && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="notify"
                      checked={notifyOnUpdate}
                      onChange={(e) => setNotifyOnUpdate(e.target.checked)}
                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    <label htmlFor="notify" className="text-xs text-gray-600">
                      Email me when the status of this request changes (e.g. Planned or Shipped)
                    </label>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsSubmitOpen(false)}
                    className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  {duplicateMatches.length > 0 ? (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={(e) => handleSubmit(e, true)}
                      className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
                    >
                      {submitting ? "Submitting..." : "Submit Anyway"}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-violet-700 disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit Idea"}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "UNDER_REVIEW":
      return (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
          Under Review
        </span>
      );
    case "PLANNED":
      return (
        <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
          Planned
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="rounded bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-800">
          In Progress
        </span>
      );
    case "SHIPPED":
      return (
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
          Shipped 🎉
        </span>
      );
    case "NOT_PLANNED":
      return (
        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
          Not Planned
        </span>
      );
    default:
      return null;
  }
}

function RoadmapColumn({
  title,
  color,
  count,
  items,
  onVote,
}: {
  title: string;
  color: string;
  count: number;
  items: FeatureRequest[];
  onVote: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col min-h-[400px]">
      <div className="mb-4 flex items-center justify-between pb-3 border-b">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
          {count}
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">No requests in this stage.</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-gray-300 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{item.title}</h4>
                <button
                  onClick={() => onVote(item.id)}
                  className={`flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium ${
                    item.hasVoted
                      ? "border-violet-600 bg-violet-50 text-violet-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>▲</span>
                  <span>{item.voteCount}</span>
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FollowUpWidget({ requestId, slug }: { requestId: string; slug: string }) {
  const [answered, setAnswered] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function sendFeedback(satisfied: boolean) {
    try {
      setSubmitting(true);
      await fetch(`/api/portal/${slug}/requests/${requestId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ satisfied, comment }),
      });
      setAnswered(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  if (answered) {
    return (
      <div className="mt-4 rounded bg-gray-50 p-2 text-center text-xs text-emerald-700">
        ✓ Thank you for letting us know!
      </div>
    );
  }

  return (
    <div className="mt-4 border-t pt-3 flex items-center justify-between">
      <span className="text-xs text-gray-500">Did this release solve your problem?</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => sendFeedback(true)}
          disabled={submitting}
          className="rounded border border-gray-200 px-3 py-1 text-xs hover:bg-emerald-50 hover:text-emerald-700"
        >
          👍 Yes, works great
        </button>
        <button
          onClick={() => sendFeedback(false)}
          disabled={submitting}
          className="rounded border border-gray-200 px-3 py-1 text-xs hover:bg-red-50 hover:text-red-700"
        >
          👎 Still have issues
        </button>
      </div>
    </div>
  );
}
