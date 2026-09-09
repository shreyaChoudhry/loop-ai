import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/auth";

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

const VALID_SENTIMENTS = [
  "POSITIVE",
  "NEUTRAL",
  "NEGATIVE",
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

    // Handle quotes
    if (char === '"') {
      // Escaped quote: ""
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

    // Comma outside quotes = next column
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
      (line) => line.length > 0
    );

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCSVLine(
    lines[0]
  ).map((header) =>
    header
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
  );

  // Required header
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
            row.content = value;
            break;

          case "source":
            row.source =
              value.toUpperCase();
            break;

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
      rows = parseCSV(text);
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
    // Valid records
    // --------------------------------

    const validRecords: Array<{
      content: string;

      source:
        | "WEBSITE"
        | "EMAIL"
        | "SUPPORT"
        | "SURVEY"
        | "OTHER";

      sentiment?:
        | "POSITIVE"
        | "NEUTRAL"
        | "NEGATIVE";

      sentimentScore?: number;

      category?: string;

      rating?: number;

      status:
        | "NEW"
        | "REVIEWED"
        | "ACTIONED";

      workspaceId: string;
    }> = [];

    let failed = 0;

    // --------------------------------
    // Validate each row
    // --------------------------------

    for (
      const row of rows
    ) {
      const content =
        row.content?.trim() ||
        "";

      const source =
        row.source
          ?.trim()
          .toUpperCase() ||
        "";

      const sentiment =
        row.sentiment
          ?.trim()
          .toUpperCase() ||
        "";

      const sentimentScoreValue =
        row.sentimentScore?.trim() ||
        "";

      const category =
        row.category?.trim() ||
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
      // 1. Content validation
      // --------------------------------

      if (!content) {
        failed++;
        continue;
      }

      // --------------------------------
      // 2. Source validation
      // --------------------------------

      if (
        !VALID_SOURCES.includes(
          source as (typeof VALID_SOURCES)[number]
        )
      ) {
        failed++;
        continue;
      }

      // --------------------------------
      // 3. Sentiment validation
      // --------------------------------

      let parsedSentiment:
        | "POSITIVE"
        | "NEUTRAL"
        | "NEGATIVE"
        | undefined;

      if (sentiment) {
        if (
          !VALID_SENTIMENTS.includes(
            sentiment as (typeof VALID_SENTIMENTS)[number]
          )
        ) {
          failed++;
          continue;
        }

        parsedSentiment =
          sentiment as
            | "POSITIVE"
            | "NEUTRAL"
            | "NEGATIVE";
      }

      // --------------------------------
      // 4. Status validation
      // --------------------------------

      if (
        !VALID_STATUSES.includes(
          status as (typeof VALID_STATUSES)[number]
        )
      ) {
        failed++;
        continue;
      }

      // --------------------------------
      // 5. Rating validation
      // --------------------------------

      let parsedRating:
        | number
        | undefined;

      if (ratingValue) {
        const rating =
          Number(ratingValue);

        if (
          !Number.isInteger(
            rating
          ) ||
          rating < 1 ||
          rating > 5
        ) {
          failed++;
          continue;
        }

        parsedRating =
          rating;
      }

      // --------------------------------
      // 6. Sentiment score validation
      // --------------------------------

      let parsedSentimentScore:
        | number
        | undefined;

      if (
        sentimentScoreValue
      ) {
        const score =
          Number(
            sentimentScoreValue
          );

        if (
          Number.isNaN(score) ||
          score < -1 ||
          score > 1
        ) {
          failed++;
          continue;
        }

        parsedSentimentScore =
          score;
      }

      // --------------------------------
      // Valid row
      // --------------------------------

      validRecords.push({
        content,

        source:
          source as
            | "WEBSITE"
            | "EMAIL"
            | "SUPPORT"
            | "SURVEY"
            | "OTHER",

        ...(parsedSentiment
          ? {
              sentiment:
                parsedSentiment,
            }
          : {}),

        ...(parsedSentimentScore !==
        undefined
          ? {
              sentimentScore:
                parsedSentimentScore,
            }
          : {}),

        ...(category
          ? {
              category,
            }
          : {}),

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
      });
    }

    // --------------------------------
    // If every row is invalid
    // --------------------------------

    if (
      validRecords.length ===
      0
    ) {
      return NextResponse.json({
        success: true,
        imported: 0,
        failed,
        total: rows.length,
        message:
          "No valid feedback rows were found.",
      });
    }

    // --------------------------------
    // Insert ONLY valid rows
    // --------------------------------

    const result =
      await prisma.feedback.createMany(
        {
          data: validRecords,
        }
      );

    // --------------------------------
    // Response
    // --------------------------------

    return NextResponse.json({
      success: true,

      imported:
        result.count,

      failed,

      total:
        rows.length,

      message:
        failed > 0
          ? "CSV imported with some failed rows."
          : "CSV imported successfully.",
    });
  } catch (error) {
    // --------------------------------
    // Never crash the application
    // --------------------------------

    console.error(
      "CSV import error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to import CSV. Please check the file format and try again.",
      },
      {
        status: 500,
      }
    );
  }
}