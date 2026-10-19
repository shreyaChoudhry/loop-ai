import prisma from "@/lib/prisma";

export type PrioritizationBreakdown = {
  requestId: string;
  title: string;
  description: string;
  status: string;
  category: string | null;
  createdAt: string;
  voteCount: number;
  effort: number;
  impact: number;
  relatedFeedbackCount: number;
  relatedFeedbackIds: string[];
  totalScore: number;
  scoreExplanation: {
    voteComponent: { points: number; formula: string };
    recencyComponent: { points: number; formula: string; daysAgo: number };
    feedbackComponent: { points: number; formula: string; count: number };
    businessImpactComponent: { points: number; formula: string; level: number };
    effortPenaltyComponent: { points: number; formula: string; level: number };
  };
};

export async function computeWorkspacePrioritization(
  workspaceId: string
): Promise<PrioritizationBreakdown[]> {
  const requests = await prisma.request.findMany({
    where: {
      workspaceId,
      canonicalRequestId: null, // primary/canonical requests only
    },
    include: {
      duplicates: {
        select: {
          id: true,
          voteCount: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const allWorkspaceFeedback = await prisma.feedback.findMany({
    where: { workspaceId },
    select: {
      id: true,
      content: true,
      category: true,
      sentiment: true,
    },
    take: 300,
  });

  const now = new Date();

  const results: PrioritizationBreakdown[] = [];

  for (const req of requests) {
    // 1. Total aggregated votes (including merged duplicates)
    const duplicateVotes = req.duplicates.reduce((sum, d) => sum + d.voteCount, 0);
    const totalVotes = req.voteCount + duplicateVotes;
    const votePoints = totalVotes * 3;

    // 2. Recency score
    const createdDate = new Date(req.createdAt);
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let recencyPoints = 2;
    if (daysAgo <= 7) {
      recencyPoints = 15;
    } else if (daysAgo <= 30) {
      recencyPoints = 10;
    } else if (daysAgo <= 90) {
      recencyPoints = 5;
    }

    // 3. Related feedback matching
    const reqTokens = req.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const relatedFeedback = allWorkspaceFeedback.filter((f) => {
      if (req.category && f.category && req.category.toLowerCase() === f.category.toLowerCase()) {
        return true;
      }
      const feedbackContent = f.content.toLowerCase();
      return reqTokens.some((token) => feedbackContent.includes(token));
    });

    const relatedCount = relatedFeedback.length;
    const feedbackPoints = Math.min(relatedCount * 4, 30);

    // 4. Founder-defined business impact & effort (defaults: 3 out of 5)
    const impactLevel = req.impact ?? 3;
    const effortLevel = req.effort ?? 3;
    const impactPoints = impactLevel * 5; // max 25
    const effortPenalty = effortLevel * 3; // max 15

    const totalScore = Math.max(
      0,
      votePoints + recencyPoints + feedbackPoints + impactPoints - effortPenalty
    );

    results.push({
      requestId: req.id,
      title: req.title,
      description: req.description,
      status: req.status,
      category: req.category,
      createdAt: req.createdAt.toISOString(),
      voteCount: totalVotes,
      effort: effortLevel,
      impact: impactLevel,
      relatedFeedbackCount: relatedCount,
      relatedFeedbackIds: relatedFeedback.slice(0, 5).map((f) => f.id),
      totalScore,
      scoreExplanation: {
        voteComponent: {
          points: votePoints,
          formula: `${totalVotes} votes × 3 pts`,
        },
        recencyComponent: {
          points: recencyPoints,
          formula: `${daysAgo}d ago (${recencyPoints} pts)`,
          daysAgo,
        },
        feedbackComponent: {
          points: feedbackPoints,
          formula: `${relatedCount} related feedback items × 4 pts (capped at 30)`,
          count: relatedCount,
        },
        businessImpactComponent: {
          points: impactPoints,
          formula: `Impact score ${impactLevel}/5 × 5 pts`,
          level: impactLevel,
        },
        effortPenaltyComponent: {
          points: -effortPenalty,
          formula: `Effort score ${effortLevel}/5 × -3 pts penalty`,
          level: effortLevel,
        },
      },
    });
  }

  // Sort by highest prioritization score first
  return results.sort((a, b) => b.totalScore - a.totalScore);
}
