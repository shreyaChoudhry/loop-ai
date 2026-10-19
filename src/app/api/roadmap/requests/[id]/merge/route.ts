import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "ANALYST") {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to merge requests." },
        { status: 403 }
      );
    }

    const { id: sourceRequestId } = params;
    const body = await request.json();
    const { canonicalRequestId, reason, unlink } = body;

    const sourceReq = await prisma.request.findUnique({
      where: { id: sourceRequestId },
      select: { id: true, workspaceId: true, voteCount: true, title: true },
    });

    if (!sourceReq || sourceReq.workspaceId !== session.user.workspaceId) {
      return NextResponse.json(
        { error: "Source request not found in this workspace." },
        { status: 404 }
      );
    }

    if (unlink) {
      await prisma.request.update({
        where: { id: sourceRequestId },
        data: {
          canonicalRequestId: null,
          duplicateReason: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Request unlinked successfully.",
      });
    }

    if (!canonicalRequestId) {
      return NextResponse.json(
        { error: "Canonical request ID is required to link duplicate." },
        { status: 400 }
      );
    }

    if (canonicalRequestId === sourceRequestId) {
      return NextResponse.json(
        { error: "Cannot link a request to itself." },
        { status: 400 }
      );
    }

    const canonicalReq = await prisma.request.findUnique({
      where: { id: canonicalRequestId },
      select: { id: true, workspaceId: true, title: true },
    });

    if (!canonicalReq || canonicalReq.workspaceId !== session.user.workspaceId) {
      return NextResponse.json(
        { error: "Canonical target request not found in this workspace." },
        { status: 404 }
      );
    }

    // Link source duplicate to canonical without destroying source
    await prisma.$transaction(async (tx) => {
      await tx.request.update({
        where: { id: sourceRequestId },
        data: {
          canonicalRequestId: canonicalReq.id,
          duplicateReason: reason || `Linked as duplicate of "${canonicalReq.title}"`,
        },
      });

      await tx.requestStatusHistory.create({
        data: {
          requestId: sourceRequestId,
          newStatus: "UNDER_REVIEW",
          comment: `Linked as duplicate to "${canonicalReq.title}" by ${
            session.user.name || session.user.email
          }`,
          changedBy: session.user.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `"${sourceReq.title}" linked to "${canonicalReq.title}".`,
    });
  } catch (error) {
    console.error("Duplicate merge/link error:", error);
    return NextResponse.json(
      { error: "Failed to link requests." },
      { status: 500 }
    );
  }
}
