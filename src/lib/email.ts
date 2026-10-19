import prisma from "@/lib/prisma";
import crypto from "crypto";

export type EmailDeliveryResult = {
  success: boolean;
  sentCount: number;
  skippedCount: number;
  simulated: boolean;
  provider: "resend" | "smtp" | "simulated";
  message?: string;
};

/**
 * Clean status string for humans
 */
export function formatPublicStatus(status: string): string {
  switch (status) {
    case "UNDER_REVIEW":
      return "Under Review";
    case "PLANNED":
      return "Planned";
    case "IN_PROGRESS":
      return "In Progress";
    case "SHIPPED":
      return "Shipped 🎉";
    case "NOT_PLANNED":
      return "Not Planned";
    default:
      return status;
  }
}

/**
 * Generate a secure unsubscribe token for an email and request
 */
export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "loop-secret-key";
  return crypto.createHmac("sha256", secret).update(email.toLowerCase().trim()).digest("hex");
}

/**
 * Verify an unsubscribe token
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!token || typeof token !== "string") return false;
  try {
    const expected = generateUnsubscribeToken(email);
    const bufExpected = Buffer.from(expected);
    const bufToken = Buffer.from(token);
    if (bufExpected.length !== bufToken.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufExpected, bufToken);
  } catch {
    return false;
  }
}

/**
 * Send an email using configured provider or safe simulation
 */
export async function sendEmail({
  to,
  subject,
  html,
  requireRealDelivery = false,
}: {
  to: string;
  subject: string;
  html: string;
  requireRealDelivery?: boolean;
}): Promise<{
  success: boolean;
  simulated: boolean;
  provider: "resend" | "simulated";
  error?: string;
}> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "LOOP Updates <notifications@loop-feedback.com>";

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Resend delivery failed:", errorText);
        return {
          success: false,
          simulated: false,
          provider: "resend",
          error: `Resend error (${response.status}): ${errorText}`,
        };
      }

      return { success: true, simulated: false, provider: "resend" };
    } catch (err) {
      console.error("Email send exception:", err);
      return {
        success: false,
        simulated: false,
        provider: "resend",
        error: err instanceof Error ? err.message : "Network error contacting email provider",
      };
    }
  }

  if (requireRealDelivery) {
    return {
      success: false,
      simulated: false,
      provider: "simulated",
      error:
        "RESEND_API_KEY environment variable is not configured. Real email delivery requires a valid Resend API key.",
    };
  }

  // Safe simulated mode: logs delivery without throwing errors or breaking user flow
  console.log(`[LOOP Email Simulation] To: ${to} | Subject: "${subject}"`);
  return { success: true, simulated: true, provider: "simulated" };
}

/**
 * Notify all subscribed voters and submitters when a feature request status changes
 */
