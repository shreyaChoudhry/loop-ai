import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import PDFDocument from "pdfkit";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 36;

const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN * 2;

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

function clean(text: string) {
  return text
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

function percent(
  value: number,
  total: number
) {
  if (!total) return 0;

  return Math.round(
    (value / total) * 100
  );
}

function formatDate(
  date: Date
) {
  return date.toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );
}

function sectionTitle(
  doc: PDFKit.PDFDocument,
  title: string
) {
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor("#0F172A")
    .text(title);

  const y =
    doc.y + 3;

  doc
    .fillColor("#4F46E5")
    .rect(
      MARGIN,
      y,
      22,
      1.5
    )
    .fill();

  doc.y += 7;
}

function metricCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  value: string,
  label: string
) {
  doc
    .roundedRect(
      x,
      y,
      width,
      48,
      5
    )
    .fillAndStroke(
      "#F8FAFC",
      "#E2E8F0"
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor("#0F172A")
    .text(
      value,
      x + 8,
      y + 7,
      {
        width:
          width - 16,
      }
    );

  doc
    .font("Helvetica")
    .fontSize(6)
    .fillColor("#64748B")
    .text(
      label,
      x + 8,
      y + 30,
      {
        width:
          width - 16,
      }
    );
}

function themeCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  theme: ThemeStat,
  mode:
    | "top"
    | "negative"
    | "positive"
) {
  const height = 39;

  const accent =
    mode === "negative"
      ? "#EF4444"
      : mode === "positive"
      ? "#16A34A"
      : "#4F46E5";

  doc
    .roundedRect(
      x,
      y,
      width,
      height,
      5
    )
    .fillAndStroke(
      "#F8FAFC",
      "#E2E8F0"
    );

  doc
    .fillColor(accent)
    .circle(
      x + 10,
      y + 12,
      2.5
    )
    .fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(7.2)
    .fillColor("#1E293B")
    .text(
      clean(theme.name),
      x + 19,
      y + 6,
      {
        width:
          width - 28,
      }
    );

  let detail =
    `${theme.total} total`;

  if (
    mode === "negative"
  ) {
    detail =
      `${theme.negative} negative / ${theme.total} total`;
  }

  if (
    mode === "positive"
  ) {
    detail =
      `${theme.positive} positive / ${theme.total} total`;
  }

  doc
    .font("Helvetica")
    .fontSize(6.3)
    .fillColor("#64748B")
    .text(
      detail,
      x + 19,
      y + 20,
      {
        width:
          width - 28,
      }
    );
}

function finding(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  text: string
) {
  doc
    .fillColor("#4F46E5")
    .circle(
      x + 2,
      y + 4,
      1.5
    )
    .fill();

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#475569")
    .text(
      clean(text),
      x + 9,
      y,
      {
        width:
          width - 9,
        lineGap: 1.5,
      }
    );
}

