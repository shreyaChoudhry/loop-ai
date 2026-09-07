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
  rating: number | null;
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
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const [search, setSearch] =
    useState(
      currentFilters.search
    );

  // --------------------------------
  // Sync search with URL
  // --------------------------------

  useEffect(() => {
    setSearch(
      currentFilters.search
    );
  }, [
    currentFilters.search,
  ]);

  // --------------------------------
  // Update URL filter
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

    // Always return to page 1
    // after changing a filter
    params.set("page", "1");

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
  // Clear all
  // --------------------------------

  const clearFilters = () => {
    setSearch("");

    router.push(
      "/dashboard/inbox?page=1"
    );
  };

  const hasFilters =
    currentFilters.search ||
    currentFilters.source ||
    currentFilters.sentiment ||
    currentFilters.status ||
    currentFilters.theme ||
    currentFilters.date ||
    currentFilters.rating;

  // --------------------------------
  // Formatting helpers
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
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Search + filter area */}

      <div className="border-b border-zinc-200 p-5">
        {/* Search */}

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
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
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </div>

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

        {/* Filters */}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Date */}

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
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
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

          {/* Channel */}

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
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
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

          {/* Sentiment */}

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
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
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

          {/* Status */}

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
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
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

          {/* Theme */}

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
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">
              Theme
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

          {/* Rating */}

          <select
            value={
              currentFilters.rating
            }
            onChange={(event) =>
              updateFilter(
                "rating",
                event.target.value
              )
            }
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">
              Rating
            </option>

            <option value="5">
              ★★★★★ 5
            </option>

            <option value="4">
              ★★★★☆ 4
            </option>

            <option value="3">
              ★★★☆☆ 3
            </option>

            <option value="2">
              ★★☆☆☆ 2
            </option>

            <option value="1">
              ★☆☆☆☆ 1
            </option>
          </select>
        </div>

        {/* Active filters */}

        {hasFilters && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Filters are applied on the
              server.
            </p>

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="text-sm font-medium text-purple-600 transition hover:text-purple-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Table header */}

      <div className="flex flex-col gap-1 border-b border-zinc-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Customer Feedback
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Showing{" "}
            {feedback.length}{" "}
            feedback record
            {feedback.length !==
            1
              ? "s"
              : ""}{" "}
            on this page
          </p>
        </div>
      </div>

      {/* Empty state */}

      {feedback.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-xl">
            📭
          </div>

          <h3 className="text-sm font-semibold text-zinc-900">
            No feedback found
          </h3>

          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            No feedback matches your
            current search and filters.
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="mt-4 text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        /* Table */

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Feedback
                </th>

                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Source
                </th>

                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Sentiment
                </th>

                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Themes
                </th>

                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Rating
                </th>

                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Status
                </th>

                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {feedback.map(
                (item) => (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-100 transition last:border-b-0 hover:bg-zinc-50"
                  >
                    {/* Feedback */}

                    <td className="max-w-md px-6 py-4">
                      <Link
                        href={`/dashboard/inbox/${item.id}`}
                        className="block"
                      >
                        <p className="truncate text-sm font-medium text-zinc-900 transition hover:text-purple-600">
                          {
                            item.content
                          }
                        </p>

                        {item.category && (
                          <p className="mt-1 truncate text-xs text-zinc-400">
                            {
                              item.category
                            }
                          </p>
                        )}
                      </Link>
                    </td>

                    {/* Source */}

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-600">
                      {formatSource(
                        item.source
                      )}
                    </td>

                    {/* Sentiment */}

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.sentiment ===
                          "POSITIVE"
                            ? "bg-green-100 text-green-700"
                            : item.sentiment ===
                              "NEGATIVE"
                            ? "bg-red-100 text-red-700"
                            : "bg-zinc-100 text-zinc-700"
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
                        <span className="text-sm text-zinc-400">
                          —
                        </span>
                      ) : (
                        <div className="flex max-w-xs flex-wrap gap-1.5">
                          {item.themes.map(
                            (
                              theme
                            ) => (
                              <span
                                key={
                                  theme.id
                                }
                                className="rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700"
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

                    {/* Rating */}

                    <td className="whitespace-nowrap px-6 py-4">
                      {item.rating ===
                      null ? (
                        <span className="text-sm text-zinc-400">
                          Not rated
                        </span>
                      ) : (
                        <span className="text-sm font-medium">
                          <span className="text-amber-500">
                            {"★".repeat(
                              item.rating
                            )}
                          </span>

                          <span className="text-zinc-300">
                            {"★".repeat(
                              5 -
                                item.rating
                            )}
                          </span>
                        </span>
                      )}
                    </td>

                    {/* Status */}

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
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

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                      {formatDate(
                        item.createdAt
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}