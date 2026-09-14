import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import {
  generateVoiceOfCustomerReport,
} from "@/lib/report";

const reportSchema = z.object({
  startDate: z
    .string()
    .optional(),

  endDate: z
    .string()
    .optional(),
});

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
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

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

    let body: unknown = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const validation =
      reportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error:
            "Invalid report dates.",
        },
        {
          status: 400,
        }
      );
    }

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (
      validation.data.startDate &&
      validation.data.endDate
    ) {
      startDate = new Date(
        validation.data.startDate
      );

      endDate = new Date(
        validation.data.endDate
      );

      if (
        Number.isNaN(
          startDate.getTime()
        ) ||
        Number.isNaN(
          endDate.getTime()
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid report dates.",
          },
          {
            status: 400,
          }
        );
      }

      if (startDate > endDate) {
        return NextResponse.json(
          {
            error:
              "Start date must be before end date.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const report =
      await generateVoiceOfCustomerReport(
        session.user.workspaceId,
        startDate,
        endDate
      );

    const savedReport =
      await prisma.report.create({
        data: {
          title: report.title,
          content: report.content,
          workspaceId:
            session.user.workspaceId,
        },
      });

    return NextResponse.json(
      {
        success: true,
        report: savedReport,
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
          "Failed to generate report.",
      },
      {
        status: 500,
      }
    );
  }
}