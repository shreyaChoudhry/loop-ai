import prisma from "@/lib/prisma";
import Link from "next/link";

import CSVUpload from "./CSVUpload";
import InboxTable from "./InboxTable";
import SimulatedChannels from "./SimulatedChannels";

const PAGE_SIZE = 10;

type InboxPageProps = {
  searchParams: {
    page?: string;
    search?: string;
    source?: string;
    sentiment?: string;
    status?: string;
    theme?: string;
    date?: string;
    rating?: string;
  };
};

export default async function InboxPage({
  searchParams,
}: InboxPageProps) {
  // --------------------------------
  // Read URL params
  // --------------------------------

  const requestedPage = Math.max(
    Number(searchParams.page) || 1,
    1
  );

  const search =
    searchParams.search?.trim() || "";

  const source =
    searchParams.source || "";

  const sentiment =
    searchParams.sentiment || "";

  const status =
    searchParams.status || "";

  const theme =
    searchParams.theme || "";

  const date =
    searchParams.date || "";

  const rating =
    searchParams.rating || "";
  const parsedRating = Number(rating);

const validRating =
  rating !== "" &&
  Number.isInteger(parsedRating) &&
  parsedRating >= 1 &&
  parsedRating <= 5;
  // --------------------------------
  // Date filter
  // --------------------------------

  const now = new Date();

  let createdAtFilter:
    | {
        gte?: Date;
        lt?: Date;
      }
    | undefined;

  if (date === "today") {
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const startOfTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    createdAtFilter = {
      gte: startOfToday,
      lt: startOfTomorrow,
    };
  }

  if (date === "week") {
    const startOfWeek = new Date(now);

    startOfWeek.setDate(
      now.getDate() - 7
    );

    createdAtFilter = {
      gte: startOfWeek,
      lt: now,
    };
  }

  if (date === "month") {
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    createdAtFilter = {
      gte: startOfMonth,
      lt: now,
    };
  }

  // --------------------------------
  // Prisma WHERE
  // --------------------------------

  const where = {
    ...(search
      ? {
          OR: [
            {
              content: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              category: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),

    ...(source
      ? {
          source: source as never,
        }
      : {}),

    ...(sentiment
      ? {
          sentiment: sentiment as never,
        }
      : {}),

    ...(status
      ? {
          status: status as never,
        }
      : {}),

    ...(theme
      ? {
          themes: {
            some: {
              themeId: theme,
            },
          },
        }
      : {}),

    ...(createdAtFilter
      ? {
          createdAt: createdAtFilter,
        }
      : {}),

    ...(validRating
      ? {
          rating:  parsedRating,
        }
      : {}),
  };

  // --------------------------------
  // Count matching feedback
  // --------------------------------

  const totalFeedback =
    await prisma.feedback.count({
      where,
    });

  // --------------------------------
  // Pagination
  // --------------------------------

  const totalPages = Math.max(
    Math.ceil(
      totalFeedback / PAGE_SIZE
    ),
    1
  );

  const currentPage = Math.min(
    requestedPage,
    totalPages
  );

  const skip =
    (currentPage - 1) * PAGE_SIZE;

  // --------------------------------
  // Fetch current page only
  // --------------------------------

  const feedback =
    await prisma.feedback.findMany({
      where,

      select: {
        id: true,
        content: true,
        source: true,
        sentiment: true,
        status: true,
        category: true,
        rating: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      skip,
      take: PAGE_SIZE,
    });

  // --------------------------------
  // Feedback IDs
  // --------------------------------

  const feedbackIds = feedback.map(
    (item) => item.id
  );

  // --------------------------------
  // Theme relationships
  // --------------------------------

  const feedbackThemeRelations =
    feedbackIds.length > 0
      ? await prisma.feedbackTheme.findMany({
          where: {
            feedbackId: {
              in: feedbackIds,
            },
          },

          select: {
            feedbackId: true,
            themeId: true,
          },
        })
      : [];

  // --------------------------------
  // All themes
  // --------------------------------

  const themes =
    await prisma.theme.findMany({
      select: {
        id: true,
        name: true,
      },

      orderBy: {
        name: "asc",
      },
    });

  // --------------------------------
  // Attach themes
  // --------------------------------

  const formattedFeedback =
    feedback.map((item) => {
      const relatedThemeIds =
        feedbackThemeRelations
          .filter(
            (relation) =>
              relation.feedbackId ===
              item.id
          )
          .map(
            (relation) =>
              relation.themeId
          );

      const itemThemes =
        themes
          .filter((theme) =>
            relatedThemeIds.includes(
              theme.id
            )
          )
          .map((theme) => ({
            id: theme.id,
            name: theme.name,
          }));

      return {
        id: item.id,
        content: item.content,
        source: item.source,
        sentiment: item.sentiment,
        status: item.status,
        category: item.category,
        rating: item.rating,
        createdAt: item.createdAt,
        themes: itemThemes,
      };
    });

  // --------------------------------
  // Pagination URL
  // Preserve filters
  // --------------------------------

  const buildPageUrl = (
    nextPage: number
  ) => {
    const params =
      new URLSearchParams();

    params.set(
      "page",
      String(nextPage)
    );

    if (search) {
      params.set(
        "search",
        search
      );
    }

    if (source) {
      params.set(
        "source",
        source
      );
    }

    if (sentiment) {
      params.set(
        "sentiment",
        sentiment
      );
    }

    if (status) {
      params.set(
        "status",
        status
      );
    }

    if (theme) {
      params.set(
        "theme",
        theme
      );
    }

    if (date) {
      params.set(
        "date",
        date
      );
    }

    if (rating) {
      params.set(
        "rating",
        rating
      );
    }

    return `/dashboard/inbox?${params.toString()}`;
  };

  // --------------------------------
  // Display count
  // --------------------------------

  const showingFrom =
    totalFeedback === 0
      ? 0
      : skip + 1;

  const showingTo =
    Math.min(
      skip + feedback.length,
      totalFeedback
    );

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <main className="space-y-6">
      {/* --------------------------------
          Page Header
      -------------------------------- */}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Feedback Inbox
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Review, filter and manage
          customer feedback.
        </p>
      </div>

      {/* --------------------------------
          CSV Upload
      -------------------------------- */}

      <section>
        <CSVUpload />
      </section>

      {/* --------------------------------
          Simulated Channels
      -------------------------------- */}

      <section>
        <SimulatedChannels />
      </section>

      {/* --------------------------------
          Inbox
      -------------------------------- */}

      <section className="space-y-4">
        <InboxTable
          feedback={formattedFeedback}
          themes={themes}
          currentFilters={{
            search,
            source,
            sentiment,
            status,
            theme,
            date,
            rating,
          }}
        />

        {/* Pagination */}

        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">
            Showing{" "}
            <span className="font-medium text-zinc-700">
              {showingFrom}
            </span>{" "}
            to{" "}
            <span className="font-medium text-zinc-700">
              {showingTo}
            </span>{" "}
            of{" "}
            <span className="font-medium text-zinc-700">
              {totalFeedback}
            </span>{" "}
            feedback records
          </p>

          <div className="flex items-center gap-2">
            {/* Previous */}

            {currentPage > 1 ? (
              <Link
                href={buildPageUrl(
                  currentPage - 1
                )}
                className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Previous
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-lg border border-zinc-100 px-3.5 py-2 text-sm font-medium text-zinc-300">
                Previous
              </span>
            )}

            {/* Current page */}

            <span className="min-w-10 rounded-lg bg-zinc-900 px-3.5 py-2 text-center text-sm font-medium text-white">
              {currentPage}
            </span>

            {/* Next */}

            {currentPage <
            totalPages ? (
              <Link
                href={buildPageUrl(
                  currentPage + 1
                )}
                className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Next
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-lg border border-zinc-100 px-3.5 py-2 text-sm font-medium text-zinc-300">
                Next
              </span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}