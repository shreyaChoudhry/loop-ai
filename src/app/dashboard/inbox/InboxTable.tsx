"use client";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

type ThemeItem = {
  id: string;
  name: string;
};

type FeedbackItem = {
  id: string;
  content: string;
  source: string;
  sentiment: string | null;
  status: string;
  category: string | null;
  createdAt: Date;
  themes: ThemeItem[];
};

type InboxTableProps = {
  feedback: FeedbackItem[];
  themes: ThemeItem[];
 currentFilters: {
  search: string;
  source: string;
  sentiment: string;
  status: string;
  theme: string;
  date: string;
  rating: string;
};
};

export default function InboxTable({
  feedback,
  themes,
  currentFilters,
}: InboxTableProps) {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const [search, setSearch] =
    useState(
      currentFilters.search
    );

  const [
    reclassifyingId,
    setReclassifyingId,
  ] = useState<string | null>(
    null
  );

  const [
    actionMessage,
    setActionMessage,
  ] = useState<string | null>(
    null
  );

  // --------------------------------
  // Keep search synced
  // --------------------------------

  useEffect(() => {
    setSearch(
      currentFilters.search
    );
  }, [
    currentFilters.search,
  ]);

  // --------------------------------
  // Update filters
  // --------------------------------

  const updateFilter = (
    key: string,
    value: string
  ) => {
    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    if (value) {
      params.set(
        key,
        value
      );
    } else {
      params.delete(key);
    }

    params.set(
      "page",
      "1"
    );

    router.push(
      `/dashboard/inbox?${params.toString()}`
    );
  };

  // --------------------------------
  // Search
  // --------------------------------

  const handleSearch = () => {
    updateFilter(
      "search",
      search.trim()
    );
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  // --------------------------------
  // Re-classify
  // --------------------------------

  const handleReclassify = async (
    feedbackId: string
  ) => {
    try {
      setReclassifyingId(
        feedbackId
      );

      setActionMessage(null);

      const response =
        await fetch(
          `/api/feedback/${feedbackId}/reclassify`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Failed to re-classify feedback."
        );
      }

      setActionMessage(
        "Feedback re-classified successfully."
      );

      router.refresh();
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Failed to re-classify feedback."
      );
    } finally {
      setReclassifyingId(
        null
      );
    }
  };

  // --------------------------------
  // Formatting
  // --------------------------------

  const formatSource = (
    source: string
  ) => {
    return (
      source.charAt(0) +
      source
        .slice(1)
        .toLowerCase()
    );
  };

  const formatStatus = (
    status: string
  ) => {
    return (
      status.charAt(0) +
      status
        .slice(1)
        .toLowerCase()
    );
  };

  const formatSentiment = (
    sentiment: string | null
  ) => {
    if (!sentiment) {
      return "Unknown";
    }

    return (
      sentiment.charAt(0) +
      sentiment
        .slice(1)
        .toLowerCase()
    );
  };

  const formatDate = (
    date: Date
  ) => {
    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <>
      {/* Search */}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            onKeyDown={
              handleSearchKeyDown
            }
            placeholder="Search feedback..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />

          <button
            type="button"
            onClick={
              handleSearch
            }
            className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Filters */}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <select
            value={
              currentFilters.date
            }
            onChange={(event) =>
              updateFilter(
                "date",
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500"
          >
            <option value="">
              Date
            </option>
            <option value="today">
              Today
            </option>
            <option value="week">
              This Week
            </option>
            <option value="month">
              This Month
            </option>
          </select>

          <select
            value={
              currentFilters.source
            }
            onChange={(event) =>
              updateFilter(
                "source",
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500"
          >
            <option value="">
              Channel
            </option>
            <option value="WEBSITE">
              Website
            </option>
            <option value="EMAIL">
              Email
            </option>
            <option value="SUPPORT">
              Support
            </option>
            <option value="SURVEY">
              Survey
            </option>
            <option value="OTHER">
              Other
            </option>
          </select>

          <select
            value={
              currentFilters.sentiment
            }
            onChange={(event) =>
              updateFilter(
                "sentiment",
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500"
          >
            <option value="">
              Sentiment
            </option>
            <option value="POSITIVE">
              Positive
            </option>
            <option value="NEUTRAL">
              Neutral
            </option>
            <option value="NEGATIVE">
              Negative
            </option>
          </select>

          <select
            value={
              currentFilters.status
            }
            onChange={(event) =>
              updateFilter(
                "status",
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500"
          >
            <option value="">
              Status
            </option>
            <option value="NEW">
              New
            </option>
            <option value="REVIEWED">
              Reviewed
            </option>
            <option value="ACTIONED">
              Actioned
            </option>
          </select>

          <select
            value={
              currentFilters.theme
            }
            onChange={(event) =>
              updateFilter(
                "theme",
                event.target.value
              )
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500"
          >
            <option value="">
              Themes
            </option>

            {themes.map(
              (theme) => (
                <option
                  key={theme.id}
                  value={theme.id}
                >
                  {theme.name}
                </option>
              )
            )}
          </select>
        </div>

        {(currentFilters.search ||
          currentFilters.source ||
          currentFilters.sentiment ||
          currentFilters.status ||
          currentFilters.theme ||
          currentFilters.date) && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard/inbox?page=1"
                )
              }
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Action message */}

      {actionMessage && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">
          {actionMessage}
        </div>
      )}

      {/* Feedback Table */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Customer Feedback
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Showing{" "}
            {feedback.length}{" "}
            feedback record
            {feedback.length !==
            1
              ? "s"
              : ""}
          </p>
        </div>

        {feedback.length ===
        0 ? (
          <div className="flex min-h-48 items-center justify-center px-6">
            <p className="text-sm text-gray-500">
              No feedback matches
              your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Feedback
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Source
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Sentiment
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Themes
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>

                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {feedback.map(
                  (item) => (
                    <tr
                      key={
                        item.id
                      }
                      className="border-b border-gray-100 transition last:border-b-0 hover:bg-gray-50"
                    >
                      {/* Feedback */}

                      <td className="max-w-md px-6 py-4">
                        <Link
                          href={`/dashboard/inbox/${item.id}`}
                          className="block"
                        >
                          <p className="truncate text-sm font-medium text-gray-900 hover:text-purple-600">
                            {
                              item.content
                            }
                          </p>
                        </Link>
                      </td>

                      {/* Source */}

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {formatSource(
                          item.source
                        )}
                      </td>

                      {/* Sentiment */}

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.sentiment ===
                            "POSITIVE"
                              ? "bg-green-100 text-green-700"
                              : item.sentiment ===
                                  "NEGATIVE"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {formatSentiment(
                            item.sentiment
                          )}
                        </span>
                      </td>

                      {/* Themes */}

                      <td className="px-6 py-4">
                        {item.themes
                          .length ===
                        0 ? (
                          <span className="text-sm text-gray-400">
                            —
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {item.themes.map(
                              (
                                theme
                              ) => (
                                <span
                                  key={
                                    theme.id
                                  }
                                  className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700"
                                >
                                  {
                                    theme.name
                                  }
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.status ===
                            "NEW"
                              ? "bg-blue-100 text-blue-700"
                              : item.status ===
                                  "REVIEWED"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {formatStatus(
                            item.status
                          )}
                        </span>
                      </td>

                      {/* Date */}

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {formatDate(
                          item.createdAt
                        )}
                      </td>

                      {/* Action */}

                      <td className="whitespace-nowrap px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleReclassify(
                              item.id
                            )
                          }
                          disabled={
                            reclassifyingId ===
                            item.id
                          }
                          className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-medium text-purple-700 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {reclassifyingId ===
                          item.id
                            ? "Re-classifying..."
                            : "Re-classify"}
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}