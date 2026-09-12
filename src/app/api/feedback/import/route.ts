import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/auth";
import { classifyFeedback } from "@/lib/classifier";

// --------------------------------
// CSV row structure
// --------------------------------

type CSVRow = {
  content?: string;
  source?: string;
  sentiment?: string;
  sentimentScore?: string;
  category?: string;
  rating?: string;
  status?: string;
};

// --------------------------------
// Allowed values
// --------------------------------

const VALID_SOURCES = [
  "WEBSITE",
  "EMAIL",
  "SUPPORT",
  "SURVEY",
  "OTHER",
] as const;

const VALID_STATUSES = [
  "NEW",
  "REVIEWED",
  "ACTIONED",
] as const;

// --------------------------------
// Parse one CSV line
// Handles quoted commas
// --------------------------------

function parseCSVLine(
  line: string
): string[] {
  const values: string[] = [];

  let current = "";
  let insideQuotes = false;

  for (
    let i = 0;
    i < line.length;
    i++
  ) {
    const char = line[i];

    // Escaped quote: ""
    if (char === '"') {
      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
        continue;
      }

      insideQuotes =
        !insideQuotes;

      continue;
    }

    // Comma outside quotes
    if (
      char === "," &&
      !insideQuotes
    ) {
      values.push(
        current.trim()
      );

      current = "";

      continue;
    }

    current += char;
  }

  values.push(
    current.trim()
  );

  return values;
}

// --------------------------------
// Parse complete CSV
// --------------------------------

function parseCSV(
  text: string
): CSVRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) =>
      line.trim()
    )
    .filter(
      (line) =>
        line.length > 0
    );

  if (lines.length < 2) {
    return [];
  }

  const headers =
    parseCSVLine(
      lines[0]
    ).map((header) =>
      header
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
    );

  // Required headers
  if (
    !headers.includes(
      "content"
    ) ||
    !headers.includes(
      "source"
    )
  ) {
    throw new Error(
      "CSV must contain at least 'content' and 'source' columns."
    );
  }

  const rows: CSVRow[] = [];

  for (
    let i = 1;
    i < lines.length;
    i++
  ) {
    const values =
      parseCSVLine(
        lines[i]
      );

    const row: CSVRow = {};

    headers.forEach(
      (header, index) => {
        const value =
          values[index] ?? "";

        switch (header) {
          case "content":
            row.content =
              value;
            break;

          case "source":
            row.source =
              value.toUpperCase();
            break;

          // These may exist in
          // an old CSV, but Claude
          // will generate the
          // final AI classification.
          case "sentiment":
            row.sentiment =
              value.toUpperCase();
            break;

          case "sentimentscore":
            row.sentimentScore =
              value;
            break;

          case "category":
            row.category =
              value;
            break;

          case "rating":
            row.rating =
              value;
            break;

          case "status":
            row.status =
              value.toUpperCase();
            break;
        }
      }
    );

    rows.push(row);
  }

  return rows;
}

// --------------------------------
// POST /api/feedback/import
// --------------------------------

