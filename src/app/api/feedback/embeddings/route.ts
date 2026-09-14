import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { createEmbedding } from "@/lib/embeddings";

export async function POST() {
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

    const workspaceId =
      session.user.workspaceId;

    const feedback =
      await prisma.feedback.findMany({
        where: {
          workspaceId,
        },
        select: {
          id: true,
          content: true,
        },
      });

    let processed = 0;

    for (const item of feedback) {
      if (!item.content.trim()) {
        continue;
      }

      const vector =
        createEmbedding(item.content);

      const existing =
        await prisma.embedding.findFirst({
          where: {
            feedbackId: item.id,
          },
        });

      if (existing) {
        await prisma.embedding.update({
          where: {
            id: existing.id,
          },
          data: {
            content: item.content,
            vector: JSON.stringify(vector),
          },
        });
      } else {
        await prisma.embedding.create({
          data: {
            content: item.content,
            vector: JSON.stringify(vector),
            feedbackId: item.id,
          },
        });
      }

      processed++;
    }

    return NextResponse.json({
      success: true,
      processed,
      total: feedback.length,
    });
  } catch (error) {
    console.error(
      "Embedding generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to generate embeddings.",
      },
      {
        status: 500,
      }
    );
  }
}