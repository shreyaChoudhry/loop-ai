import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import {
  retrieveRelevantFeedback,
} from "@/lib/search";

const searchSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3)
    .max(500),
});

export async function POST(
  request: Request
) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Request body is missing or invalid JSON.",
        },
        {
          status: 400,
        }
      );
    }

    const validation =
      searchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error:
            "Question must be between 3 and 500 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const results =
      await retrieveRelevantFeedback(
        validation.data.question,
        session.user.workspaceId,
        5
      );

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error(
      "Semantic search error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to search feedback.",
      },
      {
        status: 500,
      }
    );
  }
}