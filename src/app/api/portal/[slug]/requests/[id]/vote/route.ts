import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const voteSchema = z.object({
  voterToken: z.string().min(6, "Voter identifier required"),
  voterEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  notifyOnUpdate: z.boolean().optional().default(true),
});

export async function POST(
  request: Request,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const { slug, id: requestId } = params;
    const body = await request.json();

    const parseResult = voteSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { voterToken, voterEmail, notifyOnUpdate } = parseResult.data;

    // Verify workspace and request
    const targetRequest = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        workspace: {
          select: {
            id: true,
            slug: true,
            portalEnabled: true,
          },
        },
      },
    });

    if (
      !targetRequest ||
      targetRequest.workspace.slug?.toLowerCase() !== slug.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Request not found in this workspace." },
        { status: 404 }
      );
    }

    if (!targetRequest.workspace.portalEnabled) {
      return NextResponse.json(
        { error: "Voting is disabled for this portal." },
        { status: 403 }
      );
    }

    const normalizedEmail = voterEmail ? voterEmail.trim().toLowerCase() : null;

    // Check existing vote
    const existingVote = await prisma.vote.findUnique({
      where: {
        requestId_voterToken: {
          requestId,
          voterToken,
        },
      },
    });

    let voted = false;
    let newVoteCount = targetRequest.voteCount;

    if (existingVote) {
      // Toggle off / remove vote
      await prisma.$transaction(async (tx) => {
        await tx.vote.delete({
          where: { id: existingVote.id },
        });

        const updated = await tx.request.update({
          where: { id: requestId },
          data: {
            voteCount: { decrement: 1 },
          },
          select: { voteCount: true },
        });

        newVoteCount = Math.max(0, updated.voteCount);
      });
      voted = false;
    } else {
      // Add vote
      await prisma.$transaction(async (tx) => {
        await tx.vote.create({
          data: {
            requestId,
            workspaceId: targetRequest.workspace.id,
            voterToken,
            voterEmail: normalizedEmail,
            notifyOnUpdate: Boolean(notifyOnUpdate),
          },
        });

        const updated = await tx.request.update({
          where: { id: requestId },
          data: {
            voteCount: { increment: 1 },
          },
          select: { voteCount: true },
        });

        newVoteCount = updated.voteCount;
      });
      voted = true;
    }

    return NextResponse.json({
      success: true,
      voted,
      voteCount: newVoteCount,
      message: voted ? "Vote recorded!" : "Vote removed.",
    });
  } catch (error) {
    console.error("Voting error:", error);
    return NextResponse.json(
      { error: "Failed to process vote." },
      { status: 500 }
    );
  }
}
