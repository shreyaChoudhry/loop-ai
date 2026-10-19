import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { findSimilarRequests } from "@/lib/duplicates";

const submitRequestSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be under 120 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be under 2000 characters"),
  category: z.string().max(50).optional(),
  authorEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  notifyOnUpdate: z.boolean().default(true),
  voterToken: z.string().min(6, "Voter token is required"),
  honeypot: z.string().max(0, "Spam detected").optional().or(z.literal("")),
  forceSubmit: z.boolean().optional().default(false),
});

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);

    const statusParam = searchParams.get("status");
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search");
    const sortParam = searchParams.get("sort") || "popular"; // popular, recent, trending
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const voterToken = searchParams.get("voterToken") || request.headers.get("x-voter-token") || "";

    const workspace = await prisma.workspace.findUnique({
      where: { slug: slug.toLowerCase().trim() },
      select: {
        id: true,
        portalEnabled: true,
        showNotPlanned: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Portal not found." }, { status: 404 });
    }

    if (!workspace.portalEnabled) {
      return NextResponse.json({ error: "Portal is disabled." }, { status: 403 });
    }

    type RequestFindArgs = NonNullable<Parameters<typeof prisma.request.findMany>[0]>;

    const whereClause: NonNullable<RequestFindArgs["where"]> = {
      workspaceId: workspace.id,
      canonicalRequestId: null, // primary ideas only
    };

    if (statusParam) {
      whereClause.status = statusParam as "UNDER_REVIEW" | "PLANNED" | "IN_PROGRESS" | "SHIPPED" | "NOT_PLANNED";
    } else if (!workspace.showNotPlanned) {
      whereClause.status = { not: "NOT_PLANNED" };
    }

    if (categoryParam) {
      whereClause.category = categoryParam;
    }

    if (searchParam && searchParam.trim()) {
      whereClause.OR = [
        { title: { contains: searchParam.trim(), mode: "insensitive" } },
        { description: { contains: searchParam.trim(), mode: "insensitive" } },
      ];
    }

    let orderBy: RequestFindArgs["orderBy"] = { voteCount: "desc" };
    if (sortParam === "recent") {
      orderBy = { createdAt: "desc" };
    } else if (sortParam === "trending") {
      // High votes and recent
      orderBy = [{ voteCount: "desc" }, { createdAt: "desc" }];
    }

    const [totalCount, requestsList] = await Promise.all([
      prisma.request.count({ where: whereClause }),
      prisma.request.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          status: true,
          voteCount: true,
          shippedAt: true,
          releaseNote: true,
          createdAt: true,
          updatedAt: true,
          duplicates: {
            select: {
              id: true,
              voteCount: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Check which requests (or their merged duplicates) this voterToken has already voted for
    let userVotedIds = new Set<string>();
    if (voterToken) {
      const allCandidateIds = requestsList.flatMap((r) => [
        r.id,
        ...r.duplicates.map((d) => d.id),
      ]);

      const existingVotes = await prisma.vote.findMany({
        where: {
          workspaceId: workspace.id,
          voterToken,
          requestId: { in: allCandidateIds },
        },
        select: { requestId: true },
      });
      userVotedIds = new Set(existingVotes.map((v) => v.requestId));
    }

    const formattedRequests = requestsList.map((req) => {
      const duplicateVotes = req.duplicates.reduce(
        (sum, d) => sum + d.voteCount,
        0
      );
      const hasVoted =
        userVotedIds.has(req.id) ||
        req.duplicates.some((d) => userVotedIds.has(d.id));

      return {
        id: req.id,
        title: req.title,
        description: req.description,
        category: req.category,
        status: req.status,
        voteCount: req.voteCount + duplicateVotes,
        shippedAt: req.shippedAt,
        releaseNote: req.releaseNote,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
        hasVoted,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedRequests,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Public requests fetch error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();

    const parseResult = submitRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      category,
      authorEmail,
      notifyOnUpdate,
      voterToken,
      honeypot,
      forceSubmit,
    } = parseResult.data;

    // Spam honeypot check
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ success: true, message: "Submitted successfully." });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: slug.toLowerCase().trim() },
      select: { id: true, portalEnabled: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Portal not found." }, { status: 404 });
    }

    if (!workspace.portalEnabled) {
      return NextResponse.json({ error: "Portal is currently disabled." }, { status: 403 });
    }

    // Duplicate detection check
    if (!forceSubmit) {
      const similar = await findSimilarRequests(title, description, workspace.id, undefined, 0.48);
      if (similar.length > 0) {
        return NextResponse.json({
          success: false,
          hasSimilar: true,
          similarRequests: similar,
          message: "We found existing requests that might match your idea. You can upvote them instead!",
        });
      }
    }

    const normalizedEmail = authorEmail ? authorEmail.trim().toLowerCase() : null;

    // Atomic transaction: create request + initial author vote (if opted-in) + status history
    const result = await prisma.$transaction(async (tx) => {
      const newRequest = await tx.request.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          category: category ? category.trim() : null,
          status: "UNDER_REVIEW",
          voteCount: 1, // Submitter is first vote
          authorEmail: normalizedEmail,
          notifyOnUpdate: Boolean(notifyOnUpdate),
          workspaceId: workspace.id,
        },
      });

      // Record first vote
      await tx.vote.create({
        data: {
          requestId: newRequest.id,
          workspaceId: workspace.id,
          voterToken,
          voterEmail: normalizedEmail,
          notifyOnUpdate: Boolean(notifyOnUpdate),
        },
      });

      // Record initial status history
      await tx.requestStatusHistory.create({
        data: {
          requestId: newRequest.id,
          newStatus: "UNDER_REVIEW",
          comment: "Request submitted via public portal.",
        },
      });

      return newRequest;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your request has been submitted for review!",
        request: {
          id: result.id,
          title: result.title,
          description: result.description,
          status: result.status,
          voteCount: result.voteCount,
          hasVoted: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Public request submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit request. Please try again." },
      { status: 500 }
    );
  }
}
