import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany({
      include: {
        users: true,
        feedback: true,
        themes: true,
      },
    });

    return Response.json({
      success: true,
      data: workspaces,
    });
  } catch (error) {
    console.error("Database test failed:", error);

    return Response.json(
      {
        success: false,
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
}