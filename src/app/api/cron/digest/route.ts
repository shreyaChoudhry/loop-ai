import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { sendEmail, formatPublicStatus } from "@/lib/email";

export const dynamic = "force-dynamic";

interface DigestStats {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  topRequestsCount: number;
  shippedCount: number;
}

interface DigestData {
  stats: DigestStats;
  periodString: string;
  digestHtml: string;
}

async function generateDigestData(
  workspaceId: string,
  workspaceName: string
): Promise<DigestData> {
  // 7-day reporting period
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  // 1. Feedback counts in last 7 days
  const [totalFeedback, negativeFeedback, positiveFeedback] = await Promise.all([
    prisma.feedback.count({
      where: {
        workspaceId,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "NEGATIVE",
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.feedback.count({
      where: {
        workspaceId,
        sentiment: "POSITIVE",
        createdAt: { gte: sevenDaysAgo },
      },
    }),
  ]);

  // 2. Top voted feature requests
  const topRequests = await prisma.request.findMany({
    where: {
      workspaceId,
      canonicalRequestId: null,
    },
    orderBy: { voteCount: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      voteCount: true,
    },
  });

  // 3. Recently shipped requests
  const shippedRecently = await prisma.request.findMany({
    where: {
      workspaceId,
      status: "SHIPPED",
      shippedAt: { gte: sevenDaysAgo },
    },
    select: {
      id: true,
      title: true,
      releaseNote: true,
      shippedAt: true,
    },
  });

  // 4. Critical negative feedback requiring attention
  const criticalFeedback = await prisma.feedback.findMany({
    where: {
      workspaceId,
      sentiment: "NEGATIVE",
      createdAt: { gte: sevenDaysAgo },
    },
    select: {
      id: true,
      content: true,
      category: true,
      createdAt: true,
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "https://loop-ai-wu6n.vercel.app";
  const periodString = `${sevenDaysAgo.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  const digestHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #111827; background-color: #ffffff;">
      <div style="padding-bottom: 16px; border-bottom: 2px solid #6655e8; margin-bottom: 24px;">
        <h1 style="margin: 0; color: #111827; font-size: 22px;">Weekly Founder Digest ◉ LOOP</h1>
        <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">${workspaceName} &bull; ${periodString}</p>
      </div>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em;">7-Day Feedback Summary</h3>
        <div style="display: flex; gap: 16px;">
          <div style="flex: 1; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <div style="font-size: 24px; font-weight: bold; color: #6655e8;">${totalFeedback}</div>
            <div style="font-size: 12px; color: #6b7280;">New Feedback</div>
          </div>
          <div style="flex: 1; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">${positiveFeedback}</div>
            <div style="font-size: 12px; color: #6b7280;">Positive</div>
          </div>
          <div style="flex: 1; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${negativeFeedback}</div>
            <div style="font-size: 12px; color: #6b7280;">Negative / Issues</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 16px; color: #111827; margin: 0 0 12px;">Top-Voted Customer Requests</h3>
        ${
          topRequests.length === 0
            ? '<p style="color: #9ca3af; font-size: 14px;">No requests recorded yet.</p>'
            : `<ul style="list-style: none; padding: 0; margin: 0;">
                ${topRequests
                  .map(
                    (r) => `
                  <li style="padding: 10px 12px; margin-bottom: 8px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong>${r.title}</strong>
                      <span style="display: inline-block; margin-left: 8px; font-size: 11px; padding: 2px 6px; background: #f3f4f6; color: #4b5563; border-radius: 4px;">${formatPublicStatus(
                        r.status
                      )}</span>
                    </div>
                    <span style="font-weight: bold; color: #6655e8;">${r.voteCount} votes</span>
                  </li>
                `
                  )
                  .join("")}
              </ul>`
        }
      </div>

      ${
        shippedRecently.length > 0
          ? `
        <div style="margin-bottom: 24px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px;">
          <h3 style="font-size: 15px; color: #166534; margin: 0 0 8px;">🎉 Shipped in the Last 7 Days</h3>
          ${shippedRecently
            .map(
              (s) => `
            <div style="margin-bottom: 8px;">
              <strong style="color: #14532d;">${s.title}</strong>
              ${
                s.releaseNote
                  ? `<div style="font-size: 13px; color: #166534; margin-top: 2px;">${s.releaseNote}</div>`
                  : ""
              }
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }

      ${
        criticalFeedback.length > 0
          ? `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 15px; color: #b91c1c; margin: 0 0 8px;">⚠️ Feedback Requiring Attention</h3>
          ${criticalFeedback
            .map(
              (f) => `
            <div style="padding: 10px 12px; margin-bottom: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 13px; color: #991b1b;">
              "${f.content}"
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }

      <div style="margin: 28px 0; text-align: center;">
        <a href="${baseUrl}/dashboard" style="background: #6655e8; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px; display: inline-block;">
          Open LOOP Dashboard
        </a>
      </div>

      <div style="padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
        This digest is generated from actual workspace data in LOOP. You can configure or disable this email in <a href="${baseUrl}/dashboard/settings" style="color: #6655e8;">Settings</a>.
      </div>
    </div>
  `;

  return {
    stats: {
      totalFeedback,
      positiveFeedback,
      negativeFeedback,
      topRequestsCount: topRequests.length,
      shippedCount: shippedRecently.length,
    },
    periodString,
    digestHtml,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const bearerSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const cronSecret = searchParams.get("secret") || bearerSecret;

    const sendTest =
      searchParams.get("sendTest") === "true" ||
      searchParams.get("test") === "true";
    const preview =
      searchParams.get("preview") === "true" && !sendTest;
    const targetWorkspaceId = searchParams.get("workspaceId");

    const session = await getServerSession(authOptions);
    const isAuthorizedCron = Boolean(
      process.env.CRON_SECRET && cronSecret && cronSecret === process.env.CRON_SECRET
    );
    const isAdminSession = Boolean(
      session?.user?.workspaceId && session?.user?.role === "ADMIN"
    );
    const isMemberSession = Boolean(session?.user?.workspaceId);

    // ----------------------------------------------------
    // Scenario 1: Admin sends a REAL test digest email (sendTest=true)
    // ----------------------------------------------------
    if (sendTest) {
      if (!isAdminSession && !isAuthorizedCron) {
        if (session?.user) {
          return NextResponse.json(
            { error: "Forbidden: Only workspace administrators can trigger test digest emails." },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { error: "Unauthorized: Valid ADMIN session or CRON_SECRET is required." },
          { status: 401 }
        );
      }

      // If invoked by session, restrict strictly to the user's workspace
      const workspaceId = session?.user?.workspaceId || targetWorkspaceId;
      if (!workspaceId) {
        return NextResponse.json(
          { error: "Workspace ID is required for test digest." },
          { status: 400 }
        );
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          users: {
            where: { role: "ADMIN" },
            select: { email: true, name: true },
          },
        },
      });

      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
      }

      const recipientEmail = workspace.digestEmail || workspace.users[0]?.email;
      if (!recipientEmail) {
        return NextResponse.json(
          {
            error:
              "No recipient email configured. Please enter a Digest Recipient Email and click Save Settings first.",
          },
          { status: 400 }
        );
      }

      const { stats, periodString, digestHtml } = await generateDigestData(
        workspace.id,
        workspace.name
      );

      // Require real delivery so unconfigured email is never faked
      const emailResult = await sendEmail({
        to: recipientEmail,
        subject: `[Test] Weekly LOOP Digest: ${stats.totalFeedback} new feedback items, ${stats.topRequestsCount} top requests`,
        html: digestHtml,
        requireRealDelivery: true,
      });

      if (!emailResult.success || emailResult.simulated) {
        return NextResponse.json(
          {
            success: false,
            sent: false,
            simulated: Boolean(emailResult.simulated),
            error: emailResult.error || "Real email delivery failed or provider is unconfigured.",
            recipient: recipientEmail,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        sent: true,
        simulated: false,
        provider: emailResult.provider,
        recipient: recipientEmail,
        period: periodString,
        stats,
        message: `Test digest email successfully delivered to ${recipientEmail}.`,
      });
    }

    // ----------------------------------------------------
    // Scenario 2: Preview current week digest data in UI (preview=true)
    // ----------------------------------------------------
    if (preview) {
      if (!isMemberSession && !isAuthorizedCron) {
        return NextResponse.json(
          { error: "Unauthorized: Missing valid session or CRON_SECRET." },
          { status: 401 }
        );
      }

      const workspaceId = session?.user?.workspaceId || targetWorkspaceId;
      if (!workspaceId) {
        return NextResponse.json(
          { error: "Workspace ID is required for digest preview." },
          { status: 400 }
        );
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          users: {
            where: { role: "ADMIN" },
            select: { email: true, name: true },
          },
        },
      });

      if (!workspace) {
        return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
      }

      const recipientEmail = workspace.digestEmail || workspace.users[0]?.email;
      if (!recipientEmail) {
        return NextResponse.json(
          { error: "No recipient email configured for digest." },
          { status: 400 }
        );
      }

      const { stats, periodString, digestHtml } = await generateDigestData(
        workspace.id,
        workspace.name
      );

      return NextResponse.json({
        success: true,
        preview: true,
        recipient: recipientEmail,
        period: periodString,
        stats,
        html: digestHtml,
      });
    }

    // ----------------------------------------------------
    // Scenario 3: Automated Scheduled Cron Execution
    // Requires a valid CRON_SECRET
    // ----------------------------------------------------
    if (!isAuthorizedCron) {
      return NextResponse.json(
        { error: "Unauthorized: A valid CRON_SECRET is required for scheduled cron execution." },
        { status: 401 }
      );
    }

    // 6-day cycle threshold to prevent duplicate weekly sends for the same period
    const minCycleInterval = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);

    // If specific workspace targeted via cron
    if (targetWorkspaceId) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: targetWorkspaceId },
        include: {
          users: {
            where: { role: "ADMIN" },
            select: { email: true, name: true },
          },
        },
      });

      if (!workspace || !workspace.digestEnabled) {
        return NextResponse.json({
          success: true,
          message: "Digest disabled or workspace not found.",
          sent: false,
        });
      }

      const recipientEmail = workspace.digestEmail || workspace.users[0]?.email;
      if (!recipientEmail) {
        return NextResponse.json(
          { error: "No recipient email configured." },
          { status: 400 }
        );
      }

      // Optimistic concurrency lock: Claim workspace atomically
      const claim = await prisma.workspace.updateMany({
        where: {
          id: workspace.id,
          digestEnabled: true,
          OR: [
            { digestLastSentAt: null },
            { digestLastSentAt: { lt: minCycleInterval } },
          ],
        },
        data: {
          digestLastSentAt: new Date(),
        },
      });

      if (claim.count === 0) {
        return NextResponse.json({
          success: true,
          sent: false,
          skipped: true,
          message: "Digest already sent for this weekly period or claimed by concurrent execution.",
        });
      }

      const { stats, digestHtml } = await generateDigestData(
        workspace.id,
        workspace.name
      );

      const emailResult = await sendEmail({
        to: recipientEmail,
        subject: `Weekly LOOP Digest: ${stats.totalFeedback} new feedback items, ${stats.topRequestsCount} top requests`,
        html: digestHtml,
        requireRealDelivery: true,
      });

      // If delivery failed or was simulated, revert timestamp
      if (!emailResult.success || emailResult.simulated) {
        await prisma.workspace.update({
          where: { id: workspace.id },
          data: { digestLastSentAt: workspace.digestLastSentAt },
        });

        return NextResponse.json(
          {
            success: false,
            sent: false,
            simulated: Boolean(emailResult.simulated),
            error: emailResult.error || "Email delivery failed or provider unconfigured.",
            recipient: recipientEmail,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        sent: true,
        simulated: false,
        provider: emailResult.provider,
        recipient: recipientEmail,
      });
    }

    // Process all active workspaces
    const activeWorkspaces = await prisma.workspace.findMany({
      where: { digestEnabled: true },
      include: {
        users: {
          where: { role: "ADMIN" },
          select: { email: true },
        },
      },
    });

    const results = [];
    for (const ws of activeWorkspaces) {
      const recipient = ws.digestEmail || ws.users[0]?.email;
      if (!recipient) continue;

      // Optimistic concurrency lock: Claim workspace atomically
      const claim = await prisma.workspace.updateMany({
        where: {
          id: ws.id,
          digestEnabled: true,
          OR: [
            { digestLastSentAt: null },
            { digestLastSentAt: { lt: minCycleInterval } },
          ],
        },
        data: {
          digestLastSentAt: new Date(),
        },
      });

      if (claim.count === 0) {
        results.push({
          workspaceId: ws.id,
          recipient,
          sent: false,
          skipped: true,
          reason: "Digest already sent for this weekly period or claimed by concurrent execution.",
        });
        continue;
      }

      const { stats, digestHtml } = await generateDigestData(ws.id, ws.name);
      const emailResult = await sendEmail({
        to: recipient,
        subject: `Weekly LOOP Digest: ${stats.totalFeedback} new feedback items, ${stats.topRequestsCount} top requests`,
        html: digestHtml,
        requireRealDelivery: true,
      });

      if (!emailResult.success || emailResult.simulated) {
        // Revert timestamp since real delivery did not take place
        await prisma.workspace.update({
          where: { id: ws.id },
          data: { digestLastSentAt: ws.digestLastSentAt },
        });

        results.push({
          workspaceId: ws.id,
          recipient,
          sent: false,
          simulated: Boolean(emailResult.simulated),
          error: emailResult.error || "Email delivery failed or provider unconfigured.",
        });
        continue;
      }

      results.push({
        workspaceId: ws.id,
        recipient,
        sent: true,
        simulated: false,
        provider: emailResult.provider,
      });
    }

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      results,
    });
  } catch (error) {
    console.error("Digest generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate or deliver digest." },
      { status: 500 }
    );
  }
}
