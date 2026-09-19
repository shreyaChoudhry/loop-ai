import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";

const memberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ANALYST", "VIEWER"]),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only ADMIN can create members
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Only workspace administrators can add members.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const result = memberSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { name, email, password, role } = result.data;

    const normalizedEmail = email.trim().toLowerCase();

    // Email is globally unique in our database
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

    const member = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
        workspaceId: session.user.workspaceId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Member added successfully.",
        member: {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add member error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while adding the member.",
      },
      { status: 500 }
    );
  }
}