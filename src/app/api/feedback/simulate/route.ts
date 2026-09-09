import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/auth";

type ChannelType =
  | "APP_REVIEWS"
  | "SUPPORT_TICKETS"
  | "SURVEY_RESPONSES"
  | "SALES_NOTES";

const CHANNEL_CONFIG = {
  APP_REVIEWS: {
    source: "OTHER" as const,
    category: "App Review",
  },

  SUPPORT_TICKETS: {
    source: "SUPPORT" as const,
    category: "Support",
  },

  SURVEY_RESPONSES: {
    source: "SURVEY" as const,
    category: "Survey",
  },

  SALES_NOTES: {
    source: "OTHER" as const,
    category: "Sales",
  },
};

const SAMPLE_DATA: Record<
  ChannelType,
  Array<{
    content: string;
    sentiment:
      | "POSITIVE"
      | "NEUTRAL"
      | "NEGATIVE";
    sentimentScore: number;
    rating: number;
  }>
> = {
  APP_REVIEWS: [
    {
      content:
        "The new mobile layout feels much easier to use.",
      sentiment: "POSITIVE",
      sentimentScore: 0.9,
      rating: 5,
    },
    {
      content:
        "The app looks good but loading is sometimes slow.",
      sentiment: "NEUTRAL",
      sentimentScore: 0.1,
      rating: 3,
    },
    {
      content:
        "The latest update made the navigation confusing.",
      sentiment: "NEGATIVE",
      sentimentScore: -0.7,
      rating: 2,
    },
    {
      content:
        "I really like the new dashboard experience.",
      sentiment: "POSITIVE",
      sentimentScore: 0.85,
      rating: 5,
    },
    {
      content:
        "The app crashes when I open notifications.",
      sentiment: "NEGATIVE",
      sentimentScore: -0.9,
      rating: 1,
    },
  ],

  SUPPORT_TICKETS: [
    {
      content:
        "Customer cannot reset the password.",
      sentiment: "NEGATIVE",
      sentimentScore: -0.8,
      rating: 2,
    },
    {
      content:
        "Support resolved the billing issue quickly.",
      sentiment: "POSITIVE",
      sentimentScore: 0.8,
      rating: 5,
    },
    {
      content:
        "Customer is waiting for a response from support.",
      sentiment: "NEGATIVE",
      sentimentScore: -0.6,
      rating: 2,
    },
    {
      content:
        "The support team explained the issue clearly.",
      sentiment: "POSITIVE",
      sentimentScore: 0.75,
      rating: 4,
    },
    {
      content:
        "Customer asked how to change the account email.",
      sentiment: "NEUTRAL",
      sentimentScore: 0,
      rating: 3,
    },
  ],

  SURVEY_RESPONSES: [
    {
      content:
        "The checkout experience is smooth and simple.",
      sentiment: "POSITIVE",
      sentimentScore: 0.9,
      rating: 5,
    },
    {
      content:
        "Pricing is reasonable but could be clearer.",
      sentiment: "NEUTRAL",
      sentimentScore: 0.1,
      rating: 3,
    },
    {
      content:
        "The product feels difficult to learn at first.",
      sentiment: "NEGATIVE",
      sentimentScore: -0.5,
      rating: 2,
    },
    {
      content:
        "Overall I am happy with the experience.",
      sentiment: "POSITIVE",
      sentimentScore: 0.8,
      rating: 4,
    },
    {
      content:
        "Reporting needs more customization options.",
      sentiment: "NEGATIVE",
      sentimentScore: -0.6,
      rating: 2,
    },
  ],

  SALES_NOTES: [
    {
      content:
        "Customer requested better reporting for the team.",
      sentiment: "NEUTRAL",
      sentimentScore: 0.1,
      rating: 3,
    },
    {
      content:
        "Prospect liked the analytics and dashboard features.",
      sentiment: "POSITIVE",
      sentimentScore: 0.85,
      rating: 5,
    },
    {
      content:
        "Customer is concerned about the current pricing.",
      sentiment: "NEGATIVE",
      sentimentScore: -0.6,
      rating: 2,
    },
    {
      content:
        "Team wants stronger export functionality.",
      sentiment: "NEUTRAL",
      sentimentScore: 0,
      rating: 3,
    },
    {
      content:
        "Customer is very interested in the enterprise plan.",
      sentiment: "POSITIVE",
      sentimentScore: 0.9,
      rating: 5,
    },
  ],
};

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
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------
    // Permissions
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
            "You do not have permission to import simulated feedback.",
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
    // Read request
    // --------------------------------

    const body =
      await request.json();

    const channel =
      body.channel as ChannelType;

    // --------------------------------
    // Validate channel
    // --------------------------------

    if (
      !channel ||
      !SAMPLE_DATA[channel]
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid simulated channel.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------
    // Get configuration
    // --------------------------------

    const config =
      CHANNEL_CONFIG[channel];

    const samples =
      SAMPLE_DATA[channel];

    // --------------------------------
    // Prepare records
    // --------------------------------

    const records =
      samples.map((sample) => ({
        content:
          sample.content,

        source:
          config.source,

        sentiment:
          sample.sentiment,

        sentimentScore:
          sample.sentimentScore,

        category:
          config.category,

        rating:
          sample.rating,

        status:
          "NEW" as const,

        workspaceId,
      }));

    // --------------------------------
    // Insert
    // --------------------------------

    const result =
      await prisma.feedback.createMany(
        {
          data: records,
        }
      );

    // --------------------------------
    // Response
    // --------------------------------

    return NextResponse.json({
      success: true,
      imported: result.count,
      channel,
      message:
        `${result.count} sample feedback records imported successfully.`,
    });
  } catch (error) {
    console.error(
      "Simulated feedback import error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to import simulated feedback.",
      },
      {
        status: 500,
      }
    );
  }
}