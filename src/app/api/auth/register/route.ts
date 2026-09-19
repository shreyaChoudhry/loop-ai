import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  workspaceName: z
    .string()
    .min(2, "Company / Workspace name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { name, workspaceName, email, password } = parseResult.data;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedWorkspaceName = workspaceName.trim();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create workspace + first ADMIN user together
    const transactionResult = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: normalizedWorkspaceName,
        },
      });

      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: "ADMIN",
          workspaceId: workspace.id,
        },
      });

      return {
        workspace,
        user,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Workspace and admin account created successfully.",
        workspace: {
          id: transactionResult.workspace.id,
          name: transactionResult.workspace.name,
        },
        user: {
          id: transactionResult.user.id,
          name: transactionResult.user.name,
          email: transactionResult.user.email,
          role: transactionResult.user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while creating your workspace.",
      },
      { status: 500 }
    );
  }
}