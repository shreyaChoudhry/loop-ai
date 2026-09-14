import prisma from "@/lib/prisma";

import {
  createEmbedding,
  cosineSimilarity,
} from "@/lib/embeddings";

export type RetrievedFeedback = {
  id: string;
  content: string;
  source: string;
  sentiment: string;
  category: string | null;
  rating: number | null;
  createdAt: Date;
  similarity: number;
};

export async function retrieveRelevantFeedback(
  question: string,
  workspaceId: string,
  limit = 5
): Promise<RetrievedFeedback[]> {
  const questionVector =
    createEmbedding(question);

  const embeddings =
    await prisma.embedding.findMany({
      where: {
        feedback: {
          workspaceId,
        },
      },
      select: {
        feedbackId: true,
        vector: true,
        feedback: {
          select: {
            id: true,
            content: true,
            source: true,
            sentiment: true,
            category: true,
            rating: true,
            createdAt: true,
          },
        },
      },
    });

  const results: RetrievedFeedback[] = [];

  for (const item of embeddings) {
    if (!item.vector) {
      continue;
    }

    const feedback = item.feedback;

    if (!feedback) {
      continue;
    }

    let vector: number[];

    try {
      const parsed: unknown =
        JSON.parse(item.vector);

      if (!Array.isArray(parsed)) {
        continue;
      }

      if (
        !parsed.every(
          (value) =>
            typeof value === "number"
        )
      ) {
        continue;
      }

      vector = parsed;
    } catch {
      continue;
    }

    const similarity =
      cosineSimilarity(
        questionVector,
        vector
      );

    results.push({
      id: feedback.id,
      content: feedback.content,

      source: String(
        feedback.source
      ),

      sentiment: String(
        feedback.sentiment
      ),

      category:
        feedback.category !== null
          ? String(feedback.category)
          : null,

      rating:
        feedback.rating !== null
          ? Number(feedback.rating)
          : null,

      createdAt: feedback.createdAt,

      similarity,
    });
  }

  return results
    .sort(
      (a, b) =>
        b.similarity - a.similarity
    )
    .slice(0, limit);
}