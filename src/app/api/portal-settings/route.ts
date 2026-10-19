import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: session.user.workspaceId },
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
        digestEnabled: true,
        digestEmail: true,
        apiKey: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      settings: workspace,
    });
  } catch (error) {
    console.error("Portal settings get error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only workspace admins can update portal settings." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      slug,
      portalEnabled,
      portalName,
      portalDescription,
      portalLogoUrl,
      portalAccentColor,
      showNotPlanned,
      digestEnabled,
      digestEmail,
      regenerateApiKey,
    } = body;

    const updateData: Parameters<typeof prisma.workspace.update>[0]["data"] = {};

    if (slug !== undefined) {
      const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
      if (cleanSlug.length < 3 || cleanSlug.length > 30) {
        return NextResponse.json(
          { error: "Portal slug must be between 3 and 30 alphanumeric characters." },
          { status: 400 }
        );
      }

      // Check uniqueness
      const existing = await prisma.workspace.findUnique({
        where: { slug: cleanSlug },
        select: { id: true },
      });

      if (existing && existing.id !== session.user.workspaceId) {
        return NextResponse.json(
          { error: "This portal slug is already taken by another workspace. Please choose a different one." },
          { status: 409 }
        );
      }

      updateData.slug = cleanSlug;
    }

    if (portalEnabled !== undefined) updateData.portalEnabled = Boolean(portalEnabled);
    if (portalName !== undefined) updateData.portalName = portalName?.trim() || null;
    if (portalDescription !== undefined) updateData.portalDescription = portalDescription?.trim() || null;
    if (portalLogoUrl !== undefined) updateData.portalLogoUrl = portalLogoUrl?.trim() || null;
    if (portalAccentColor !== undefined) updateData.portalAccentColor = portalAccentColor?.trim() || "#6655e8";
    if (showNotPlanned !== undefined) updateData.showNotPlanned = Boolean(showNotPlanned);
    if (digestEnabled !== undefined) updateData.digestEnabled = Boolean(digestEnabled);
    if (digestEmail !== undefined) updateData.digestEmail = digestEmail?.trim() || null;

    if (regenerateApiKey) {
      updateData.apiKey = `loop_live_${crypto.randomBytes(24).toString("hex")}`;
    }

    const updated = await prisma.workspace.update({
      where: { id: session.user.workspaceId },
      data: updateData,
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
        digestEnabled: true,
        digestEmail: true,
        apiKey: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Portal settings updated successfully.",
      settings: updated,
    });
  } catch (error) {
    console.error("Portal settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update portal settings." },
      { status: 500 }
    );
  }
}
