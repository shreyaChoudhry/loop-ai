"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
};

export default function InboxTable({
  feedback,
  themes,
}: InboxTableProps) {
  // --------------------------------
  // Filter states
  // --------------------------------

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [themeFilter, setThemeFilter] = useState("");

  // --------------------------------
  // Filter feedback
  // --------------------------------

  const filteredFeedback = useMemo(() => {
    const now = new Date();

    return feedback.filter((item) => {
      // ------------------------------
      // Search
      // ------------------------------

      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        searchValue === "" ||
        item.content.toLowerCase().includes(searchValue) ||
        item.source.toLowerCase().includes(searchValue) ||
        (item.category ?? "")
          .toLowerCase()
          .includes(searchValue) ||
        item.themes.some((theme) =>
          theme.name.toLowerCase().includes(searchValue)
        );

      // ------------------------------
      // Channel
      // ------------------------------

      const matchesSource =
        sourceFilter === "" ||
        item.source === sourceFilter;

      // ------------------------------
      // Sentiment
      // ------------------------------

      const matchesSentiment =
        sentimentFilter === "" ||
        item.sentiment === sentimentFilter;

      // ------------------------------
      // Status
      // ------------------------------

      const matchesStatus =
        statusFilter === "" ||
        item.status === statusFilter;

      // ------------------------------
      // Theme
      // ------------------------------

      const matchesTheme =
        themeFilter === "" ||
        item.themes.some(
          (theme) => theme.id === themeFilter
        );

      // ------------------------------
      // Date
      // ------------------------------

      let matchesDate = true;

      if (dateFilter === "today") {
        const today = new Date();

        matchesDate =
          new Date(item.createdAt).toDateString() ===
          today.toDateString();
      }

      if (dateFilter === "week") {
        const sevenDaysAgo = new Date();

        sevenDaysAgo.setDate(
          sevenDaysAgo.getDate() - 7
        );

        matchesDate =
          new Date(item.createdAt) >= sevenDaysAgo;
      }

      if (dateFilter === "month") {
        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

        matchesDate =
          new Date(item.createdAt) >= startOfMonth;
      }

      return (
        matchesSearch &&
        matchesSource &&
        matchesSentiment &&
        matchesStatus &&
        matchesTheme &&
        matchesDate
      );
    });
  }, [
    feedback,
    search,
    dateFilter,
    sourceFilter,
    sentimentFilter,
    statusFilter,
    themeFilter,
  ]);

  // --------------------------------
  // Formatting helpers
  // --------------------------------

  const formatSource = (source: string) => {
    return (
      source.charAt(0) +
      source.slice(1).toLowerCase()
    );
  };

  const formatStatus = (status: string) => {
    return (
      status.charAt(0) +
      status.slice(1).toLowerCase()
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
      sentiment.slice(1).toLowerCase()
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(
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
        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search feedback..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
        />
      </div>

      {/* Filters */}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Date */}

          <select
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500"
          >
            <option value="">Date</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Channel */}

          <select
            value={sourceFilter}
            onChange={(event) =>
              setSourceFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500"
          >
            <option value="">Channel</option>
            <option value="WEBSITE">Website</option>
            <option value="EMAIL">Email</option>
            <option value="SUPPORT">Support</option>
            <option value="SURVEY">Survey</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Sentiment */}

          <select
            value={sentimentFilter}
            onChange={(event) =>
              setSentimentFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500"
          >
            <option value="">Sentiment</option>
            <option value="POSITIVE">Positive</option>
            <option value="NEUTRAL">Neutral</option>
            <option value="NEGATIVE">Negative</option>
          </select>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500"
          >
            <option value="">Status</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Themes */}

          <select
            value={themeFilter}
            onChange={(event) =>
              setThemeFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500"
          >
            <option value="">Themes</option>

            {themes.map((theme) => (
              <option
                key={theme.id}
                value={theme.id}
              >
                {theme.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback Table */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Customer Feedback
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Showing {filteredFeedback.length} of{" "}
            {feedback.length} feedback record
            {feedback.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filteredFeedback.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center px-6">
            <p className="text-sm text-gray-500">
              No feedback matches your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
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
                </tr>
              </thead>

              <tbody>
                {filteredFeedback.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 transition last:border-b-0 hover:bg-gray-50"
                  >
                    {/* Feedback */}

                    <td className="max-w-md px-6 py-4">
                      <Link
                        href={`/dashboard/inbox/${item.id}`}
                        className="block"
                      >
                        <p className="truncate text-sm font-medium text-gray-900 hover:text-purple-600">
                          {item.content}
                        </p>
                      </Link>
                    </td>

                    {/* Source */}

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatSource(item.source)}
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
                      {item.themes.length === 0 ? (
                        <span className="text-sm text-gray-400">
                          —
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {item.themes.map(
                            (theme) => (
                              <span
                                key={theme.id}
                                className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700"
                              >
                                {theme.name}
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
                          item.status === "NEW"
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}