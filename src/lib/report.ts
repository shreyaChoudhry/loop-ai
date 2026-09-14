import prisma from "@/lib/prisma";
type ReportFeedback = {
  id: string;
  content: string;
  sentiment: string | null;
  sentimentScore: number | null;
  category: string | null;
  rating: number | null;
  source: string | null;
  createdAt: Date;
};

type ReportTheme = {
  name: string;
  count: number;
  negative: number;
  positive: number;
  averageSentiment: number;
};

export type VoiceOfCustomerReport = {
  title: string;
  periodStart: Date;
  periodEnd: Date;
  content: string;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function getWeekRange(
  latestDate: Date
): {
  start: Date;
  end: Date;
} {
  const end = new Date(latestDate);

  end.setHours(23, 59, 59, 999);

  const start = new Date(end);

  start.setDate(
    start.getDate() - 6
  );

  start.setHours(0, 0, 0, 0);

  return {
    start,
    end,
  };
}

function buildReportContent(
  feedback: ReportFeedback[],
  themes: ReportTheme[],
  periodStart: Date,
  periodEnd: Date
): string {
  const total = feedback.length;

  const positive = feedback.filter(
    (item) =>
      item.sentiment === "POSITIVE"
  ).length;

  const negative = feedback.filter(
    (item) =>
      item.sentiment === "NEGATIVE"
  ).length;

  const neutral = feedback.filter(
    (item) =>
      item.sentiment === "NEUTRAL"
  ).length;

  const positiveRate =
    total > 0
      ? positive / total
      : 0;

  const negativeRate =
    total > 0
      ? negative / total
      : 0;

  const topComplaints = [
    ...themes,
  ]
    .filter(
      (theme) =>
        theme.negative > 0
    )
    .sort(
      (a, b) =>
        b.negative - a.negative
    )
    .slice(0, 5);

  const customerWins = [
    ...themes,
  ]
    .filter(
      (theme) =>
        theme.positive > 0
    )
    .sort(
      (a, b) =>
        b.positive - a.positive
    )
    .slice(0, 5);

  const emergingIssues = [
    ...themes,
  ]
    .filter(
      (theme) =>
        theme.negative > 0
    )
    .sort(
      (a, b) =>
        b.count - a.count
    )
    .slice(0, 3);

  const recommendedActions =
    topComplaints
      .slice(0, 3)
      .map(
        (theme, index) =>
          `${index + 1}. Investigate ${theme.name.toLowerCase()} based on ${theme.negative} negative feedback item${theme.negative === 1 ? "" : "s"}.`
      );

  const notableNegativeQuotes =
    feedback
      .filter(
        (item) =>
          item.sentiment ===
          "NEGATIVE"
      )
      .sort(
        (a, b) =>
          (a.rating ?? 3) -
          (b.rating ?? 3)
      )
      .slice(0, 3);

  const notablePositiveQuotes =
    feedback
      .filter(
        (item) =>
          item.sentiment ===
          "POSITIVE"
      )
      .sort(
        (a, b) =>
          (b.rating ?? 0) -
          (a.rating ?? 0)
      )
      .slice(0, 3);

  const complaintText =
    topComplaints.length > 0
      ? topComplaints
          .map(
            (theme) =>
              `• ${theme.name} — ${theme.negative} negative feedback item${theme.negative === 1 ? "" : "s"}`
          )
          .join("\n")
      : "• No significant complaints identified in this period.";

  const winsText =
    customerWins.length > 0
      ? customerWins
          .map(
            (theme) =>
              `• ${theme.name} — ${theme.positive} positive feedback item${theme.positive === 1 ? "" : "s"}`
          )
          .join("\n")
      : "• No clear customer wins identified in this period.";

  const emergingText =
    emergingIssues.length > 0
      ? emergingIssues
          .map(
            (theme) =>
              `• ${theme.name} — ${theme.count} total feedback item${theme.count === 1 ? "" : "s"}`
          )
          .join("\n")
      : "• No emerging issues identified.";

  const actionsText =
    recommendedActions.length > 0
      ? recommendedActions.join("\n")
      : "1. Continue monitoring customer feedback.";

  const negativeQuotesText =
    notableNegativeQuotes.length > 0
      ? notableNegativeQuotes
          .map(
            (item) =>
              `• "${item.content}"`
          )
          .join("\n")
      : "• No negative customer quotes available.";

  const positiveQuotesText =
    notablePositiveQuotes.length > 0
      ? notablePositiveQuotes
          .map(
            (item) =>
              `• "${item.content}"`
          )
          .join("\n")
      : "• No positive customer quotes available.";

  return `VOICE OF CUSTOMER

Weekly Customer Insights
${formatDate(periodStart)} - ${formatDate(periodEnd)}

EXECUTIVE SUMMARY
────────────────────────

LOOP analyzed ${total} customer feedback item${total === 1 ? "" : "s"} during this period.

Positive feedback: ${positive} (${formatPercent(positiveRate)})
Neutral feedback: ${neutral}
Negative feedback: ${negative} (${formatPercent(negativeRate)})

TOP COMPLAINTS
────────────────────────

${complaintText}

CUSTOMER WINS
────────────────────────

${winsText}

EMERGING ISSUES
────────────────────────

${emergingText}

RECOMMENDED ACTIONS
────────────────────────

${actionsText}

NOTABLE NEGATIVE FEEDBACK
────────────────────────

${negativeQuotesText}

CUSTOMER WINS — NOTABLE FEEDBACK
────────────────────────

${positiveQuotesText}

REPORT METHODOLOGY
────────────────────────

This report is generated from feedback belonging to the authenticated workspace and the selected reporting period. Theme and sentiment statistics are calculated from the stored feedback classifications.

Total feedback analyzed: ${total}
`;
}

export async function generateVoiceOfCustomerReport(
  workspaceId: string,
  startDate?: Date,
  endDate?: Date
): Promise<VoiceOfCustomerReport> {
  let periodStart: Date;
  let periodEnd: Date;

  if (startDate && endDate) {
    periodStart = new Date(startDate);
    periodEnd = new Date(endDate);

    periodStart.setHours(
      0,
      0,
      0,
      0
    );

    periodEnd.setHours(
      23,
      59,
      59,
      999
    );
  } else {
    const latestFeedback =
      await prisma.feedback.findFirst({
        where: {
          workspaceId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          createdAt: true,
        },
      });

    const latestDate =
      latestFeedback?.createdAt ??
      new Date();

    const range =
      getWeekRange(latestDate);

    periodStart = range.start;
    periodEnd = range.end;
  }

  const feedback =
    await prisma.feedback.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        content: true,
        sentiment: true,
        sentimentScore: true,
        category: true,
        rating: true,
        source: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  const themeRelations =
    await prisma.feedbackTheme.findMany({
      where: {
        feedback: {
          workspaceId,
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      },
      select: {
        feedbackId: true,
        theme: {
          select: {
            id: true,
            name: true,
          },
        },
        feedback: {
          select: {
            sentiment: true,
            sentimentScore: true,
          },
        },
      },
    });

  const themeMap =
    new Map<string, ReportTheme>();

  for (const relation of themeRelations) {
    const themeName =
      relation.theme.name;

    const existing =
      themeMap.get(themeName) ?? {
        name: themeName,
        count: 0,
        negative: 0,
        positive: 0,
        averageSentiment: 0,
      };

    existing.count++;

    if (
      relation.feedback
        .sentiment === "NEGATIVE"
    ) {
      existing.negative++;
    }

    if (
      relation.feedback
        .sentiment === "POSITIVE"
    ) {
      existing.positive++;
    }

    const score =
      relation.feedback
        .sentimentScore ?? 0;

    existing.averageSentiment +=
      score;

    themeMap.set(
      themeName,
      existing
    );
  }

  const themes =
    Array.from(
      themeMap.values()
    ).map((theme) => ({
      ...theme,
      averageSentiment:
        theme.count > 0
          ? theme.averageSentiment /
            theme.count
          : 0,
    }));

  const title = `Weekly Customer Insights — ${formatDate(
    periodStart
  )} - ${formatDate(periodEnd)}`;

  const content =
    buildReportContent(
      feedback,
      themes,
      periodStart,
      periodEnd
    );

  return {
    title,
    periodStart,
    periodEnd,
    content,
  };
}