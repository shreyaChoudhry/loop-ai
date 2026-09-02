import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "LOOP Demo Workspace",
    },
  });

  console.log("✅ Workspace created");

  // Users
  await prisma.user.createMany({
    data: [
      {
        name: "LOOP Admin",
        email: "admin@loop.dev",
        password: "demo-password",
        role: "ADMIN",
        workspaceId: workspace.id,
      },
      {
        name: "LOOP Analyst",
        email: "analyst@loop.dev",
        password: "demo-password",
        role: "ANALYST",
        workspaceId: workspace.id,
      },
      {
        name: "LOOP Viewer",
        email: "viewer@loop.dev",
        password: "demo-password",
        role: "VIEWER",
        workspaceId: workspace.id,
      },
    ],
  });

  console.log("✅ Users created");

  // Themes
  const performance = await prisma.theme.create({
    data: {
      name: "Performance",
      workspaceId: workspace.id,
    },
  });

  const ux = await prisma.theme.create({
    data: {
      name: "UX",
      workspaceId: workspace.id,
    },
  });

  const authentication = await prisma.theme.create({
    data: {
      name: "Authentication",
      workspaceId: workspace.id,
    },
  });

  console.log("✅ Themes created");

  // Feedback
  const feedback1 = await prisma.feedback.create({
    data: {
      content: "The checkout page is very slow",
      source: "WEBSITE",
      sentiment: "NEGATIVE",
      sentimentScore: 0.15,
      category: "Performance",
      workspaceId: workspace.id,
    },
  });

  const feedback2 = await prisma.feedback.create({
    data: {
      content: "I love the new dashboard",
      source: "SURVEY",
      sentiment: "POSITIVE",
      sentimentScore: 0.92,
      category: "UX",
      workspaceId: workspace.id,
    },
  });

  const feedback3 = await prisma.feedback.create({
    data: {
      content: "Login OTP isn't working",
      source: "SUPPORT",
      sentiment: "NEGATIVE",
      sentimentScore: 0.12,
      category: "Authentication",
      workspaceId: workspace.id,
    },
  });

  const feedback4 = await prisma.feedback.create({
    data: {
      content: "Mobile experience could be better",
      source: "EMAIL",
      sentiment: "NEUTRAL",
      sentimentScore: 0.48,
      category: "UX",
      workspaceId: workspace.id,
    },
  });

  console.log("✅ Feedback created");

  // Feedback ↔ Theme relationships
  await prisma.feedbackTheme.createMany({
    data: [
      {
        feedbackId: feedback1.id,
        themeId: performance.id,
      },
      {
        feedbackId: feedback2.id,
        themeId: ux.id,
      },
      {
        feedbackId: feedback3.id,
        themeId: authentication.id,
      },
      {
        feedbackId: feedback4.id,
        themeId: ux.id,
      },
    ],
  });

  console.log("✅ Feedback themes linked");

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });