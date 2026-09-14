import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { askLoop } from "@/lib/ask-loop";

const askSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, "Question is too short.")
    .max(
      500,
      "Question is too long."
    ),
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
      askSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error:
            validation.error.issues[0]
              ?.message ??
            "Invalid question.",
        },
        {
          status: 400,
        }
      );
    }

    const result = await askLoop(
      validation.data.question,
      session.user.workspaceId
    );

    return NextResponse.json({
      success: true,
      answer: result.answer,
      usedMock: result.usedMock,
      citations: result.citations.map(
        (item) => ({
          id: item.id,
          content: item.content,
          source: item.source,
          sentiment: item.sentiment,
          category: item.category,
          rating: item.rating,
          similarity:
            item.similarity,
          createdAt:
            item.createdAt,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Ask LOOP error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to answer the question.",
      },
      {
        status: 500,
      }
    );
  }
}