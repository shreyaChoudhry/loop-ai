import Link from "next/link";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/auth";

import ThemeTrendsChart from "./ThemeTrendsChart";

type ThemeStats = {
  id: string;
  name: string;
  count: number;
  positive: number;
  neutral: number;
  negative: number;
  avgSentiment: number;
  impact: number;
  currentPeriod: number;
  previousPeriod: number;
  trend: number;
  isSpiking: boolean;
};

export default async function ThemesPage() {
  // --------------------------------
  // Authentication
  // --------------------------------

  const session =
    await getServerSession(
      authOptions
    );

  if (!session?.user) {
    return null;
  }

  const workspaceId =
    session.user.workspaceId;

  if (!workspaceId) {
    return null;
  }

  // --------------------------------
  // Date ranges
  // --------------------------------

  const now = new Date();

  const currentPeriodStart =
    new Date(now);

  currentPeriodStart.setDate(
    currentPeriodStart.getDate() - 30
  );

  const previousPeriodStart =
    new Date(
      currentPeriodStart
    );

  previousPeriodStart.setDate(
    previousPeriodStart.getDate() - 30
  );

  // --------------------------------
  // Fetch themes
  // --------------------------------

  const themes =
    await prisma.theme.findMany({
      where: {
        workspaceId,
      },

      select: {
        id: true,
        name: true,
      },

      orderBy: {
        name: "asc",
      },
    });

  // --------------------------------
  // Fetch theme relations
  // --------------------------------

  const themeRelations =
    themes.length > 0
      ? await prisma.feedbackTheme.findMany({
          where: {
            theme: {
              workspaceId,
            },

            feedback: {
              workspaceId,
            },
          },

          select: {
            themeId: true,

            feedback: {
              select: {
                id: true,
                sentiment: true,
                sentimentScore: true,
                createdAt: true,
              },
            },
          },
        })
      : [];

  // --------------------------------
  // Build statistics
  // --------------------------------

  const themeStats: ThemeStats[] =
    themes.map((theme) => {
      const relations =
        themeRelations.filter(
          (relation) =>
            relation.themeId ===
            theme.id
        );

      const count =
        relations.length;

      const positive =
        relations.filter(
          (relation) =>
            relation.feedback
              .sentiment ===
            "POSITIVE"
        ).length;

      const neutral =
        relations.filter(
          (relation) =>
            relation.feedback
              .sentiment ===
            "NEUTRAL"
        ).length;

      const negative =
        relations.filter(
          (relation) =>
            relation.feedback
              .sentiment ===
            "NEGATIVE"
        ).length;

      const scores =
        relations
          .map(
            (relation) =>
              relation.feedback
                .sentimentScore
          )
          .filter(
            (
              score
            ): score is number =>
              typeof score ===
              "number"
          );

      const avgSentiment =
        scores.length > 0
          ? scores.reduce(
              (
                total,
                score
              ) =>
                total + score,
              0
            ) /
            scores.length
          : 0;

      // --------------------------------
      // Impact score
      //
      // Combines:
      // - volume
      // - negative feedback
      // - sentiment intensity
      // --------------------------------

      const volumeScore =
        Math.min(
          4,
          count / 10
        );

      const negativeScore =
        count > 0
          ? (negative /
              count) *
            4
          : 0;

      const intensityScore =
        Math.abs(
          avgSentiment
        ) * 2;

      const impact =
        Math.min(
          10,
          Number(
            (
              volumeScore +
              negativeScore +
              intensityScore
            ).toFixed(1)
          )
        );

      // --------------------------------
      // Current 30 days
      // --------------------------------

      const currentPeriod =
        relations.filter(
          (relation) =>
            relation.feedback
              .createdAt >=
            currentPeriodStart
        ).length;

      // --------------------------------
      // Previous 30 days
      // --------------------------------

      const previousPeriod =
        relations.filter(
          (relation) => {
            const date =
              relation.feedback
                .createdAt;

            return (
              date >=
                previousPeriodStart &&
              date <
                currentPeriodStart
            );
          }
        ).length;

      // --------------------------------
      // Trend percentage
      // --------------------------------

      let trend = 0;

      if (
        previousPeriod === 0
      ) {
        trend =
          currentPeriod > 0
            ? 100
            : 0;
      } else {
        trend = Math.round(
          ((currentPeriod -
            previousPeriod) /
            previousPeriod) *
            100
        );
      }

      // --------------------------------
      // Spike detection
      // --------------------------------

      const isSpiking =
        currentPeriod >= 2 &&
        currentPeriod >
          previousPeriod * 1.5;

      return {
        id: theme.id,
        name: theme.name,
        count,
        positive,
        neutral,
        negative,
        avgSentiment,
        impact,
        currentPeriod,
        previousPeriod,
        trend,
        isSpiking,
      };
    });

  // --------------------------------
  // Sort by count
  // --------------------------------

  themeStats.sort(
    (a, b) =>
      b.count - a.count
  );

  // --------------------------------
  // Top themes for chart
  // --------------------------------

  const topThemes =
    themeStats.slice(0, 8);

  // --------------------------------
  // Build daily trend data
  // --------------------------------

  const trendData: Array<
    Record<string, string | number>
  > = [];

  for (
    let i = 29;
    i >= 0;
    i--
  ) {
    const date =
      new Date(now);

    date.setDate(
      date.getDate() - i
    );

    const dayStart =
      new Date(date);

    dayStart.setHours(
      0,
      0,
      0,
      0
    );

    const dayEnd =
      new Date(dayStart);

    dayEnd.setDate(
      dayEnd.getDate() + 1
    );

    const point: Record<
      string,
      string | number
    > = {
      date:
        dayStart.toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
          }
        ),
    };

    topThemes.forEach(
      (theme) => {
        const count =
          themeRelations.filter(
            (relation) => {
              if (
                relation.themeId !==
                theme.id
              ) {
                return false;
              }

              const createdAt =
                relation.feedback
                  .createdAt;

              return (
                createdAt >=
                  dayStart &&
                createdAt <
                  dayEnd
              );
            }
          ).length;

        point[
          theme.name
        ] = count;
      }
    );

    trendData.push(point);
  }

  // --------------------------------
  // Overall stats
  // --------------------------------

  const totalThemes =
    themeStats.length;

  const totalFeedbackWithThemes =
    themeRelations.length;

  const spikingThemes =
    themeStats.filter(
      (theme) =>
        theme.isSpiking
    );

  const averageImpact =
    totalThemes > 0
      ? (
          themeStats.reduce(
            (sum, theme) =>
              sum + theme.impact,
            0
          ) /
          totalThemes
        ).toFixed(1)
      : "0.0";

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <main className="space-y-6">
      {/* Header */}

      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Themes
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              See what customers are
              talking about and which
              themes are growing.
            </p>
          </div>

          <Link
            href="/dashboard/inbox"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            View Feedback
          </Link>
        </div>
      </div>

      {/* Summary cards */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">
            Total Themes
          </p>

          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {totalThemes}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            AI-generated themes
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">
            Feedback in Themes
          </p>

          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {totalFeedbackWithThemes}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            Theme assignments
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">
            Spiking Themes
          </p>

          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {spikingThemes.length}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            Compared with previous
            30 days
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">
            Average Impact
          </p>

          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {averageImpact}
            <span className="text-base font-normal text-zinc-400">
              /10
            </span>
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            Volume + sentiment
          </p>
        </div>
      </div>

      {/* Theme list */}

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">
            Theme Clustering
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Similar feedback is grouped
            into themes. Click a theme
            to see the underlying
            feedback.
          </p>
        </div>

        {themeStats.length ===
        0 ? (
          <div className="flex min-h-48 items-center justify-center px-6">
            <p className="text-sm text-zinc-500">
              No themes available yet.
              Import or simulate
              feedback to create
              themes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {themeStats.map(
              (theme) => (
                <div
                  key={theme.id}
                  className="flex flex-col gap-4 px-6 py-5 transition hover:bg-zinc-50 md:flex-row md:items-center md:justify-between"
                >
                  {/* Name */}

                  <div className="min-w-0 md:w-1/4">
                    <Link
                      href={`/dashboard/inbox?theme=${theme.id}`}
                      className="text-base font-semibold text-zinc-900 hover:text-purple-600"
                    >
                      {theme.name}
                    </Link>

                    <p className="mt-1 text-xs text-zinc-400">
                      {theme.count} feedback
                      {theme.count !==
                      1
                        ? "s"
                        : ""}
                    </p>
                  </div>

                  {/* Sentiment */}

                  <div className="flex items-center gap-2 md:w-1/4">
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-zinc-500">
                          Sentiment
                        </span>

                        <span className="font-medium text-zinc-700">
                          {Math.round(
                            theme.avgSentiment *
                              100
                          ) / 100}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className={`h-full rounded-full ${
                            theme.avgSentiment >=
                            0.2
                              ? "bg-green-500"
                              : theme.avgSentiment <=
                                  -0.2
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                5,
                                Math.abs(
                                  theme.avgSentiment
                                ) *
                                  100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sentiment breakdown */}

                  <div className="flex items-center gap-2 md:w-1/4">
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      +{theme.positive}
                    </span>

                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                      {theme.neutral}
                    </span>

                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                      -{theme.negative}
                    </span>
                  </div>

                  {/* Impact + trend */}

                  <div className="flex items-center gap-5 md:w-1/4 md:justify-end">
                    <div>
                      <p className="text-xs text-zinc-400">
                        Impact
                      </p>

                      <p className="text-sm font-semibold text-zinc-900">
                        {theme.impact}
                        /10
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-400">
                        30d trend
                      </p>

                      <p
                        className={`text-sm font-semibold ${
                          theme.trend >
                          0
                            ? "text-green-600"
                            : theme.trend <
                                0
                              ? "text-red-600"
                              : "text-zinc-500"
                        }`}
                      >
                        {theme.trend >
                        0
                          ? "↑"
                          : theme.trend <
                              0
                            ? "↓"
                            : "→"}{" "}
                        {Math.abs(
                          theme.trend
                        )}
                        %
                      </p>
                    </div>

                    {theme.isSpiking && (
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                        Spiking
                      </span>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* Trends */}

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-5">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Theme Trends
              </h2>

              <p className="text-sm text-zinc-500">
                Daily theme volume over
                the last 30 days.
              </p>
            </div>

            {spikingThemes.length >
              0 && (
              <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                {spikingThemes.length}{" "}
                theme
                {spikingThemes.length !==
                1
                  ? "s are"
                  : " is"}{" "}
                currently spiking
              </div>
            )}
          </div>
        </div>

        {topThemes.length ===
        0 ? (
          <div className="flex min-h-72 items-center justify-center">
            <p className="text-sm text-zinc-500">
              No trend data available
              yet.
            </p>
          </div>
        ) : (
          <div className="p-6">
            <ThemeTrendsChart
              data={trendData}
              themes={topThemes.map(
                (theme) =>
                  theme.name
              )}
            />
          </div>
        )}
      </section>
    </main>
  );
}