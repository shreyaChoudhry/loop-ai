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
    if (role !== "ADMIN" && role !== "ANALYST") {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to create roadmap requests." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, category, status, effort, impact } = body;

    if (!title || title.trim().length < 3) {
      return NextResponse.json(
        { error: "Title must be at least 3 characters." },
        { status: 400 }
      );
    }

    const newRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.request.create({
        data: {
          title: title.trim(),
          description: description?.trim() || "",
          category: category ? category.trim() : null,
          status: status || "UNDER_REVIEW",
          effort: effort ? parseInt(effort, 10) : 3,
          impact: impact ? parseInt(impact, 10) : 3,
          workspaceId: session.user.workspaceId,
          voteCount: 0,
        },
      });

      await tx.requestStatusHistory.create({
        data: {
          requestId: created.id,
          newStatus: created.status,
          comment: `Created by ${session.user.name || session.user.email}`,
          changedBy: session.user.id,
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (error) {
    console.error("Roadmap create error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
