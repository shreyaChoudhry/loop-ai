import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { computeWorkspacePrioritization } from "@/lib/prioritization";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const items = await computeWorkspacePrioritization(session.user.workspaceId);

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
      scoringMethodology: {
        formula:
          "Total Score = (Votes × 3) + Recency (up to 15) + Related Feedback (up to 30) + (Impact × 5) - (Effort × 3)",
        components: [
          "Customer Demand: 3 points per vote (including merged duplicate requests)",
          "Feedback Recency: Recent customer requests get up to 15 bonus points",
          "Workspace Evidence: Related raw customer feedback items add 4 points each (capped at 30)",
          "Business Impact: Founder estimated impact (1 to 5) scales up to 25 points",
          "Implementation Effort: Founder estimated effort (1 to 5) subtracts up to 15 points",
        ],
      },
    });
  } catch (error) {
    console.error("Prioritization API error:", error);
    return NextResponse.json(
      { error: "Failed to compute prioritization." },
      { status: 500 }
    );
  }
}
