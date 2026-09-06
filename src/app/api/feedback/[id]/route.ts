import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function DELETE(
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
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------
    // Authorization
    // --------------------------------

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          message:
            "Only administrators can delete feedback.",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------
    // Check feedback exists
    // --------------------------------

    const feedback = await prisma.feedback.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!feedback) {
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
    // Delete feedback
    // --------------------------------

    await prisma.feedback.delete({
      where: {
        id: params.id,
      },
    });

    // --------------------------------
    // Success
    // --------------------------------

    return NextResponse.json({
      message: "Feedback deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Failed to delete feedback:",
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