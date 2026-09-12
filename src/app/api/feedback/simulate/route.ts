import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/auth";
import { classifyFeedback } from "@/lib/classifier";

// --------------------------------
// Supported channels
// --------------------------------

type ChannelType =
  | "APP_REVIEWS"
  | "SUPPORT_TICKETS"
  | "SURVEY_RESPONSES"
  | "SALES_NOTES";

// --------------------------------
// Channel configuration
// --------------------------------

const CHANNEL_CONFIG: Record<
  ChannelType,
  {
    source:
      | "WEBSITE"
      | "EMAIL"
      | "SUPPORT"
      | "SURVEY"
      | "OTHER";
  }
> = {
  APP_REVIEWS: {
    source: "WEBSITE",
  },

  SUPPORT_TICKETS: {
    source: "SUPPORT",
  },

  SURVEY_RESPONSES: {
    source: "SURVEY",
  },

  SALES_NOTES: {
    source: "OTHER",
  },
};

// --------------------------------
// Sample feedback
// --------------------------------

const SAMPLE_DATA: Record<
  ChannelType,
  Array<{
    content: string;
    rating?: number;
  }>
> = {
  APP_REVIEWS: [
    {
      content:
        "I really like the new dashboard experience.",
      rating: 5,
    },
    {
      content:
        "The app is fast and the interface looks much cleaner now.",
      rating: 5,
    },
    {
      content:
        "Notifications are confusing and sometimes arrive very late.",
      rating: 2,
    },
    {
      content:
        "The login process works well but could be a little faster.",
      rating: 4,
    },
    {
      content:
        "The app crashes when I open notifications.",
      rating: 1,
    },
  ],

  SUPPORT_TICKETS: [
    {
      content:
        "I cannot reset my password even after requesting the reset email.",
      rating: 2,
    },
    {
      content:
        "My payment went through successfully, thank you for the quick support.",
      rating: 5,
    },
    {
      content:
        "The dashboard keeps loading and never shows my reports.",
      rating: 2,
    },
    {
      content:
        "Your support team resolved my issue very quickly.",
      rating: 5,
    },
    {
      content:
        "I am unable to update my account information.",
      rating: 2,
    },
  ],

  SURVEY_RESPONSES: [
    {
      content:
        "The product is easy to use and the overall experience is excellent.",
      rating: 5,
    },
    {
      content:
        "The reporting section needs more useful filters.",
      rating: 3,
    },
    {
      content:
        "I am satisfied with the product but the mobile experience could improve.",
      rating: 4,
    },
    {
      content:
        "The application feels slow during busy hours.",
      rating: 2,
    },
    {
      content:
        "Everything works as expected for my daily workflow.",
      rating: 4,
    },
  ],

  SALES_NOTES: [
    {
      content:
        "The customer liked the dashboard but wants better analytics.",
      rating: 4,
    },
    {
      content:
        "The prospect is concerned about slow performance.",
      rating: 2,
    },
    {
      content:
        "The customer was very happy with the onboarding experience.",
      rating: 5,
    },
    {
      content:
        "The buyer requested better notification controls.",
      rating: 3,
    },
    {
      content:
        "The customer wants more customization options.",
      rating: 3,
    },
  ],
};

// --------------------------------
// POST /api/feedback/simulate
// --------------------------------

export async function POST(
  request: Request
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
          error:
            "Unauthorized.",
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
            "You do not have permission to simulate feedback.",
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
    // Request body
    // --------------------------------

    let body: {
      channel?: ChannelType;
    };

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Request body is missing or invalid JSON.",
        },
        {
          status: 400,
        }
      );
    }

    const channel =
      body.channel;

    // --------------------------------
    // Validate channel
    // --------------------------------

    if (
      !channel ||
      !CHANNEL_CONFIG[channel]
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid feedback channel.",
        },
        {
          status: 400,
        }
      );
    }

    const config =
      CHANNEL_CONFIG[channel];

    const samples =
      SAMPLE_DATA[channel];

    let imported = 0;
    let failed = 0;

    const errors: Array<{
      index: number;
      content: string;
      error: string;
    }> = [];

    // --------------------------------
    // Process samples
    // --------------------------------

    for (
      let index = 0;
      index < samples.length;
      index++
    ) {
      const sample =
        samples[index];

      try {
        // --------------------------------
        // AI classification
        // --------------------------------

        const classification =
          await classifyFeedback(
            sample.content
          );

        // --------------------------------
        // Clean themes
        // --------------------------------

        const cleanedThemes =
          classification.themes
            .map((theme) =>
              theme.trim()
            )
            .filter(
              (theme) =>
                theme.length > 0
            );

        // --------------------------------
        // Save feedback
        // --------------------------------

        const feedback =
          await prisma.feedback.create({
            data: {
              content:
                sample.content,

              source:
                config.source,

              sentiment:
                classification.sentiment,

              sentimentScore:
                classification.sentimentScore,

              category:
                classification.featureArea,

              ...(sample.rating !==
              undefined
                ? {
                    rating:
                      sample.rating,
                  }
                : {}),

              status: "NEW",

              workspaceId,
            },
          });

        // --------------------------------
        // Save themes
        // --------------------------------

        for (
          const themeName of cleanedThemes
        ) {
          const theme =
            await prisma.theme.upsert({
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

          await prisma.feedbackTheme.createMany({
            data: [
              {
                feedbackId:
                  feedback.id,

                themeId:
                  theme.id,
              },
            ],

            skipDuplicates: true,
          });
        }

        imported++;
      } catch (error) {
        failed++;

        console.error(
          `Failed to process simulated feedback: ${sample.content}`,
          error
        );

        errors.push({
          index: index + 1,
          content:
            sample.content,

          error:
            error instanceof Error
              ? error.message
              : "Failed to classify or save feedback.",
        });
      }
    }

    // --------------------------------
    // Response
    // --------------------------------

    return NextResponse.json({
      success: true,

      imported,

      failed,

      total:
        samples.length,

      channel,

      message:
        failed > 0
          ? `${imported} sample feedback records imported with ${failed} failures.`
          : `${imported} sample feedback records imported successfully.`,

      errors:
        errors.length > 0
          ? errors
          : undefined,
    });
  } catch (error) {
    console.error(
      "Simulation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to simulate feedback.",
      },
      {
        status: 500,
      }
    );
  }
}