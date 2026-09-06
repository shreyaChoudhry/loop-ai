import prisma from "@/lib/prisma";
import InboxTable from "./InboxTable";

export default async function InboxPage() {
  // --------------------------------
  // Fetch all feedback
  // --------------------------------

  const feedback = await prisma.feedback.findMany({
    select: {
      id: true,
      content: true,
      source: true,
      sentiment: true,
      status: true,
      category: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // --------------------------------
  // Fetch feedback-theme relations
  // --------------------------------

  const feedbackThemeRelations =
    await prisma.feedbackTheme.findMany({
      select: {
        feedbackId: true,
        themeId: true,
      },
    });

  // --------------------------------
  // Fetch all themes
  // --------------------------------

  const themes = await prisma.theme.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // --------------------------------
  // Format feedback with themes
  // --------------------------------

  const formattedFeedback = feedback.map((item) => {
    const relatedThemeIds =
      feedbackThemeRelations
        .filter(
          (relation) =>
            relation.feedbackId === item.id
        )
        .map(
          (relation) => relation.themeId
        );

    const itemThemes = themes
      .filter((theme) =>
        relatedThemeIds.includes(theme.id)
      )
      .map((theme) => ({
        id: theme.id,
        name: theme.name,
      }));

    return {
      id: item.id,
      content: item.content,
      source: item.source,
      sentiment: item.sentiment,
      status: item.status,
      category: item.category,
      createdAt: item.createdAt,
      themes: itemThemes,
    };
  });

  // --------------------------------
  // Inbox UI
  // --------------------------------

  return (
    <main className="space-y-6">
      {/* Page Header */}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Feedback Inbox
        </h1>

        <p className="mt-2 text-gray-500">
          View, filter and manage all customer feedback.
        </p>
      </div>

      {/* Actions */}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Upload CSV
        </button>

        <button
          type="button"
          className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-purple-700"
        >
          Import
        </button>
      </div>

      {/* Search + Filters + Table */}

      <InboxTable
        feedback={formattedFeedback}
        themes={themes}
      />
    </main>
  );
}