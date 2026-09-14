import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import {
  generateVoiceOfCustomerReport,
} from "@/lib/report";

export async function POST(
  request: Request
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Only ADMIN and ANALYST can generate reports.
     */

    if (
      session.user.role !==
        "ADMIN" &&
      session.user.role !==
        "ANALYST"
    ) {
      return NextResponse.json(
        {
          error:
            "You don't have permission to generate reports.",
        },
        {
          status: 403,
        }
      );
    }

    let body: {
      startDate?: string;
      endDate?: string;
    } = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const startDate =
      body.startDate
        ? new Date(body.startDate)
        : undefined;

    const endDate =
      body.endDate
        ? new Date(body.endDate)
        : undefined;

    if (
      startDate &&
      Number.isNaN(
        startDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid start date.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      endDate &&
      Number.isNaN(
        endDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid end date.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      startDate &&
      endDate &&
      startDate > endDate
    ) {
      return NextResponse.json(
        {
          error:
            "Start date cannot be after end date.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Generate from REAL workspace data.
     */

    const generated =
      await generateVoiceOfCustomerReport(
        session.user.workspaceId,
        startDate,
        endDate
      );

    /*
     * Save exact reporting period.
     */

    const report =
      await prisma.report.create({
        data: {
          title:
            generated.title,

          content:
            generated.content,

          periodStart:
            generated.periodStart,

          periodEnd:
            generated.periodEnd,

          workspaceId:
            session.user.workspaceId,
        },

        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          periodStart: true,
          periodEnd: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        report,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Report generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate report.",
      },
      {
        status: 500,
      }
    );
  }
}