import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const reports =
      await prisma.report.findMany({
        where: {
          workspaceId:
            session.user.workspaceId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
        },
      });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error(
      "Report history error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load report history.",
      },
      {
        status: 500,
      }
    );
  }
}