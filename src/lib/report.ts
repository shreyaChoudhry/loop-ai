import prisma from "@/lib/prisma";

type FeedbackRow = {
  id: string;
  content: string;
  sentiment: string | null;
  sentimentScore: number | null;
  category: string | null;
  rating: number | null;
  source: string | null;
  createdAt: Date;
};

type ThemeStat = {
  name: string;
  total: number;
  positive: number;
  negative: number;
  neutral: number;
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function percent(value: number, total: number) {
  if (!total) return 0;

  return Math.round((value / total) * 100);
}

function clean(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/•/g, "")
    .replace(/’/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateVoiceOfCustomerReport(
  workspaceId: string,
  startDate?: Date,
  endDate?: Date
) {
  /*
   * =========================================================
   * REPORT PERIOD
   * =========================================================
   */

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

  if (!latestFeedback) {
    throw new Error(
      "No feedback available for this workspace."
    );
  }

  const periodEnd =
    endDate ??
    latestFeedback.createdAt;

  const periodStart =
    startDate ??
    new Date(
      periodEnd.getTime() -
        6 * 24 * 60 * 60 * 1000
    );

  /*
   * Use an exclusive upper bound.
   * This makes the entire end date inclusive.
   */

  const periodEndExclusive =
    new Date(periodEnd);

  periodEndExclusive.setHours(
    23,
    59,
    59,
    999
  );

  /*
   * =========================================================
   * FEEDBACK
   * =========================================================
   */

  const feedback =
    (await prisma.feedback.findMany({
      where: {
        workspaceId,

        createdAt: {
          gte: periodStart,
          lte: periodEndExclusive,
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
    })) as FeedbackRow[];

  const total = feedback.length;

  if (!total) {
    throw new Error(
      `No feedback found between ${formatDate(
        periodStart
      )} and ${formatDate(periodEnd)}.`
    );
  }

  /*
   * =========================================================
   * SENTIMENT
   * =========================================================
   */

  const positive = feedback.filter(
    (item) =>
      item.sentiment === "POSITIVE"
  ).length;

  const neutral = feedback.filter(
    (item) =>
      item.sentiment === "NEUTRAL"
  ).length;

  const negative = feedback.filter(
    (item) =>
      item.sentiment === "NEGATIVE"
  ).length;

  /*
   * =========================================================
   * RATING
   * =========================================================
   */

  const ratings = feedback
    .map((item) => item.rating)
    .filter(
      (value): value is number =>
        typeof value === "number"
    );

  const averageRating =
    ratings.length > 0
      ? ratings.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / ratings.length
      : null;

  /*
   * =========================================================
   * SOURCES
   * =========================================================
   */

  const sourceMap =
    new Map<string, number>();

  for (const item of feedback) {
    const source =
      item.source ?? "OTHER";

    sourceMap.set(
      source,
      (sourceMap.get(source) ?? 0) + 1
    );
  }

  const sources =
    Array.from(sourceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

  /*
   * =========================================================
   * CATEGORIES
   * =========================================================
   */

  const categoryMap =
    new Map<string, number>();

  for (const item of feedback) {
    if (!item.category) continue;

    categoryMap.set(
      item.category,
      (categoryMap.get(item.category) ?? 0) + 1
    );
  }

  const categories =
    Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

  /*
   * =========================================================
   * THEMES
   * =========================================================
   */

  const relations =
    await prisma.feedbackTheme.findMany({
      where: {
        feedback: {
          workspaceId,

          createdAt: {
            gte: periodStart,
            lte: periodEndExclusive,
          },
        },
      },

      select: {
        theme: {
          select: {
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
    new Map<string, ThemeStat>();

  for (const relation of relations) {
    const name =
      relation.theme.name;

    const current =
      themeMap.get(name) ?? {
        name,
        total: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
      };

    current.total += 1;

    if (
      relation.feedback.sentiment ===
      "POSITIVE"
    ) {
      current.positive += 1;
    }

    if (
      relation.feedback.sentiment ===
      "NEGATIVE"
    ) {
      current.negative += 1;
    }

    if (
      relation.feedback.sentiment ===
      "NEUTRAL"
    ) {
      current.neutral += 1;
    }

    themeMap.set(name, current);
  }

  const themes =
    Array.from(themeMap.values());

  const topThemes =
    [...themes]
      .sort(
        (a, b) =>
          b.total - a.total
      )
      .slice(0, 5);

  const negativeThemes =
    [...themes]
      .filter(
        (theme) =>
          theme.negative > 0
      )
      .sort((a, b) => {
        if (
          b.negative !==
          a.negative
        ) {
          return (
            b.negative -
            a.negative
          );
        }

        return (
          b.total -
          a.total
        );
      })
      .slice(0, 3);

  const positiveThemes =
    [...themes]
      .filter(
        (theme) =>
          theme.positive > 0
      )
      .sort((a, b) => {
        if (
          b.positive !==
          a.positive
        ) {
          return (
            b.positive -
            a.positive
          );
        }

        return (
          b.total -
          a.total
        );
      })
      .slice(0, 3);

  /*
   * =========================================================
   * PREVIOUS PERIOD
   * =========================================================
   */

  const periodLength =
    periodEnd.getTime() -
    periodStart.getTime();

  const previousEnd =
    new Date(
      periodStart.getTime() - 1
    );

  const previousStart =
    new Date(
      previousEnd.getTime() -
        periodLength
    );

  const previousFeedback =
    await prisma.feedback.count({
      where: {
        workspaceId,

        createdAt: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
    });

  const volumeChange =
    previousFeedback > 0
      ? Math.round(
          ((total -
            previousFeedback) /
            previousFeedback) *
            100
        )
      : 0;

  /*
   * =========================================================
   * FINDINGS
   * =========================================================
   */

  const findings: string[] = [];

  findings.push(
    `${positive} of ${total} feedback items are positive (${percent(
      positive,
      total
    )}%).`
  );

  findings.push(
    `${negative} of ${total} feedback items are negative (${percent(
      negative,
      total
    )}%).`
  );

  if (negativeThemes[0]) {
    findings.push(
      `${negativeThemes[0].name} has the highest negative feedback volume with ${negativeThemes[0].negative} items.`
    );
  }

  if (positiveThemes[0]) {
    findings.push(
      `${positiveThemes[0].name} has the highest positive feedback volume with ${positiveThemes[0].positive} items.`
    );
  }

  if (volumeChange !== 0) {
    findings.push(
      `Feedback volume changed by ${
        volumeChange > 0
          ? "+"
          : ""
      }${volumeChange}% versus the previous period.`
    );
  }

  /*
   * =========================================================
   * ACTIONS
   * =========================================================
   */

  const actions: string[] = [];

  for (
    const theme of negativeThemes.slice(
      0,
      2
    )
  ) {
    actions.push(
      `Investigate ${theme.name} based on ${theme.negative} negative feedback items.`
    );
  }

  if (positiveThemes[0]) {
    actions.push(
      `Continue monitoring ${positiveThemes[0].name}, which generated ${positiveThemes[0].positive} positive feedback items.`
    );
  }

  /*
   * =========================================================
   * CUSTOMER EVIDENCE
   * =========================================================
   */

  const negativeQuotes =
    feedback
      .filter(
        (item) =>
          item.sentiment ===
          "NEGATIVE"
      )
      .sort(
        (a, b) =>
          (a.sentimentScore ?? -1) -
          (b.sentimentScore ?? -1)
      )
      .slice(0, 2);

  const positiveQuotes =
    feedback
      .filter(
        (item) =>
          item.sentiment ===
          "POSITIVE"
      )
      .sort(
        (a, b) =>
          (b.sentimentScore ?? 1) -
          (a.sentimentScore ?? 1)
      )
      .slice(0, 2);

  /*
   * =========================================================
   * CONTENT
   * =========================================================
   *
   * This content is human-readable.
   * The PDF does NOT parse this content.
   * PDF calculates directly from Prisma.
   */

  const lines: string[] = [];

  lines.push(
    "LOOP CUSTOMER INTELLIGENCE"
  );

  lines.push(
    "VOICE OF CUSTOMER"
  );

  lines.push(
    `PERIOD: ${formatDate(
      periodStart
    )} - ${formatDate(periodEnd)}`
  );

  lines.push("");

  lines.push(
    "ANALYSIS OVERVIEW"
  );

  lines.push(
    `Total feedback: ${total}`
  );

  lines.push(
    `Positive feedback: ${positive} (${percent(
      positive,
      total
    )}%)`
  );

  lines.push(
    `Neutral feedback: ${neutral} (${percent(
      neutral,
      total
    )}%)`
  );

  lines.push(
    `Negative feedback: ${negative} (${percent(
      negative,
      total
    )}%)`
  );

  lines.push(
    `Average rating: ${
      averageRating !== null
        ? averageRating.toFixed(1)
        : "N/A"
    }`
  );

  lines.push(
    `Feedback volume vs previous period: ${
      volumeChange >= 0
        ? "+"
        : ""
    }${volumeChange}%`
  );

  lines.push("");

  lines.push(
    "SENTIMENT DISTRIBUTION"
  );

  lines.push(
    `Positive: ${positive} (${percent(
      positive,
      total
    )}%)`
  );

  lines.push(
    `Neutral: ${neutral} (${percent(
      neutral,
      total
    )}%)`
  );

  lines.push(
    `Negative: ${negative} (${percent(
      negative,
      total
    )}%)`
  );

  lines.push("");

  lines.push(
    "TOP THEMES"
  );

  for (const theme of topThemes) {
    lines.push(
      `${clean(theme.name)} - ${theme.total} mentions`
    );
  }

  lines.push("");

  lines.push(
    "NEGATIVE THEMES"
  );

  for (const theme of negativeThemes) {
    lines.push(
      `${clean(theme.name)} - ${theme.negative} negative of ${theme.total} total`
    );
  }

  lines.push("");

  lines.push(
    "POSITIVE THEMES"
  );

  for (const theme of positiveThemes) {
    lines.push(
      `${clean(theme.name)} - ${theme.positive} positive of ${theme.total} total`
    );
  }

  lines.push("");

  lines.push(
    "KEY FINDINGS"
  );

  for (const item of findings) {
    lines.push(
      clean(item)
    );
  }

  lines.push("");

  lines.push(
    "RECOMMENDED ACTIONS"
  );

  actions.forEach(
    (action, index) => {
      lines.push(
        `${index + 1}. ${clean(action)}`
      );
    }
  );

  lines.push("");

  lines.push(
    "SOURCE DISTRIBUTION"
  );

  for (
    const [source, count] of sources
  ) {
    lines.push(
      `${clean(source)} - ${count} (${percent(
        count,
        total
      )}%)`
    );
  }

  lines.push("");

  lines.push(
    "CATEGORY DISTRIBUTION"
  );

  for (
    const [category, count] of categories
  ) {
    lines.push(
      `${clean(category)} - ${count} (${percent(
        count,
        total
      )}%)`
    );
  }

  lines.push("");

  lines.push(
    "CUSTOMER EVIDENCE"
  );

  for (
    const item of negativeQuotes
  ) {
    lines.push(
      `Negative: "${clean(
        item.content
      )}"`
    );
  }

  for (
    const item of positiveQuotes
  ) {
    lines.push(
      `Positive: "${clean(
        item.content
      )}"`
    );
  }

  lines.push("");

  lines.push(
    "METHODOLOGY"
  );

  lines.push(
    `Analysis covers ${total} feedback items from the authenticated workspace during the selected reporting period. Sentiment, themes, ratings, sources and categories are calculated from stored feedback data.`
  );

  return {
    title: `Weekly Customer Insights - ${formatDate(
      periodStart
    )} - ${formatDate(periodEnd)}`,

    content: lines.join("\n"),

    periodStart,

    periodEnd,
  };
}