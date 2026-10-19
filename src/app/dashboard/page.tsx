import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

import StatCard from "./StatCard";
import FeedbackChart from "./FeedbackChart";
import Sentiment from "./Sentiment";
import TopChannels from "./TopChannels";
import TopThemes from "./TopTheme";
import RecentFeedback from "./RecentFeedback";
import QuickActions from "./QuickActions";
import AIInsight from "./AIInsight";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  // --------------------------------
  // Authentication
  // --------------------------------

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const workspaceId = session.user.workspaceId;

  if (!workspaceId) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-700">
            Workspace not found
          </h1>

          <p className="mt-2 text-sm text-red-600">
            Your account is not connected to a workspace.
          </p>
        </div>
      </main>
    );
  }

  // --------------------------------
  // Base workspace filter & info
  // --------------------------------

  const workspaceFilter = {
    workspaceId,
  };

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true, slug: true, portalEnabled: true },
  });

  const totalRequests = await prisma.request.count({
    where: workspaceFilter,
  });

  const totalVotes = await prisma.vote.count({
    where: workspaceFilter,
  });

  // --------------------------------
  // Total feedback
  // --------------------------------

  const totalFeedback = await prisma.feedback.count({
    where: workspaceFilter,
  });

  // --------------------------------
  // Positive feedback
  // --------------------------------

  const positiveFeedback = await prisma.feedback.count({
    where: {
      ...workspaceFilter,
      sentiment: "POSITIVE",
    },
  });

  // --------------------------------
  // Neutral feedback
  // --------------------------------

  const neutralFeedback = await prisma.feedback.count({
    where: {
      ...workspaceFilter,
      sentiment: "NEUTRAL",
    },
  });

  // --------------------------------
  // Negative feedback
  // --------------------------------

  const negativeFeedback = await prisma.feedback.count({
    where: {
      ...workspaceFilter,
      sentiment: "NEGATIVE",
    },
  });

  // --------------------------------
  // Feedback from last 7 days
  // --------------------------------

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newThisWeek = await prisma.feedback.count({
    where: {
      ...workspaceFilter,
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  });

  // --------------------------------
  // Sentiment percentages
  // --------------------------------

  const positivePercentage =
    totalFeedback > 0
      ? Math.round((positiveFeedback / totalFeedback) * 100)
      : 0;

  const neutralPercentage =
    totalFeedback > 0
      ? Math.round((neutralFeedback / totalFeedback) * 100)
      : 0;

  const negativePercentage =
    totalFeedback > 0
      ? Math.round((negativeFeedback / totalFeedback) * 100)
      : 0;

  // --------------------------------
  // Feedback chart data
  // --------------------------------

  const feedbackRecords = await prisma.feedback.findMany({
    where: workspaceFilter,
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const feedbackChartData: {
    date: string;
    count: number;
  }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();

    date.setDate(date.getDate() - i);

    const dateString = date.toISOString().split("T")[0];

    const count = feedbackRecords.filter((feedback) => {
      const feedbackDate = new Date(feedback.createdAt)
        .toISOString()
        .split("T")[0];

      return feedbackDate === dateString;
    }).length;

    feedbackChartData.push({
      date: dateString,
      count,
    });
  }

  // --------------------------------
  // Top channels
  // --------------------------------

  const channelCounts = await prisma.feedback.groupBy({
    by: ["source"],
    where: workspaceFilter,
    _count: {
      source: true,
    },
  });

  const topChannels = [
    {
      name: "Website",
      count:
        channelCounts.find(
          (item) => item.source === "WEBSITE"
        )?._count.source ?? 0,
    },
    {
      name: "Email",
      count:
        channelCounts.find(
          (item) => item.source === "EMAIL"
        )?._count.source ?? 0,
    },
    {
      name: "Support",
      count:
        channelCounts.find(
          (item) => item.source === "SUPPORT"
        )?._count.source ?? 0,
    },
    {
      name: "Survey",
      count:
        channelCounts.find(
          (item) => item.source === "SURVEY"
        )?._count.source ?? 0,
    },
    {
      name: "Other",
      count:
        channelCounts.find(
          (item) => item.source === "OTHER"
        )?._count.source ?? 0,
    },
  ];

  // --------------------------------
  // Trending themes
  // --------------------------------

  const workspaceFeedbackIds = await prisma.feedback.findMany({
    where: workspaceFilter,
    select: {
      id: true,
    },
  });

  const feedbackIds = workspaceFeedbackIds.map(
    (feedback) => feedback.id
  );

  const themeFeedbackCounts =
    feedbackIds.length > 0
      ? await prisma.feedbackTheme.groupBy({
          by: ["themeId"],
          where: {
            feedbackId: {
              in: feedbackIds,
            },
          },
          _count: {
            themeId: true,
          },
        })
      : [];

  const themeIds = themeFeedbackCounts.map(
    (item) => item.themeId
  );

  const themes =
    themeIds.length > 0
      ? await prisma.theme.findMany({
          where: {
            id: {
              in: themeIds,
            },
            workspaceId,
          },
        })
      : [];

  const topThemes = themes
    .map((theme) => {
      const themeCount = themeFeedbackCounts.find(
        (item) => item.themeId === theme.id
      );

      return {
        name: theme.name,
        count: themeCount?._count.themeId ?? 0,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // --------------------------------
  // Recent feedback
  // --------------------------------

  const recentFeedback = await prisma.feedback.findMany({
    where: workspaceFilter,
    select: {
      id: true,
      content: true,
      source: true,
      sentiment: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // --------------------------------
  // Dashboard UI
  // --------------------------------

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      {/* Welcome */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session.user.name}! 👋
        </h1>

        <p className="mt-2 text-gray-500">
         Here&apos;s what&apos;s happening with your feedback today.
        </p>
      </div>

      {/* Feedback-to-Roadmap Founder Action Center */}
      <div className="mb-8 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-700">
              ◉ CLOSE THE LOOP WORKFLOW
            </div>
            <h2 className="mt-2 text-lg font-bold text-gray-900">
              Feedback-to-Roadmap Engine
            </h2>
            <p className="text-xs text-gray-500">
              Turn scattered customer feedback into evidence-backed product decisions and public roadmap updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {workspace?.slug ? (
              <Link
                href={`/portal/${workspace.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <span>🔗 Public Portal</span>
                <span className="text-[10px] text-gray-400">↗</span>
              </Link>
            ) : (
              <Link
                href="/dashboard/settings/portal"
                className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
              >
                Set Portal URL Slug
              </Link>
            )}

            <Link
              href="/dashboard/roadmap"
              className="rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
            >
              Manage Roadmap →
            </Link>
          </div>
        </div>

        {/* 4 Steps Checklist */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Link
            href="/dashboard/inbox"
            className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 hover:border-violet-200 hover:bg-white transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Step 1</span>
              <span className="text-xs font-bold text-violet-600">{totalFeedback} items</span>
            </div>
            <h3 className="mt-1 text-xs font-bold text-gray-900">Collect Feedback</h3>
            <p className="text-[11px] text-gray-500">Import CSV or ingest webhooks</p>
          </Link>

          <Link
            href="/dashboard/settings/portal"
            className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 hover:border-violet-200 hover:bg-white transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Step 2</span>
              <span className="text-xs font-bold text-emerald-600">
                {workspace?.portalEnabled ? "Active" : "Disabled"}
              </span>
            </div>
            <h3 className="mt-1 text-xs font-bold text-gray-900">Share Public Portal</h3>
            <p className="text-[11px] text-gray-500">Collect votes and ideas from users</p>
          </Link>

          <Link
            href="/dashboard/prioritization"
            className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 hover:border-violet-200 hover:bg-white transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Step 3</span>
              <span className="text-xs font-bold text-violet-600">{totalRequests} ideas</span>
            </div>
            <h3 className="mt-1 text-xs font-bold text-gray-900">Prioritize Evidence</h3>
            <p className="text-[11px] text-gray-500">Rank by votes, feedback & effort</p>
          </Link>

          <Link
            href="/dashboard/roadmap"
            className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 hover:border-violet-200 hover:bg-white transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Step 4</span>
              <span className="text-xs font-bold text-violet-600">{totalVotes} votes</span>
            </div>
            <h3 className="mt-1 text-xs font-bold text-gray-900">Close The Loop</h3>
            <p className="text-[11px] text-gray-500">Publish roadmap & notify voters</p>
          </Link>
        </div>
      </div>

      {/* Stats */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Feedback"
          value={totalFeedback}
          description="All feedback records"
        />

        <StatCard
          title="Positive Sentiment"
          value={`${positivePercentage}%`}
          description={`${positiveFeedback} positive feedback`}
        />

        <StatCard
          title="Negative Sentiment"
          value={`${negativePercentage}%`}
          description={`${negativeFeedback} negative feedback`}
        />

        <StatCard
          title="Neutral Sentiment"
          value={`${neutralPercentage}%`}
          description={`${neutralFeedback} neutral feedback`}
        />

        <StatCard
          title="New This Week"
          value={newThisWeek}
          description="Feedback received in last 7 days"
        />
      </div>

      {/* Charts */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Feedback Over Time */}

        <FeedbackChart data={feedbackChartData} />

        {/* Sentiment Distribution */}

        <Sentiment
          positive={positiveFeedback}
          neutral={neutralFeedback}
          negative={negativeFeedback}
        />
      </div>

      {/* Top Channels */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopChannels channels={topChannels} />
      </div>

      {/* Trending Themes */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopThemes themes={topThemes} />
      </div>

      {/* Recent Feedback */}

      <div className="mt-6">
        <RecentFeedback feedback={recentFeedback} />
      </div>

      {/* Quick Actions + AI Insight */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuickActions />
        <AIInsight />
      </div>

      {/* Temporary user information */}

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">
          Logged in as
        </p>

        <p className="mt-1 font-medium">
          {session.user.name}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Role: {session.user.role}
        </p>

        <div className="mt-5">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}