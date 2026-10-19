import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import prisma from "@/lib/prisma";
import { sendEmail, formatPublicStatus } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get("secret");
    const preview = searchParams.get("preview") === "true";
    const targetWorkspaceId = searchParams.get("workspaceId");

    const session = await getServerSession(authOptions);
    const isAuthorizedCron =
      process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET;
    const isAuthorizedSession = Boolean(session?.user?.workspaceId);

    if (!isAuthorizedCron && !isAuthorizedSession) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const workspaceId =
      targetWorkspaceId || session?.user?.workspaceId;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required." },
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

    if (!preview && !workspace.digestEnabled) {
      return NextResponse.json({
        success: true,
        message: "Digest is disabled for this workspace.",
        sent: false,
      });
    }

    const recipientEmail =
      workspace.digestEmail || workspace.users[0]?.email;

    if (!recipientEmail) {
      return NextResponse.json({
        error: "No recipient email configured for digest.",
      }, { status: 400 });
    }

    // 7-day reporting period
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // 1. Feedback in last 7 days
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
          <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">${workspace.name} &bull; ${periodString}</p>
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
                        <span style="display: inline-block; margin-left: 8px; font-size: 11px; padding: 2px 6px; background: #f3f4f6; color: #4b5563; border-radius: 4px;">${formatPublicStatus(r.status)}</span>
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
                ${s.releaseNote ? `<div style="font-size: 13px; color: #166534; margin-top: 2px;">${s.releaseNote}</div>` : ""}
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

    if (preview) {
      return NextResponse.json({
        success: true,
        preview: true,
        recipient: recipientEmail,
        period: periodString,
        stats: {
          totalFeedback,
          positiveFeedback,
          negativeFeedback,
          topRequestsCount: topRequests.length,
          shippedCount: shippedRecently.length,
        },
        html: digestHtml,
      });
    }

    // Send digest
    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: `Weekly LOOP Digest: ${totalFeedback} new feedback items, ${topRequests.length} top requests`,
      html: digestHtml,
    });

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { digestLastSentAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      sent: true,
      recipient: recipientEmail,
      simulated: emailResult.simulated,
    });
  } catch (error) {
    console.error("Digest generation error:", error);
    return NextResponse.json({ error: "Failed to generate digest." }, { status: 500 });
  }
}
