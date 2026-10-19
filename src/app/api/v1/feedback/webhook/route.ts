import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { classifyFeedback } from "@/lib/classifier";

const webhookPayloadSchema = z.object({
  content: z.string().min(2, "Feedback content is required").max(5000),
  source: z
    .enum(["WEBSITE", "EMAIL", "SUPPORT", "SURVEY", "OTHER"])
    .optional()
    .default("WEBSITE"),
  rating: z.number().int().min(1).max(5).optional(),
  category: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const apiKeyHeader = request.headers.get("x-api-key");

    let apiKey = apiKeyHeader;
    if (!apiKey && authHeader?.startsWith("Bearer ")) {
      apiKey = authHeader.substring(7).trim();
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Authentication required. Please provide your workspace API key in the 'x-api-key' or 'Authorization: Bearer <key>' header.",
        },
        { status: 401 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { apiKey },
      select: { id: true, name: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Invalid API key. Please verify your workspace key in Settings > Integrations." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = webhookPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content, source, rating, category } = parseResult.data;

    // Check duplicate: prevent re-importing the exact same feedback within 10 minutes
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const duplicate = await prisma.feedback.findFirst({
      where: {
        workspaceId: workspace.id,
        content: content.trim(),
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (duplicate) {
      return NextResponse.json({
        success: true,
        message: "Duplicate feedback within recent window ignored.",
        feedbackId: duplicate.id,
      });
    }

    // AI classification
    const classification = await classifyFeedback(content);
    const cleanedThemes = classification.themes
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newFeedback = await prisma.feedback.create({
      data: {
        content: content.trim(),
        source,
        rating,
        category: category || classification.featureArea,
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
        status: "NEW",
        workspaceId: workspace.id,
      },
    });

    // Create / associate themes
    for (const themeName of cleanedThemes) {
      const theme = await prisma.theme.upsert({
        where: {
          workspaceId_name: {
            workspaceId: workspace.id,
            name: themeName,
          },
        },
        update: {},
        create: {
          workspaceId: workspace.id,
          name: themeName,
        },
      });

      await prisma.feedbackTheme.createMany({
        data: [{ feedbackId: newFeedback.id, themeId: theme.id }],
        skipDuplicates: true,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Feedback captured and classified successfully.",
        feedback: {
          id: newFeedback.id,
          sentiment: newFeedback.sentiment,
          category: newFeedback.category,
          themes: cleanedThemes,
          createdAt: newFeedback.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Webhook ingestion error:", error);
    return NextResponse.json(
      { error: "Failed to process incoming feedback webhook." },
      { status: 500 }
    );
  }
}