function actionCard(
  doc: PDFKit.PDFDocument,
  y: number,
  number: number,
  text: string
) {
  doc
    .roundedRect(
      MARGIN,
      y,
      CONTENT_WIDTH,
      25,
      4
    )
    .fillAndStroke(
      "#F8FAFC",
      "#E2E8F0"
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(6.8)
    .fillColor("#4F46E5")
    .text(
      `0${number}`,
      MARGIN + 8,
      y + 8
    );

  doc
    .font("Helvetica")
    .fontSize(6.9)
    .fillColor("#334155")
    .text(
      clean(text),
      MARGIN + 30,
      y + 7,
      {
        width:
          CONTENT_WIDTH - 40,
      }
    );
}

function quote(
  doc: PDFKit.PDFDocument,
  y: number,
  type:
    | "NEGATIVE"
    | "POSITIVE",
  text: string
) {
  const labelColor =
    type === "NEGATIVE"
      ? "#DC2626"
      : "#16A34A";

  doc
    .font("Helvetica-Bold")
    .fontSize(6)
    .fillColor(labelColor)
    .text(
      type,
      MARGIN,
      y
    );

  doc
    .font("Helvetica-Oblique")
    .fontSize(6.8)
    .fillColor("#475569")
    .text(
      `"${clean(text)}"`,
      MARGIN + 45,
      y,
      {
        width:
          CONTENT_WIDTH - 45,
        lineGap: 1,
      }
    );

  return doc.y;
}

function footer(
  doc: PDFKit.PDFDocument
) {
  const range =
    doc.bufferedPageRange();

  for (
    let i = range.start;
    i <
    range.start + range.count;
    i++
  ) {
    doc.switchToPage(i);

    doc
      .strokeColor("#E2E8F0")
      .lineWidth(0.5)
      .moveTo(
        MARGIN,
        PAGE_HEIGHT - 27
      )
      .lineTo(
        PAGE_WIDTH - MARGIN,
        PAGE_HEIGHT - 27
      )
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(6)
      .fillColor("#94A3B8")
      .text(
        "LOOP | Customer Intelligence",
        MARGIN,
        PAGE_HEIGHT - 19
      );

    doc
      .text(
        `Page ${i + 1}`,
        PAGE_WIDTH -
          MARGIN -
          40,
        PAGE_HEIGHT - 19,
        {
          width: 40,
          align: "right",
        }
      );
  }
}

export async function GET(
  _request: Request,
  context: {
    params: {
      id: string;
    };
  }
) {
  try {
    /*
     * =======================================================
     * AUTH
     * =======================================================
     */

    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * =======================================================
     * REPORT
     * =======================================================
     */

    const report =
      await prisma.report.findFirst({
        where: {
          id: context.params.id,

          workspaceId:
            session.user.workspaceId,
        },

        select: {
          id: true,
          title: true,
          createdAt: true,
          periodStart: true,
          periodEnd: true,
        },
      });

    if (!report) {
      return NextResponse.json(
        {
          error:
            "Report not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * =======================================================
     * EXACT PERIOD
     * =======================================================
     *
     * New reports have periodStart/periodEnd.
     *
     * Old reports may not.
     *
     * For old reports we fall back to the latest 7 days.
     */

    let periodStart =
      report.periodStart;

    let periodEnd =
      report.periodEnd;

    if (
      !periodStart ||
      !periodEnd
    ) {
      const latest =
        await prisma.feedback.findFirst({
          where: {
            workspaceId:
              session.user.workspaceId,
          },

          orderBy: {
            createdAt: "desc",
          },

          select: {
            createdAt: true,
          },
        });

      if (!latest) {
        return NextResponse.json(
          {
            error:
              "No feedback available.",
          },
          {
            status: 404,
          }
        );
      }

      periodEnd =
        latest.createdAt;

      periodStart =
        new Date(
          periodEnd.getTime() -
            6 *
              24 *
              60 *
              60 *
              1000
        );
    }

    const periodEndInclusive =
      new Date(periodEnd);

    periodEndInclusive.setHours(
      23,
      59,
      59,
      999
    );

    /*
     * =======================================================
     * REAL FEEDBACK
     * =======================================================
     */

    const feedback =
      (await prisma.feedback.findMany({
        where: {
          workspaceId:
            session.user.workspaceId,

          createdAt: {
            gte: periodStart,
            lte: periodEndInclusive,
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

    const total =
      feedback.length;

    if (!total) {
      return NextResponse.json(
        {
          error:
            `No feedback found for ${formatDate(
              periodStart
            )} - ${formatDate(
              periodEnd
            )}.`,
        },
        {
          status: 404,
        }
      );
    }

    /*
     * =======================================================
     * SENTIMENT
     * =======================================================
     */

    const positive =
      feedback.filter(
        (item) =>
          item.sentiment ===
          "POSITIVE"
      ).length;

    const neutral =
      feedback.filter(
        (item) =>
          item.sentiment ===
          "NEUTRAL"
      ).length;

    const negative =
      feedback.filter(
        (item) =>
          item.sentiment ===
          "NEGATIVE"
      ).length;

    /*
     * =======================================================
     * RATING
     * =======================================================
     */

    const ratings =
      feedback
        .map(
          (item) => item.rating
        )
        .filter(
          (
            value
          ): value is number =>
            typeof value ===
            "number"
        );

    const averageRating =
      ratings.length
        ? (
            ratings.reduce(
              (
                sum,
                value
              ) =>
                sum + value,
              0
            ) /
            ratings.length
          ).toFixed(1)
        : "N/A";

    /*
     * =======================================================
     * THEMES
     * =======================================================
     */

    const relations =
      await prisma.feedbackTheme.findMany(
        {
          where: {
            feedback: {
              workspaceId:
                session.user
                  .workspaceId,

              createdAt: {
                gte: periodStart,
                lte: periodEndInclusive,
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
              },
            },
          },
        }
      );

    const themeMap =
      new Map<
        string,
        ThemeStat
      >();

    for (
      const relation of relations
    ) {
      const name =
        relation.theme.name;

      const current =
        themeMap.get(name) ??
        {
          name,
          total: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
        };

      current.total += 1;

      if (
        relation.feedback
          .sentiment ===
        "POSITIVE"
      ) {
        current.positive += 1;
      }

      if (
        relation.feedback
          .sentiment ===
        "NEGATIVE"
      ) {
        current.negative += 1;
      }

      if (
        relation.feedback
          .sentiment ===
        "NEUTRAL"
      ) {
        current.neutral += 1;
      }

      themeMap.set(
        name,
        current
      );
    }

    const themes =
      Array.from(
        themeMap.values()
      );

    const topThemes =
      [...themes]
        .sort(
          (a, b) =>
            b.total -
            a.total
        )
        .slice(0, 4);

    const negativeThemes =
      [...themes]
        .filter(
          (theme) =>
            theme.negative > 0
        )
        .sort(
          (a, b) =>
            b.negative -
            a.negative
        )
        .slice(0, 3);

    const positiveThemes =
      [...themes]
        .filter(
          (theme) =>
            theme.positive > 0
        )
        .sort(
          (a, b) =>
            b.positive -
            a.positive
        )
        .slice(0, 3);

    /*
     * =======================================================
     * PREVIOUS PERIOD
     * =======================================================
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

    const previousTotal =
      await prisma.feedback.count({
        where: {
          workspaceId:
            session.user.workspaceId,

          createdAt: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
      });

    const volumeChange =
      previousTotal > 0
        ? Math.round(
            ((total -
              previousTotal) /
              previousTotal) *
              100
          )
        : 0;

    /*
     * =======================================================
     * FINDINGS
     * =======================================================
     */

    const findings: string[] =
      [];

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

    if (
      negativeThemes[0]
    ) {
      findings.push(
        `${negativeThemes[0].name} has the highest negative feedback volume (${negativeThemes[0].negative} items).`
      );
    }

    if (
      positiveThemes[0]
    ) {
      findings.push(
        `${positiveThemes[0].name} has the highest positive feedback volume (${positiveThemes[0].positive} items).`
      );
    }

    /*
     * =======================================================
     * ACTIONS
     * =======================================================
     */

    const actions: string[] =
      [];

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

    if (
      positiveThemes[0]
    ) {
      actions.push(
        `Continue monitoring ${positiveThemes[0].name}, which generated ${positiveThemes[0].positive} positive feedback items.`
      );
    }

    /*
     * =======================================================
     * QUOTES
     * =======================================================
     */

    const negativeQuotes =
      feedback
        .filter(
          (item) =>
            item.sentiment ===
            "NEGATIVE"
        )
        .slice(0, 2);

    const positiveQuotes =
      feedback
        .filter(
          (item) =>
            item.sentiment ===
            "POSITIVE"
        )
        .slice(0, 2);

    /*
     * =======================================================
     * PDF
     * =======================================================
     */

    const doc =
      new PDFDocument({
        size: "A4",
        margin: MARGIN,
        bufferPages: true,

        info: {
          Title:
            report.title,

          Author:
            "LOOP",

          Subject:
            "Voice of Customer",
        },
      });

    const chunks: Buffer[] =
      [];

    doc.on(
      "data",
      (chunk: Buffer) => {
        chunks.push(chunk);
      }
    );

    const pdfPromise =
      new Promise<Buffer>(
        (
          resolve,
          reject
        ) => {
          doc.on(
            "end",
            () =>
              resolve(
                Buffer.concat(
                  chunks
                )
              )
          );

          doc.on(
            "error",
            reject
          );
        }
      );

    /*
     * HEADER
     */

    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor("#4F46E5")
      .text(
        "LOOP CUSTOMER INTELLIGENCE",
        MARGIN,
        24
      );

    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor("#94A3B8")
      .text(
        "VOICE OF CUSTOMER",
        PAGE_WIDTH -
          MARGIN -
          110,
        25,
        {
          width: 110,
          align: "right",
        }
      );

    /*
     * TITLE
     */

    doc.y = 51;

    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#0F172A")
      .text(
        "Voice of Customer"
      );

    doc.moveDown(0.1);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#64748B")
      .text(
        `${formatDate(
          periodStart
        )} - ${formatDate(
          periodEnd
        )}`
      );

    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor("#94A3B8")
      .text(
        `Generated ${formatDate(
          report.createdAt
        )}`
      );

    /*
     * OVERVIEW
     */

    doc.moveDown(0.4);

    sectionTitle(
      doc,
      "ANALYSIS OVERVIEW"
    );

    const gap = 6;

    const cardWidth =
      (CONTENT_WIDTH -
        gap * 4) /
      5;

    const overviewY =
      doc.y;

    metricCard(
      doc,
      MARGIN,
      overviewY,
      cardWidth,
      String(total),
      "TOTAL FEEDBACK"
    );

    metricCard(
      doc,
      MARGIN +
        (cardWidth + gap),
      overviewY,
      cardWidth,
      `${percent(
        positive,
        total
      )}%`,
      "POSITIVE"
    );

    metricCard(
      doc,
      MARGIN +
        (cardWidth + gap) *
          2,
      overviewY,
      cardWidth,
      `${percent(
        negative,
        total
      )}%`,
      "NEGATIVE"
    );

    metricCard(
      doc,
      MARGIN +
        (cardWidth + gap) *
          3,
      overviewY,
      cardWidth,
      averageRating,
      "AVG RATING"
    );

    metricCard(
      doc,
      MARGIN +
        (cardWidth + gap) *
          4,
      overviewY,
      cardWidth,
      `${
        volumeChange >= 0
          ? "+"
          : ""
      }${volumeChange}%`,
      "VS PREVIOUS"
    );

    doc.y =
      overviewY + 60;

    /*
     * SENTIMENT + FINDINGS
     */

    const colGap = 18;

    const leftWidth =
      CONTENT_WIDTH *
      0.44;

    const rightWidth =
      CONTENT_WIDTH -
      leftWidth -
      colGap;

    const rowY =
      doc.y;

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#0F172A")
      .text(
        "SENTIMENT DISTRIBUTION",
        MARGIN,
        rowY
      );

    doc
      .fillColor("#4F46E5")
      .rect(
        MARGIN,
        rowY + 16,
        22,
        1.5
      )
      .fill();

    let barY =
      rowY + 27;

    const sentimentRows = [
      {
        label: "Positive",
        count: positive,
      },
      {
        label: "Neutral",
        count: neutral,
      },
      {
        label: "Negative",
        count: negative,
      },
    ];

    for (
      const row of sentimentRows
    ) {
      const value =
        percent(
          row.count,
          total
        );

      doc
        .font("Helvetica")
        .fontSize(6.8)
        .fillColor("#475569")
        .text(
          row.label,
          MARGIN,
          barY
        );

      doc
        .roundedRect(
          MARGIN + 48,
          barY + 1,
          leftWidth - 80,
          6,
          3
        )
        .fill("#E2E8F0");

      doc
        .roundedRect(
          MARGIN + 48,
          barY + 1,
          Math.max(
            2,
            (leftWidth - 80) *
              (value / 100)
          ),
          6,
          3
        )
        .fill(
          row.label ===
            "Negative"
            ? "#EF4444"
            : "#4F46E5"
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(6.8)
        .fillColor("#334155")
        .text(
          `${row.count} (${value}%)`,
          MARGIN +
            leftWidth -
            60,
          barY,
          {
            width: 60,
            align: "right",
          }
        );

      barY += 18;
    }

    const findingsX =
      MARGIN +
      leftWidth +
      colGap;

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#0F172A")
      .text(
        "KEY FINDINGS",
        findingsX,
        rowY
      );

    doc
      .fillColor("#4F46E5")
      .rect(
        findingsX,
        rowY + 16,
        22,
        1.5
      )
      .fill();

    let findingY =
      rowY + 27;

    for (
      const item of findings.slice(
        0,
        4
      )
    ) {
      finding(
        doc,
        findingsX,
        findingY,
        rightWidth,
        item
      );

      findingY =
        doc.y + 3;
    }

    doc.y =
      Math.max(
        barY,
        findingY
      ) + 2;

    /*
     * THEMES
     */

    sectionTitle(
      doc,
      "CUSTOMER THEMES"
    );

    const themeGap = 8;

    const themeWidth =
      (CONTENT_WIDTH -
        themeGap) /
      2;

    const themeY =
      doc.y;

    doc
      .font("Helvetica-Bold")
      .fontSize(7.8)
      .fillColor("#475569")
      .text(
        "TOP THEMES",
        MARGIN,
        themeY
      );

    let topThemeY =
      themeY + 16;

    for (
      const theme of topThemes
    ) {
      themeCard(
        doc,
        MARGIN,
        topThemeY,
        themeWidth,
        theme,
        "top"
      );

      topThemeY += 44;
    }

    const negativeX =
      MARGIN +
      themeWidth +
      themeGap;

    doc
      .font("Helvetica-Bold")
      .fontSize(7.8)
      .fillColor("#475569")
      .text(
        "NEGATIVE THEMES",
        negativeX,
        themeY
      );

    let negativeY =
      themeY + 16;

    for (
      const theme of negativeThemes
    ) {
      themeCard(
        doc,
        negativeX,
        negativeY,
        themeWidth,
        theme,
        "negative"
      );

      negativeY += 44;
    }

    doc.y =
      Math.max(
        topThemeY,
        negativeY
      ) + 2;

    /*
     * POSITIVE + SIGNALS
     */

    const secondY =
      doc.y;

    doc
      .font("Helvetica-Bold")
      .fontSize(7.8)
      .fillColor("#475569")
      .text(
        "POSITIVE THEMES",
        MARGIN,
        secondY
      );

    let positiveY =
      secondY + 16;

    for (
      const theme of positiveThemes.slice(
        0,
        2
      )
    ) {
      themeCard(
        doc,
        MARGIN,
        positiveY,
        themeWidth,
        theme,
        "positive"
      );

      positiveY += 44;
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(7.8)
      .fillColor("#475569")
      .text(
        "EMERGING SIGNALS",
        negativeX,
        secondY
      );

    let signalY =
      secondY + 16;

    for (
      const theme of topThemes.slice(
        0,
        2
      )
    ) {
      themeCard(
        doc,
        negativeX,
        signalY,
        themeWidth,
        theme,
        "top"
      );

      signalY += 44;
    }

    doc.y =
      Math.max(
        positiveY,
        signalY
      ) + 2;

    /*
     * ACTIONS
     */

    sectionTitle(
      doc,
      "RECOMMENDED ACTIONS"
    );

    for (
      let i = 0;
      i <
        Math.min(
          actions.length,
          3
        );
      i++
    ) {
      actionCard(
        doc,
        doc.y,
        i + 1,
        actions[i]
      );

      doc.y += 31;
    }

    /*
     * CUSTOMER EVIDENCE
     */

    sectionTitle(
      doc,
      "CUSTOMER EVIDENCE"
    );

    for (
      const item of negativeQuotes
    ) {
      quote(
        doc,
        doc.y,
        "NEGATIVE",
        item.content
      );

      doc.moveDown(
        0.15
      );
    }

    for (
      const item of positiveQuotes
    ) {
      quote(
        doc,
        doc.y,
        "POSITIVE",
        item.content
      );

      doc.moveDown(
        0.15
      );
    }

    /*
     * SOURCE + CATEGORY
     */

    const sourceMap =
      new Map<
        string,
        number
      >();

    const categoryMap =
      new Map<
        string,
        number
      >();

    for (
      const item of feedback
    ) {
      const source =
        item.source ??
        "OTHER";

      sourceMap.set(
        source,
        (sourceMap.get(
          source
        ) ?? 0) + 1
      );

      if (item.category) {
        categoryMap.set(
          item.category,
          (categoryMap.get(
            item.category
          ) ?? 0) + 1
        );
      }
    }

    const sources =
      Array.from(
        sourceMap.entries()
      )
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .slice(0, 3);

    const categories =
      Array.from(
        categoryMap.entries()
      )
        .sort(
          (a, b) =>
            b[1] - a[1]
        )
        .slice(0, 3);

    const mixY =
      doc.y + 2;

    const half =
      (CONTENT_WIDTH - 10) /
      2;

    doc
      .font("Helvetica-Bold")
      .fontSize(6.8)
      .fillColor("#475569")
      .text(
        "SOURCE MIX",
        MARGIN,
        mixY
      );

    doc
      .font("Helvetica")
      .fontSize(5.9)
      .fillColor("#64748B")
      .text(
        sources
          .map(
            ([name, count]) =>
              `${clean(
                name
              )} ${count} (${percent(
                count,
                total
              )}%)`
          )
          .join("   "),
        MARGIN,
        mixY + 10,
        {
          width: half,
        }
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(6.8)
      .fillColor("#475569")
      .text(
        "CATEGORY MIX",
        MARGIN +
          half +
          10,
        mixY
      );

    doc
      .font("Helvetica")
      .fontSize(5.9)
      .fillColor("#64748B")
      .text(
        categories
          .map(
            ([name, count]) =>
              `${clean(
                name
              )} ${count} (${percent(
                count,
                total
              )}%)`
          )
          .join("   "),
        MARGIN +
          half +
          10,
        mixY + 10,
        {
          width: half,
        }
      );

    /*
     * FOOTER
     */

    footer(doc);

    doc.end();

    const pdfBuffer =
      await pdfPromise;

    return new NextResponse(
      new Uint8Array(
        pdfBuffer
      ),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition": `attachment; filename="voice-of-customer-${report.id}.pdf"`,

          "Content-Length":
            pdfBuffer.length.toString(),
        },
      }
    );
  } catch (error) {
    console.error(
      "PDF export error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate PDF.",
      },
      {
        status: 500,
      }
    );
  }
}