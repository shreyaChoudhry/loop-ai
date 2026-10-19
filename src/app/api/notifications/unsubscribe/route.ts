import prisma from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/email";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  if (!email || !token) {
    return new Response(
      `<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Invalid unsubscribe link</h2><p>Missing required parameters.</p></body></html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const isValid = verifyUnsubscribeToken(email, token);
  if (!isValid) {
    return new Response(
      `<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Security Error</h2><p>Invalid or expired unsubscribe token.</p></body></html>`,
      { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const cleanEmail = email.toLowerCase().trim();

  // Turn off notification preferences for all votes and requests by this email
  await Promise.all([
    prisma.vote.updateMany({
      where: { voterEmail: cleanEmail },
      data: { notifyOnUpdate: false },
    }),
    prisma.request.updateMany({
      where: { authorEmail: cleanEmail },
      data: { notifyOnUpdate: false },
    }),
  ]);

  return new Response(
    `<html>
      <head>
        <title>Unsubscribed — LOOP</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #f9fafb; color: #111827;">
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; max-width: 440px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="width: 48px; height: 48px; background-color: #ede9fe; color: #6655e8; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">
            ✓
          </div>
          <h2 style="margin: 0 0 12px; font-size: 20px;">You are unsubscribed</h2>
          <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0 0 24px;">
            You will no longer receive status notifications for feature requests at <strong>${cleanEmail}</strong>.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">You can still vote or submit feedback on public portals at any time.</p>
        </div>
      </body>
    </html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}
