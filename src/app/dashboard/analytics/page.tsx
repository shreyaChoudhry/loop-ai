import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

import VolumeChart from "./VolumeChart";
import SentimentTrendChart from "./SentimentTrendChart";
import ChannelChart from "./ChannelChart";
import RatingChart from "./RatingChart";
import ThemeImpactChart from "./ThemeImpactChart";

export default async function AnalyticsPage() {
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
  // Get all feedback for workspace
  // --------------------------------

  const feedback = await prisma.feedback.findMany({
    where: {
      workspaceId,
    },
    select: {
      id: true,
      createdAt: true,
      sentiment: true,
      source: true,
      rating: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // --------------------------------
  // Basic overview
  // --------------------------------

  const totalFeedback = feedback.length;

  const ratedFeedback = feedback.filter(
    (item) => item.rating !== null
  );

  const averageRating =
    ratedFeedback.length > 0
      ? (
          ratedFeedback.reduce(
            (sum, item) => sum + (item.rating ?? 0),
            0
          ) / ratedFeedback.length
        ).toFixed(1)
      : "0.0";

  const negativeFeedback = feedback.filter(
    (item) => item.sentiment === "NEGATIVE"
  ).length;

  const positiveFeedback = feedback.filter(
    (item) => item.sentiment === "POSITIVE"
  ).length;

  // --------------------------------
  // Feedback volume
  // --------------------------------

  const volumeMap = new Map<
    string,
    {
      date: string;
      count: number;
    }
  >();

  feedback.forEach((item) => {
    const date = new Date(item.createdAt)
      .toISOString()
      .split("T")[0];

    const existing = volumeMap.get(date);

    if (existing) {
      existing.count += 1;
    } else {
      volumeMap.set(date, {
        date,
        count: 1,
      });
    }
  });

  const volumeData = Array.from(volumeMap.values()).slice(-30);

  // --------------------------------
  // Sentiment trend
  // --------------------------------

  const sentimentMap = new Map<
    string,
    {
      date: string;
      positive: number;
      neutral: number;
      negative: number;
    }
  >();

  feedback.forEach((item) => {
    const date = new Date(item.createdAt)
      .toISOString()
      .split("T")[0];

    let existing = sentimentMap.get(date);

    if (!existing) {
      existing = {
        date,
        positive: 0,
        neutral: 0,
        negative: 0,
      };

      sentimentMap.set(date, existing);
    }

    if (item.sentiment === "POSITIVE") {
      existing.positive += 1;
    }

    if (item.sentiment === "NEUTRAL") {
      existing.neutral += 1;
    }

    if (item.sentiment === "NEGATIVE") {
      existing.negative += 1;
    }
  });

  const sentimentTrendData = Array.from(
    sentimentMap.values()
  ).slice(-30);

  // --------------------------------
  // Channel breakdown
  // --------------------------------

  const channelMap = new Map<string, number>();

  feedback.forEach((item) => {
    const current = channelMap.get(item.source) ?? 0;

    channelMap.set(item.source, current + 1);
  });

  const channelLabels: Record<string, string> = {
    WEBSITE: "Website",
    EMAIL: "Email",
    SUPPORT: "Support",
    SURVEY: "Survey",
    OTHER: "Other",
  };

  const channelData = Array.from(channelMap.entries())
    .map(([source, count]) => ({
      name: channelLabels[source] ?? source,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // --------------------------------
  // Rating distribution
  // --------------------------------

  const ratingData = [1, 2, 3, 4, 5].map((rating) => ({
    rating: `${rating} Star`,
    count: feedback.filter(
      (item) => item.rating === rating
    ).length,
  }));

  // --------------------------------
  // Theme impact
  // --------------------------------

  const feedbackIds = feedback.map((item) => item.id);

  const feedbackThemes =
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

  const themeIds = Array.from(
    new Set(feedbackThemes.map((item) => item.themeId))
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
          select: {
            id: true,
            name: true,
          },
        })
      : [];

  const feedbackById = new Map(
    feedback.map((item) => [item.id, item])
  );

  const themeImpactMap = new Map<
    string,
    {
      themeId: string;
      name: string;
      mentions: number;
      negative: number;
    }
  >();

  feedbackThemes.forEach((relation) => {
    const theme = themes.find(
      (item) => item.id === relation.themeId
    );

    const feedbackItem = feedbackById.get(
      relation.feedbackId
    );

    if (!theme || !feedbackItem) {
      return;
    }

    const existing = themeImpactMap.get(theme.id);

    if (existing) {
      existing.mentions += 1;

      if (feedbackItem.sentiment === "NEGATIVE") {
        existing.negative += 1;
      }
    } else {
      themeImpactMap.set(theme.id, {
        themeId: theme.id,
        name: theme.name,
        mentions: 1,
        negative:
          feedbackItem.sentiment === "NEGATIVE"
            ? 1
            : 0,
      });
    }
  });

  const themeImpactData = Array.from(
    themeImpactMap.values()
  )
    .map((theme) => ({
      name: theme.name,
      mentions: theme.mentions,
      negative: theme.negative,
      negativeRate:
        theme.mentions > 0
          ? Math.round(
              (theme.negative / theme.mentions) * 100
            )
          : 0,
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10);

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      {/* Header */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Analytics
        </h1>

        <p className="mt-2 text-gray-500">
          Understand feedback volume, sentiment, channels,
          ratings, and customer themes.
        </p>
      </div>

      {/* Overview Cards */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Feedback
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {totalFeedback}
          </h2>

          <p className="mt-2 text-xs text-gray-500">
            Records in this workspace
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Average Rating
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {averageRating}
            <span className="ml-1 text-lg text-gray-400">
              / 5
            </span>
          </h2>

          <p className="mt-2 text-xs text-gray-500">
            Based on rated feedback
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Positive Feedback
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {positiveFeedback}
          </h2>

          <p className="mt-2 text-xs text-gray-500">
            Positive sentiment records
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Negative Feedback
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            {negativeFeedback}
          </h2>

          <p className="mt-2 text-xs text-gray-500">
            Records requiring attention
          </p>
        </div>
      </div>

      {/* Volume + Sentiment */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VolumeChart data={volumeData} />

        <SentimentTrendChart
          data={sentimentTrendData}
        />
      </div>

      {/* Channels + Ratings */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChannelChart data={channelData} />

        <RatingChart data={ratingData} />
      </div>

      {/* Theme Impact */}

      <div className="mt-6">
        <ThemeImpactChart data={themeImpactData} />
      </div>
    </main>
  );
}