export async function POST(
  request: Request
) {
  try {
    // --------------------------------
    // Authentication
    // --------------------------------

    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user) {
      return NextResponse.json(
        {
          error:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------
    // Permission
    // --------------------------------

    const role =
      session.user.role;

    if (
      role !== "ADMIN" &&
      role !== "ANALYST"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to import feedback.",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------
    // Workspace
    // --------------------------------

    const workspaceId =
      session.user.workspaceId;

    if (!workspaceId) {
      return NextResponse.json(
        {
          error:
            "Workspace information is missing.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // FormData
    // --------------------------------

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            "CSV file is required.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // File type
    // --------------------------------

    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      return NextResponse.json(
        {
          error:
            "Please upload a CSV file.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // Empty file
    // --------------------------------

    if (file.size === 0) {
      return NextResponse.json(
        {
          error:
            "The CSV file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // File size
    // --------------------------------

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      return NextResponse.json(
        {
          error:
            "CSV file must be smaller than 10 MB.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // Read CSV
    // --------------------------------

    const text =
      await file.text();

    let rows: CSVRow[] = [];

    try {
      rows =
        parseCSV(text);
    } catch (error) {
      console.error(
        "CSV parsing error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid CSV format.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // No data
    // --------------------------------

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "The CSV file does not contain any data rows.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // Processing counters
    // --------------------------------

    let imported = 0;
    let failed = 0;

    const errors: Array<{
      row: number;
      error: string;
    }> = [];

    // --------------------------------
    // Process every CSV row
    // --------------------------------

    for (
      let index = 0;
      index < rows.length;
      index++
    ) {
      const row =
        rows[index];

      const rowNumber =
        index + 2;

      const content =
        row.content?.trim() ||
        "";

      const source =
        row.source
          ?.trim()
          .toUpperCase() ||
        "";

      const ratingValue =
        row.rating?.trim() ||
        "";

      const status =
        row.status
          ?.trim()
          .toUpperCase() ||
        "NEW";

      // --------------------------------
      // Content validation
      // --------------------------------

      if (!content) {
        failed++;

        errors.push({
          row: rowNumber,
          error:
            "Content is required.",
        });

        continue;
      }

      // --------------------------------
      // Source validation
      // --------------------------------

      if (
        !VALID_SOURCES.includes(
          source as
            (typeof VALID_SOURCES)[number]
        )
      ) {
        failed++;

        errors.push({
          row: rowNumber,
          error:
            `Invalid source: ${source}`,
        });

        continue;
      }

      // --------------------------------
      // Status validation
      // --------------------------------

      if (
        !VALID_STATUSES.includes(
          status as
            (typeof VALID_STATUSES)[number]
        )
      ) {
        failed++;

        errors.push({
          row: rowNumber,
          error:
            `Invalid status: ${status}`,
        });

        continue;
      }

      // --------------------------------
      // Rating validation
      // --------------------------------

      let parsedRating:
        | number
        | undefined;

      if (ratingValue) {
        const rating =
          Number(
            ratingValue
          );

        if (
          !Number.isInteger(
            rating
          ) ||
          rating < 1 ||
          rating > 5
        ) {
          failed++;

          errors.push({
            row: rowNumber,
            error:
              "Rating must be an integer between 1 and 5.",
          });

          continue;
        }

        parsedRating =
          rating;
      }

      // --------------------------------
      // Claude classification
      // --------------------------------

      try {
        const classification =
          await classifyFeedback(
            content
          );

        // --------------------------------
        // Clean themes
        // --------------------------------

        const cleanedThemes =
          classification.themes
            .map((theme) =>
              theme.trim()
            )
            .filter(
              (theme) =>
                theme.length > 0
            );

        // --------------------------------
        // Create feedback
        // --------------------------------

        const feedback =
          await prisma.feedback.create({
            data: {
              content,

              source:
                source as
                  | "WEBSITE"
                  | "EMAIL"
                  | "SUPPORT"
                  | "SURVEY"
                  | "OTHER",

              // AI-generated
              sentiment:
                classification.sentiment,

              sentimentScore:
                classification.sentimentScore,

              category:
                classification.featureArea,

              ...(parsedRating !==
              undefined
                ? {
                    rating:
                      parsedRating,
                  }
                : {}),

              status:
                status as
                  | "NEW"
                  | "REVIEWED"
                  | "ACTIONED",

              workspaceId,
            },
          });

        // --------------------------------
        // Create themes
        // --------------------------------

        for (
          const themeName of cleanedThemes
        ) {
          const theme =
            await prisma.theme.upsert({
              where: {
                workspaceId_name: {
                  workspaceId,
                  name: themeName,
                },
              },

              update: {},

              create: {
                workspaceId,
                name: themeName,
              },
            });

          // --------------------------------
          // Connect feedback to theme
          // --------------------------------

          await prisma.feedbackTheme.createMany({
            data: [
              {
                feedbackId:
                  feedback.id,

                themeId:
                  theme.id,
              },
            ],

            skipDuplicates: true,
          });
        }

        imported++;
      } catch (error) {
        failed++;

        console.error(
          `CSV row ${rowNumber} classification/import error:`,
          error
        );

        errors.push({
          row: rowNumber,
          error:
            error instanceof Error
              ? error.message
              : "Failed to classify or save feedback.",
        });
      }
    }

    // --------------------------------
    // Final response
    // --------------------------------

    return NextResponse.json({
      success: true,

      imported,

      failed,

      total:
        rows.length,

      message:
        failed > 0
          ? "CSV processed with some failed rows."
          : "CSV imported successfully.",

      errors:
        errors.length > 0
          ? errors
          : undefined,
    });
  } catch (error) {
    console.error(
      "CSV import error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to import CSV. Please check the file format and try again.",
      },
      {
        status: 500,
      }
    );
  }
}