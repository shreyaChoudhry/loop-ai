import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/auth";
import { classifyFeedback } from "@/lib/classifier";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    // --------------------------------
    // Authentication
    // --------------------------------

    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------
    // Permission
    // --------------------------------

    const role =
      session.user.role;

    if (
      role !== "ADMIN" &&
      role !== "ANALYST"
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to re-classify feedback.",
        },
        {
          status: 403,
        }
      );
    }

    // --------------------------------
    // Workspace
    // --------------------------------

    const workspaceId =
      session.user.workspaceId;

    if (!workspaceId) {
      return NextResponse.json(
        {
          error:
            "Workspace information is missing.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // Feedback ID
    // --------------------------------

    const feedbackId =
      params.id;

    if (!feedbackId) {
      return NextResponse.json(
        {
          error:
            "Feedback ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // Find feedback
    // IMPORTANT:
    // workspaceId prevents cross-tenant access
    // --------------------------------

    const feedback =
      await prisma.feedback.findFirst({
        where: {
          id: feedbackId,
          workspaceId,
        },
        select: {
          id: true,
          content: true,
        },
      });

    if (!feedback) {
      return NextResponse.json(
        {
          error:
            "Feedback not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------
    // Classify with AI/mock classifier
    // --------------------------------

    const classification =
      await classifyFeedback(
        feedback.content
      );

    // --------------------------------
    // Clean themes
    // --------------------------------

    const cleanedThemes =
      Array.from(
        new Set(
          classification.themes
            .map((theme) =>
              theme.trim()
            )
            .filter(
              (theme) =>
                theme.length > 0
            )
        )
      );

    // --------------------------------
    // Update everything atomically
    // --------------------------------

    await prisma.$transaction(
      async (tx) => {
        // Update feedback AI fields
        await tx.feedback.update({
          where: {
            id: feedback.id,
          },
          data: {
            sentiment:
              classification.sentiment,

            sentimentScore:
              classification.sentimentScore,

            category:
              classification.featureArea,
          },
        });

        // Get current theme relations
        const existingRelations =
          await tx.feedbackTheme.findMany({
            where: {
              feedbackId:
                feedback.id,
            },
            select: {
              themeId: true,
            },
          });

        const oldThemeIds =
          existingRelations.map(
            (relation) =>
              relation.themeId
          );

        // Remove old relations
        await tx.feedbackTheme.deleteMany({
          where: {
            feedbackId:
              feedback.id,
          },
        });

        // Create new theme relations
        for (
          const themeName of cleanedThemes
        ) {
          const theme =
            await tx.theme.upsert({
              where: {
                workspaceId_name: {
                  workspaceId,
                  name: themeName,
                },
              },

              update: {},

              create: {
                workspaceId,
                name: themeName,
              },
            });

          await tx.feedbackTheme.create({
            data: {
              feedbackId:
                feedback.id,

              themeId:
                theme.id,
            },
          });
        }

        // Clean unused themes from this workspace
        if (
          oldThemeIds.length > 0
        ) {
          const remainingRelations =
            await tx.feedbackTheme.findMany({
              where: {
                themeId: {
                  in: oldThemeIds,
                },
              },
              select: {
                themeId: true,
              },
            });

          const stillUsedIds =
            new Set(
              remainingRelations.map(
                (relation) =>
                  relation.themeId
              )
            );

          const unusedIds =
            oldThemeIds.filter(
              (themeId) =>
                !stillUsedIds.has(
                  themeId
                )
            );

          if (
            unusedIds.length > 0
          ) {
            await tx.theme.deleteMany({
              where: {
                id: {
                  in: unusedIds,
                },
                workspaceId,
              },
            });
          }
        }
      }
    );

    // --------------------------------
    // Response
    // --------------------------------

    return NextResponse.json({
      success: true,

      feedbackId:
        feedback.id,

      classification,

      message:
        "Feedback re-classified successfully.",
    });
  } catch (error) {
    console.error(
      "Re-classification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to re-classify feedback.",
      },
      {
        status: 500,
      }
    );
  }
}