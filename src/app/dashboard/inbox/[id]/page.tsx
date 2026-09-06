import Link from "next/link";
import prisma from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect, notFound } from "next/navigation";

import StatusUpdater from "./StatusUpdater";
import DeleteFeedbackButton from "./DeleteFeedbackButton";

type FeedbackDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function FeedbackDetailPage({
  params,
}: FeedbackDetailPageProps) {
  // --------------------------------
  // Authentication
  // --------------------------------

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // --------------------------------
  // Fetch feedback
  // --------------------------------

  const feedback = await prisma.feedback.findUnique({
    where: {
      id: params.id,
    },
    select: {
      id: true,
      content: true,
      source: true,
      sentiment: true,
      status: true,
      category: true,
      sentimentScore: true,
      createdAt: true,
    },
  });

  // --------------------------------
  // Feedback not found
  // --------------------------------

  if (!feedback) {
    notFound();
  }

  // --------------------------------
  // Fetch themes
  // --------------------------------

  const feedbackThemes =
    await prisma.feedbackTheme.findMany({
      where: {
        feedbackId: feedback.id,
      },
      include: {
        theme: true,
      },
    });

  const themes = feedbackThemes.map(
    (item) => item.theme.name
  );

  // --------------------------------
  // Formatting helpers
  // --------------------------------

  const formatSource = (source: string) => {
    return (
      source.charAt(0) +
      source.slice(1).toLowerCase()
    );
  };

  const formatSentiment = (
    sentiment: string | null
  ) => {
    if (!sentiment) {
      return "Unknown";
    }

    return (
      sentiment.charAt(0) +
      sentiment.slice(1).toLowerCase()
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // --------------------------------
  // Detail Page UI
  // --------------------------------

  return (
    <main className="space-y-6">
      {/* Back to Inbox */}

      <div>
        <Link
          href="/dashboard/inbox"
          className="text-sm font-medium text-purple-600 hover:text-purple-700"
        >
          ← Back to Inbox
        </Link>
      </div>

      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Customer Feedback
        </h1>

        <p className="mt-2 text-gray-500">
          View and manage this feedback record.
        </p>
      </div>

      {/* Feedback Content */}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="mb-3 text-sm font-medium text-gray-500">
          Feedback
        </p>

        <p className="text-lg leading-8 text-gray-900">
          {feedback.content}
        </p>
      </div>

      {/* Feedback Information */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Sentiment */}

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Sentiment
          </p>

          <div className="mt-3">
            <span
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                feedback.sentiment === "POSITIVE"
                  ? "bg-green-100 text-green-700"
                  : feedback.sentiment === "NEGATIVE"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {formatSentiment(
                feedback.sentiment
              )}
            </span>
          </div>
        </div>

        {/* Source */}

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Source
          </p>

          <p className="mt-2 text-lg font-semibold text-gray-900">
            {formatSource(feedback.source)}
          </p>
        </div>

        {/* Category */}

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Category
          </p>

          <p className="mt-2 text-lg font-semibold text-gray-900">
            {feedback.category ?? "Not categorized"}
          </p>
        </div>

        {/* Status */}

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Status
          </p>

          <StatusUpdater
            feedbackId={feedback.id}
            currentStatus={feedback.status}
            canUpdate={
              session.user.role === "ADMIN" ||
              session.user.role === "ANALYST"
            }
          />
        </div>

        {/* Themes */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 md:col-span-2">
          <p className="text-sm text-gray-500">
            Themes
          </p>

          {themes.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              No themes assigned
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {themes.map((theme) => (
                <span
                  key={theme}
                  className="rounded-full bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700"
                >
                  {theme}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sentiment Score */}

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Sentiment Score
          </p>

          <p className="mt-2 text-lg font-semibold text-gray-900">
            {feedback.sentimentScore !== null
              ? feedback.sentimentScore
              : "Not available"}
          </p>
        </div>

        {/* Created */}

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Created
          </p>

          <p className="mt-2 text-lg font-semibold text-gray-900">
            {formatDate(feedback.createdAt)}
          </p>
        </div>
      </div>

      {/* Admin Actions */}

      {session.user.role === "ADMIN" && (
        <div className="rounded-xl border border-red-200 bg-white p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Admin Actions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Administrative actions for this feedback.
            </p>
          </div>

          <div className="mt-4">
            <DeleteFeedbackButton
              feedbackId={feedback.id}
            />
          </div>
        </div>
      )}

      {/* Feedback ID */}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">
          Feedback ID
        </p>

        <p className="mt-2 break-all font-mono text-sm text-gray-700">
          {feedback.id}
        </p>
      </div>
    </main>
  );
}