import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

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
    // --------------------------------
    // Authentication
    // --------------------------------

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------
    // Authorization
    // --------------------------------

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "ANALYST"
    ) {
      return NextResponse.json(
        {
          message:
            "You are not allowed to update feedback.",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------
    // Request body
    // --------------------------------

    const body = await request.json();

    const status = body.status;

    // --------------------------------
    // Validate status
    // --------------------------------

    const allowedStatuses = [
      "NEW",
      "REVIEWED",
      "RESOLVED",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          message: "Invalid status.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // Check feedback
    // --------------------------------

    const existingFeedback =
      await prisma.feedback.findUnique({
        where: {
          id: params.id,
        },
      });

    if (!existingFeedback) {
      return NextResponse.json(
        {
          message: "Feedback not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------
    // Update feedback
    // --------------------------------

    const updatedFeedback =
      await prisma.feedback.update({
        where: {
          id: params.id,
        },
        data: {
          status,
        },
      });

    // --------------------------------
    // Success
    // --------------------------------

    return NextResponse.json({
      message: "Feedback status updated successfully.",
      feedback: {
        id: updatedFeedback.id,
        status: updatedFeedback.status,
      },
    });
  } catch (error) {
    console.error(
      "Failed to update feedback status:",
      error
    );

    return NextResponse.json(
      {
        message: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}