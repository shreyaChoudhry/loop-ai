import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { findSimilarRequests } from "@/lib/duplicates";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { title, description } = body;

    if (!title || title.trim().length < 3) {
      return NextResponse.json({ success: true, matches: [] });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: slug.toLowerCase().trim() },
      select: { id: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Portal not found." }, { status: 404 });
    }

    const matches = await findSimilarRequests(
      title,
      description || "",
      workspace.id,
      undefined,
      0.4
    );

    return NextResponse.json({
      success: true,
      matches,
    });
  } catch (error) {
    console.error("Duplicate check error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
