import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const workspaceId = session.user.workspaceId;

    const requests = await prisma.request.findMany({
      where: {
        workspaceId,
        ...(statusParam
          ? {
              status: statusParam as
                | "UNDER_REVIEW"
                | "PLANNED"
                | "IN_PROGRESS"
                | "SHIPPED"
                | "NOT_PLANNED",
            }
          : {}),
      },
      include: {
        duplicates: {
          select: {
            id: true,
            title: true,
            voteCount: true,
          },
        },
        canonicalRequest: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            votes: true,
            followUps: true,
          },
        },
      },
      orderBy: [{ voteCount: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Roadmap fetch error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const role = session.user.role;
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const { title, description, category, status, effort, impact } = body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Title must be at least 3 characters." },
        { status: 400 }
      );
    }

    // Role-aware status determination:
    // Viewers submit ideas for review; Admins and Analysts can directly plan or set in-progress
    let requestStatus: "UNDER_REVIEW" | "PLANNED" | "IN_PROGRESS" = "UNDER_REVIEW";
    if (role === "ADMIN" || role === "ANALYST") {
      if (status === "PLANNED" || status === "IN_PROGRESS" || status === "UNDER_REVIEW") {
        requestStatus = status;
      }
    }

    const numericEffort =
      effort !== undefined && effort !== null
        ? Math.max(1, Math.min(5, parseInt(String(effort), 10) || 3))
        : 3;
    const numericImpact =
      impact !== undefined && impact !== null
        ? Math.max(1, Math.min(5, parseInt(String(impact), 10) || 3))
        : 3;

    const newRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.request.create({
        data: {
          title: title.trim(),
          description: description?.trim() || "",
          category: category ? category.trim() : null,
          status: requestStatus,
          effort: numericEffort,
          impact: numericImpact,
          workspaceId: session.user.workspaceId,
          voteCount: 0,
        },
      });

      await tx.requestStatusHistory.create({
        data: {
          requestId: created.id,
          newStatus: created.status,
          comment: `Created by ${session.user.name || session.user.email} (${role})`,
          changedBy: session.user.id || null,
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (error) {
    console.error("Roadmap create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error." },
      { status: 500 }
    );
  }
}
