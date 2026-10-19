import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

const followUpSchema = z.object({
  satisfied: z.boolean(),
  comment: z.string().max(1000).optional(),
  authorEmail: z.string().email().optional().or(z.literal("")),
});

export async function POST(
  request: Request,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const { slug, id: requestId } = params;
    const body = await request.json();

    const parseResult = followUpSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { satisfied, comment, authorEmail } = parseResult.data;

    const reqRecord = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        workspace: {
          select: { slug: true },
        },
      },
    });

    if (
      !reqRecord ||
      reqRecord.workspace.slug?.toLowerCase() !== slug.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Request not found in this workspace." },
        { status: 404 }
      );
    }

    if (reqRecord.status !== "SHIPPED") {
      return NextResponse.json(
        { error: "Follow-up feedback is only available for shipped features." },
        { status: 400 }
      );
    }

    await prisma.followUpFeedback.create({
      data: {
        requestId,
        satisfied,
        comment: comment?.trim() || null,
        authorEmail: authorEmail ? authorEmail.trim().toLowerCase() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for sharing your feedback on this release!",
    });
  } catch (error) {
    console.error("Follow-up submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit follow-up feedback." },
      { status: 500 }
    );
  }
}
