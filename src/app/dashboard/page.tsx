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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const workspaceId = session.user.workspaceId;

  if (!workspaceId) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <h1 className="text-base font-bold text-rose-800">Workspace not found</h1>
        <p className="mt-1 text-xs text-rose-600">
          Your account is not connected to a workspace.
        </p>
      </div>
    );
  }

  const workspaceFilter = { workspaceId };

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

  const totalFeedback = await prisma.feedback.count({
    where: workspaceFilter,
  });

  const positiveFeedback = await prisma.feedback.count({
    where: { ...workspaceFilter, sentiment: "POSITIVE" },
  });

  const neutralFeedback = await prisma.feedback.count({
    where: { ...workspaceFilter, sentiment: "NEUTRAL" },
  });

  const negativeFeedback = await prisma.feedback.count({
    where: { ...workspaceFilter, sentiment: "NEGATIVE" },
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newThisWeek = await prisma.feedback.count({
    where: {
      ...workspaceFilter,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  const positivePercentage =
    totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 0;
  const neutralPercentage =
    totalFeedback > 0 ? Math.round((neutralFeedback / totalFeedback) * 100) : 0;
  const negativePercentage =
    totalFeedback > 0 ? Math.round((negativeFeedback / totalFeedback) * 100) : 0;

  // Chart data
  const feedbackRecords = await prisma.feedback.findMany({
    where: workspaceFilter,
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const feedbackChartData: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split("T")[0];

    const count = feedbackRecords.filter((feedback) => {
      const feedbackDate = new Date(feedback.createdAt).toISOString().split("T")[0];
      return feedbackDate === dateString;
    }).length;

    feedbackChartData.push({ date: dateString, count });
  }

  // Top channels
  const channelCounts = await prisma.feedback.groupBy({
    by: ["source"],
    where: workspaceFilter,
    _count: { source: true },
  });

  const topChannels = [
    {
      name: "Website",
      count: channelCounts.find((item) => item.source === "WEBSITE")?._count.source ?? 0,
    },
    {
      name: "Email",
      count: channelCounts.find((item) => item.source === "EMAIL")?._count.source ?? 0,
    },
    {
      name: "Support",
      count: channelCounts.find((item) => item.source === "SUPPORT")?._count.source ?? 0,
    },
    {
      name: "Survey",
      count: channelCounts.find((item) => item.source === "SURVEY")?._count.source ?? 0,
    },
    {
      name: "Other",
      count: channelCounts.find((item) => item.source === "OTHER")?._count.source ?? 0,
    },
  ];

  // Top themes
  const workspaceFeedbackIds = await prisma.feedback.findMany({
    where: workspaceFilter,
    select: { id: true },
  });

  const feedbackIds = workspaceFeedbackIds.map((feedback) => feedback.id);
  const themeFeedbackCounts =
    feedbackIds.length > 0
      ? await prisma.feedbackTheme.groupBy({
          by: ["themeId"],
          where: { feedbackId: { in: feedbackIds } },
          _count: { themeId: true },
        })
      : [];

  const themeIds = themeFeedbackCounts.map((item) => item.themeId);
  const themes =
    themeIds.length > 0
      ? await prisma.theme.findMany({
          where: { id: { in: themeIds }, workspaceId },
        })
      : [];

  const topThemes = themes
    .map((theme) => {
      const themeCount = themeFeedbackCounts.find((item) => item.themeId === theme.id);
      return {
        name: theme.name,
        count: themeCount?._count.themeId ?? 0,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Recent feedback
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
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {session.user.name}! 👋
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Here is what is happening across your customer signals and roadmap today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {workspace?.slug && (
            <Link
              href={`/portal/${workspace.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <span>🔗 Public Portal</span>
              <span className="text-[10px] text-slate-400">↗</span>
            </Link>
          )}

          <Link
            href="/dashboard/prioritization"
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition"
          >
            <span>Evidence Matrix</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* CLOSE THE LOOP FOUNDER WORKFLOW */}
      <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50/40 via-white to-purple-50/20 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-purple-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100/80 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 tracking-wider uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse" />
              Close The Loop Engine
            </div>
            <h2 className="mt-1.5 text-base font-bold text-slate-900">
              Transform Feedback into Defensible Product Decisions
            </h2>
            <p className="text-xs text-slate-500">
              A 4-step systematic pipeline connecting raw customer voice to a prioritized roadmap.
            </p>
          </div>

          <Link
            href="/dashboard/roadmap"
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition shadow-sm shrink-0"
          >
            <span>Manage Roadmap</span>
            <span>→</span>
          </Link>
        </div>

        {/* 4 Steps Checklist */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/inbox"
            className="rounded-xl border border-slate-200/80 bg-white p-3.5 hover:border-purple-300 hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Step 1</span>
              <span className="text-xs font-bold text-purple-700">{totalFeedback} items</span>
            </div>
            <h3 className="mt-1 text-xs font-bold text-slate-900">Collect Feedback</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Import CSV or ingest webhooks</p>
          </Link>

          <Link
            href="/dashboard/settings/portal"
            className="rounded-xl border border-slate-200/80 bg-white p-3.5 hover:border-purple-300 hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Step 2</span>
              <span className={`text-xs font-bold ${workspace?.portalEnabled ? "text-emerald-600" : "text-amber-600"}`}>
                {workspace?.portalEnabled ? "Active" : "Disabled"}
              </span>
            </div>
            <h3 className="mt-1 text-xs font-bold text-slate-900">Share Public Portal</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Collect votes and ideas from users</p>
          </Link>

          <Link
            href="/dashboard/prioritization"
            className="rounded-xl border border-slate-200/80 bg-white p-3.5 hover:border-purple-300 hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Step 3</span>
              <span className="text-xs font-bold text-purple-700">{totalRequests} ideas</span>
            </div>
            <h3 className="mt-1 text-xs font-bold text-slate-900">Prioritize Evidence</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Mathematical algorithmic ranking</p>
          </Link>

          <Link
            href="/dashboard/roadmap"
            className="rounded-xl border border-slate-200/80 bg-white p-3.5 hover:border-purple-300 hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Step 4</span>
              <span className="text-xs font-bold text-purple-700">{totalVotes} votes</span>
            </div>
            <h3 className="mt-1 text-xs font-bold text-slate-900">Close The Loop</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Publish roadmap & notify voters</p>
          </Link>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Feedback"
          value={totalFeedback}
          description="All feedback records ingested"
          trend="+18%"
          trendPositive={true}
        />
        <StatCard
          title="Positive Sentiment"
          value={`${positivePercentage}%`}
          description={`${positiveFeedback} positive signals`}
          trend="+4.2%"
          trendPositive={true}
        />
        <StatCard
          title="Negative Sentiment"
          value={`${negativePercentage}%`}
          description={`${negativeFeedback} friction points`}
          trend="-2.1%"
          trendPositive={true}
        />
        <StatCard
          title="Neutral Sentiment"
          value={`${neutralPercentage}%`}
          description={`${neutralFeedback} neutral signals`}
        />
        <StatCard
          title="New This Week"
          value={newThisWeek}
          description="Signals in last 7 days"
          trend="+12 this wk"
          trendPositive={true}
        />
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FeedbackChart data={feedbackChartData} />
        <Sentiment
          positive={positiveFeedback}
          neutral={neutralFeedback}
          negative={negativeFeedback}
        />
      </div>

      {/* CHANNELS & THEMES GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopChannels channels={topChannels} />
        <TopThemes themes={topThemes} />
      </div>

      {/* RECENT FEEDBACK */}
      <RecentFeedback feedback={recentFeedback} />

      {/* QUICK ACTIONS & AI INSIGHT */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuickActions />
        <AIInsight />
      </div>
    </div>
  );
}