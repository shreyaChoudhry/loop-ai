import prisma from "@/lib/prisma";
import { createEmbedding, cosineSimilarity } from "@/lib/embeddings";

export type DuplicateMatch = {
  id: string;
  title: string;
  description: string;
  status: string;
  voteCount: number;
  similarity: number; // 0 to 1
  reason: string;
};

/**
 * Tokenize text into lowercased clean words
 */
function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

/**
 * Jaccard similarity between two token sets
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) {
      intersection++;
    }
  });
  const union = new Set<string>();
  setA.forEach((t) => union.add(t));
  setB.forEach((t) => union.add(t));
  return union.size === 0 ? 0 : intersection / union.size;
}

/**
 * Find similar requests in the same workspace using deterministic embeddings + token overlap
 */
export async function findSimilarRequests(
  title: string,
  description: string,
  workspaceId: string,
  excludeId?: string,
  threshold = 0.45
): Promise<DuplicateMatch[]> {
  const queryTokens = tokenize(`${title} ${description}`);
  const titleTokens = tokenize(title);
  const queryEmbedding = createEmbedding(`${title} ${description}`);

  // Fetch active requests in the same workspace (excluding the current request and canonical children)
  const existingRequests = await prisma.request.findMany({
    where: {
      workspaceId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      canonicalRequestId: null, // compare with parent/canonical requests
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      voteCount: true,
    },
    take: 100,
  });

  const matches: DuplicateMatch[] = [];

  for (const item of existingRequests) {
    const itemTokens = tokenize(`${item.title} ${item.description}`);
    const itemTitleTokens = tokenize(item.title);

    // 1. Title token overlap (high importance)
    const titleOverlap = jaccardSimilarity(titleTokens, itemTitleTokens);

    // 2. Full text token overlap
    const fullOverlap = jaccardSimilarity(queryTokens, itemTokens);

    // 3. Cosine similarity of deterministic n-gram embeddings
    const itemEmbedding = createEmbedding(`${item.title} ${item.description}`);
    const embeddingSim = cosineSimilarity(queryEmbedding, itemEmbedding);

    // Composite score weighted towards title match
    const compositeScore =
      titleOverlap * 0.45 + fullOverlap * 0.25 + Math.max(0, embeddingSim) * 0.3;

    if (compositeScore >= threshold || titleOverlap >= 0.5) {
      // Find overlapping keywords for clear explanation
      const sharedWords: string[] = [];
      titleTokens.forEach((t) => {
        if (itemTitleTokens.has(t)) {
          sharedWords.push(t);
        }
      });

      let reason = "High text similarity with existing request.";
      if (sharedWords.length > 0) {
        reason = `Shares key terms: "${sharedWords.slice(0, 3).join(", ")}"`;
      } else if (titleOverlap > 0.4) {
        reason = "Very similar title structure and phrasing.";
      } else if (embeddingSim > 0.6) {
        reason = "Closely related concepts and semantic phrasing.";
      }

      matches.push({
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status,
        voteCount: item.voteCount,
        similarity: Math.round(compositeScore * 100) / 100,
        reason,
      });
    }
  }

  // Sort by similarity descending
  return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}
