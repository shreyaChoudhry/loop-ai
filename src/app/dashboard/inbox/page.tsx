import prisma from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";

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

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.workspaceId) {
    redirect("/login");
  }

  const workspaceId = session.user.workspaceId;

  // Read URL params
  const requestedPage = Math.max(Number(searchParams.page) || 1, 1);
  const search = searchParams.search?.trim() || "";
  const source = searchParams.source || "";
  const sentiment = searchParams.sentiment || "";
  const status = searchParams.status || "";
  const theme = searchParams.theme || "";
  const date = searchParams.date || "";
  const rating = searchParams.rating || "";
  const parsedRating = Number(rating);

  const validRating =
    rating !== "" &&
    Number.isInteger(parsedRating) &&
    parsedRating >= 1 &&
    parsedRating <= 5;

  // Date filter
  const now = new Date();
  let createdAtFilter: { gte?: Date; lt?: Date } | undefined;

  if (date === "today") {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    createdAtFilter = { gte: startOfToday, lt: startOfTomorrow };
  } else if (date === "week") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    createdAtFilter = { gte: startOfWeek, lt: now };
  } else if (date === "month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    createdAtFilter = { gte: startOfMonth, lt: now };
  }

  // Enforce Workspace Isolation
  const where: Record<string, unknown> = {
    workspaceId,
    ...(search
      ? {
          OR: [
            { content: { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(source ? { source: source as never } : {}),
    ...(sentiment ? { sentiment: sentiment as never } : {}),
    ...(status ? { status: status as never } : {}),
    ...(theme ? { themes: { some: { themeId: theme } } } : {}),
    ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    ...(validRating ? { rating: parsedRating } : {}),
  };

  const totalFeedback = await prisma.feedback.count({ where });
  const totalPages = Math.max(Math.ceil(totalFeedback / PAGE_SIZE), 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const feedback = await prisma.feedback.findMany({
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
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
  });

  const feedbackIds = feedback.map((item) => item.id);
  const feedbackThemeRelations =
    feedbackIds.length > 0
      ? await prisma.feedbackTheme.findMany({
          where: { feedbackId: { in: feedbackIds } },
          select: { feedbackId: true, themeId: true },
        })
      : [];

  const themes = await prisma.theme.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const formattedFeedback = feedback.map((item) => {
    const relatedThemeIds = feedbackThemeRelations
      .filter((relation) => relation.feedbackId === item.id)
      .map((relation) => relation.themeId);

    return {
      ...item,
      themes: themes.filter((themeItem) => relatedThemeIds.includes(themeItem.id)),
    };
  });

  const startFeedbackCount = totalFeedback === 0 ? 0 : skip + 1;
  const endFeedbackCount = Math.min(skip + PAGE_SIZE, totalFeedback);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Feedback Inbox
            </h1>
            <span className="rounded-full bg-purple-100 border border-purple-200/80 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
              {totalFeedback} Signals
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Streamed in real-time from widgets, email, Discord, support, and CSV uploads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/prioritization"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <span>View Prioritization</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* ACTION PANELS: SIMULATED CHANNELS + CSV IMPORT */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SimulatedChannels />
        <CSVUpload />
      </div>

      {/* MAIN INBOX TABLE & FILTERS */}
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

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
          <span className="text-slate-500 font-medium">
            Showing <b className="text-slate-900">{startFeedbackCount}</b> to{" "}
            <b className="text-slate-900">{endFeedbackCount}</b> of{" "}
            <b className="text-slate-900">{totalFeedback}</b> records
          </span>

          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={`/dashboard/inbox?page=${currentPage - 1}&search=${search}&source=${source}&sentiment=${sentiment}&status=${status}&theme=${theme}&date=${date}&rating=${rating}`}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-xl border border-slate-100 px-3 py-1.5 text-slate-300">
                Previous
              </span>
            )}

            <span className="px-2 font-mono font-bold text-purple-700">
              {currentPage} / {totalPages}
            </span>

            {currentPage < totalPages ? (
              <Link
                href={`/dashboard/inbox?page=${currentPage + 1}&search=${search}&source=${source}&sentiment=${sentiment}&status=${status}&theme=${theme}&date=${date}&rating=${rating}`}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-xl border border-slate-100 px-3 py-1.5 text-slate-300">
                Next
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}