export async function notifySubscribersForRequest(
  requestId: string,
  newStatus: "UNDER_REVIEW" | "PLANNED" | "IN_PROGRESS" | "SHIPPED" | "NOT_PLANNED",
  oldStatus?: string | null
): Promise<EmailDeliveryResult> {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          portalName: true,
        },
      },
      votes: {
        where: {
          notifyOnUpdate: true,
          voterEmail: { not: null },
        },
        select: {
          voterEmail: true,
        },
      },
    },
  });

  if (!request) {
    return {
      success: false,
      sentCount: 0,
      skippedCount: 0,
      simulated: false,
      provider: "simulated",
      message: "Request not found",
    };
  }

  // Also query child requests merged into this canonical request
  const childDuplicates = await prisma.request.findMany({
    where: { canonicalRequestId: requestId },
    include: {
      votes: {
        where: {
          notifyOnUpdate: true,
          voterEmail: { not: null },
        },
        select: {
          voterEmail: true,
        },
      },
    },
  });

  // Collect unique, normalized recipient emails
  const emailSet = new Set<string>();

  // 1. Author email if opted in
  if (request.authorEmail && request.notifyOnUpdate) {
    const clean = request.authorEmail.toLowerCase().trim();
    if (clean.includes("@")) {
      emailSet.add(clean);
    }
  }

  // 2. Primary request voter emails who opted in
  for (const vote of request.votes) {
    if (vote.voterEmail) {
      const clean = vote.voterEmail.toLowerCase().trim();
      if (clean.includes("@")) {
        emailSet.add(clean);
      }
    }
  }

  // 3. Merged duplicate request authors and voters who opted in
  for (const dup of childDuplicates) {
    if (dup.authorEmail && dup.notifyOnUpdate) {
      const clean = dup.authorEmail.toLowerCase().trim();
      if (clean.includes("@")) {
        emailSet.add(clean);
      }
    }
    for (const vote of dup.votes) {
      if (vote.voterEmail) {
        const clean = vote.voterEmail.toLowerCase().trim();
        if (clean.includes("@")) {
          emailSet.add(clean);
        }
      }
    }
  }

  const recipients = Array.from(emailSet);
  if (recipients.length === 0) {
    return {
      success: true,
      sentCount: 0,
      skippedCount: 0,
      simulated: true,
      provider: "simulated",
      message: "No subscribed recipients found.",
    };
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://loop-ai-wu6n.vercel.app";
  const portalUrl = request.workspace.slug
    ? `${baseUrl}/portal/${request.workspace.slug}`
    : `${baseUrl}/portal`;
  const formattedStatus = formatPublicStatus(newStatus);
  const portalDisplayName = request.workspace.portalName || request.workspace.name;

  let sentCount = 0;
  let skippedCount = 0;
  let simulatedAny = false;

  for (const recipient of recipients) {
    // Check if notification was already delivered to this recipient for this status
    const existing = await prisma.notificationRecord.findUnique({
      where: {
        requestId_recipient_status: {
          requestId: request.id,
          recipient,
          status: newStatus,
        },
      },
    });

    // Only skip if already delivered or simulated; allow retrying failed deliveries
    if (existing && existing.deliveryStatus !== "FAILED") {
      skippedCount++;
      continue;
    }

    const unsubToken = generateUnsubscribeToken(recipient);
    const unsubUrl = `${baseUrl}/api/notifications/unsubscribe?email=${encodeURIComponent(
      recipient
    )}&token=${unsubToken}`;

    const subject = `Update: "${request.title}" is now ${formattedStatus}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111827; background-color: #ffffff;">
        <div style="padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #6655e8; font-size: 20px;">${portalDisplayName}</h2>
        </div>
        <p style="font-size: 16px; line-height: 24px;">Hi there,</p>
        <p style="font-size: 16px; line-height: 24px;">
          A feature request you supported has just been updated:
        </p>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="margin: 0 0 8px 0; font-size: 17px; color: #111827;">${request.title}</h3>
          <p style="margin: 0; font-size: 14px; color: #4b5563;">Status changed${oldStatus ? ` from ${formatPublicStatus(oldStatus)}` : ""} to: <strong style="color: #6655e8;">${formattedStatus}</strong></p>
          ${
            request.releaseNote && newStatus === "SHIPPED"
              ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #374151;"><strong>Release note:</strong> ${request.releaseNote}</div>`
              : ""
          }
        </div>
        <div style="margin: 28px 0;">
          <a href="${portalUrl}" style="background-color: #6655e8; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">
            View Public Roadmap
          </a>
        </div>
        <p style="font-size: 14px; color: #6b7280; line-height: 20px;">
          Thank you for helping improve the product with your feedback!
        </p>
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
          You received this because you voted or requested this feature.
          <a href="${unsubUrl}" style="color: #6b7280; text-decoration: underline; margin-left: 6px;">Unsubscribe</a>
        </div>
      </div>
    `;

    const result = await sendEmail({ to: recipient, subject, html });

    const deliveryStatus = result.simulated ? "SIMULATED" : result.success ? "SENT" : "FAILED";

    await prisma.notificationRecord.upsert({
      where: {
        requestId_recipient_status: {
          requestId: request.id,
          recipient,
          status: newStatus,
        },
      },
      create: {
        requestId: request.id,
        recipient,
        status: newStatus,
        deliveryStatus,
        sentAt: new Date(),
      },
      update: {
        deliveryStatus,
        sentAt: new Date(),
      },
    });

    if (result.success) {
      sentCount++;
      if (result.simulated) simulatedAny = true;
    }
  }

  return {
    success: true,
    sentCount,
    skippedCount,
    simulated: simulatedAny,
    provider: process.env.RESEND_API_KEY ? "resend" : "simulated",
  };
}
