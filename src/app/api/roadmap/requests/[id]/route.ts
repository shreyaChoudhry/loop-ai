import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { notifySubscribersForRequest } from "@/lib/email";

export async function PATCH(
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
        { error: "Forbidden: You do not have permission to update requests." },
        { status: 403 }
      );
    }

    const { id: requestId } = params;
    const body = await request.json();
    const { status, effort, impact, releaseNote, comment } = body;

    const existing = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        workspaceId: true,
        status: true,
        title: true,
      },
    });

    if (!existing || existing.workspaceId !== session.user.workspaceId) {
      return NextResponse.json(
        { error: "Request not found in this workspace." },
        { status: 404 }
      );
    }

    const statusChanged = status && status !== existing.status;
    const oldStatus = existing.status;

    const updateData: Parameters<typeof prisma.request.update>[0]["data"] = {};
    if (status) {
      updateData.status = status;
      if (status === "SHIPPED") {
        updateData.shippedAt = new Date();
      }
    }
    if (effort !== undefined) updateData.effort = Number(effort);
    if (impact !== undefined) updateData.impact = Number(impact);
    if (releaseNote !== undefined) updateData.releaseNote = releaseNote;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.request.update({
        where: { id: requestId },
        data: updateData,
      });

      if (statusChanged) {
        await tx.requestStatusHistory.create({
          data: {
            requestId,
            oldStatus,
            newStatus: status,
            comment: comment || `Status updated to ${status} by ${session.user.name || session.user.email}`,
            changedBy: session.user.id,
          },
        });
      }

      return result;
    });

    // If status changed, notify subscribed customers asynchronously without blocking response
    let notificationSummary = null;
    if (statusChanged) {
      try {
        notificationSummary = await notifySubscribersForRequest(
          requestId,
          status,
          oldStatus
        );
      } catch (notifyErr) {
        console.error("Status notification dispatch error:", notifyErr);
      }
    }

    return NextResponse.json({
      success: true,
      request: updated,
      notifications: notificationSummary,
    });
  } catch (error) {
    console.error("Request update error:", error);
    return NextResponse.json(
      { error: "Failed to update request." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only workspace admins can delete requests." },
        { status: 403 }
      );
    }

    const { id: requestId } = params;

    const existing = await prisma.request.findUnique({
      where: { id: requestId },
      select: { id: true, workspaceId: true },
    });

    if (!existing || existing.workspaceId !== session.user.workspaceId) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    await prisma.request.delete({
      where: { id: requestId },
    });

    return NextResponse.json({
      success: true,
      message: "Request deleted successfully.",
    });
  } catch (error) {
    console.error("Request delete error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
