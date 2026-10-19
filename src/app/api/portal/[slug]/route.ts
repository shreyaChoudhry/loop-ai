import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: "Portal slug is required." },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: slug.toLowerCase().trim() },
      select: {
        id: true,
        name: true,
        slug: true,
        portalEnabled: true,
        portalName: true,
        portalDescription: true,
        portalLogoUrl: true,
        portalAccentColor: true,
        showNotPlanned: true,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Feedback portal not found." },
        { status: 404 }
      );
    }

    if (!workspace.portalEnabled) {
      return NextResponse.json(
        { error: "This feedback portal is currently inactive." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      portal: {
        name: workspace.portalName || workspace.name,
        description:
          workspace.portalDescription ||
          "Share your feedback, feature ideas, and vote on what we should build next.",
        logoUrl: workspace.portalLogoUrl,
        accentColor: workspace.portalAccentColor || "#6655e8",
        showNotPlanned: workspace.showNotPlanned,
        slug: workspace.slug,
      },
    });
  } catch (error) {
    console.error("Portal fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
