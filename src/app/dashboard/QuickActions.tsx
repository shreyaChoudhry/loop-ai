import Link from "next/link";

export default function QuickActions() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>

        <p className="text-sm text-gray-500">
          Quickly access common tasks
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/inbox"
          className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
        >
          View Inbox
        </Link>

        <Link
          href="/dashboard/reports"
          className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
        >
          Generate Report
        </Link>

        <Link
          href="/dashboard/themes"
          className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
        >
          View Themes
        </Link>

        <Link
          href="/dashboard/ask-loop"
          className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
        >
          Ask LOOP
        </Link>
      </div>
    </div>
  );
}