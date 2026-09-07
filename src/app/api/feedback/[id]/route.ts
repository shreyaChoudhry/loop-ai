import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/auth";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(
      authOptions
    );

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const role = session.user.role;

    if (
      role !== "ADMIN" &&
      role !== "ANALYST"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to update feedback status.",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const status = body.status;

    const allowedStatuses = [
      "NEW",
      "REVIEWED",
      "ACTIONED",
    ];

    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          error: "Invalid status.",
        },
        {
          status: 400,
        }
      );
    }

    const feedback =
      await prisma.feedback.findUnique({
        where: {
          id: params.id,
        },
      });

    if (!feedback) {
      return NextResponse.json(
        {
          error: "Feedback not found.",
        },
        {
          status: 404,
        }
      );
    }

    const updatedFeedback =
      await prisma.feedback.update({
        where: {
          id: params.id,
        },
        data: {
          status: status as
            | "NEW"
            | "REVIEWED"
            | "ACTIONED",
        },
        select: {
          id: true,
          status: true,
        },
      });

    return NextResponse.json({
      success: true,
      feedback: updatedFeedback,
    });
  } catch (error) {
    console.error(
      "Status update error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update feedback status.",
      },
      {
        status: 500,
      }
    );
  }
}