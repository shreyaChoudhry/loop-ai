export default function AIInsight() {
  return (
    <div className="rounded-xl border border-purple-200 bg-white p-6">
      {/* Header */}

      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-lg">
          ✨
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            AI Insight
          </h2>

          <p className="text-sm text-gray-500">
            Automated summary from customer feedback
          </p>
        </div>
      </div>

      {/* Insight */}

      <div className="rounded-lg bg-purple-50 p-4">
        <p className="text-sm leading-6 text-gray-700">
          Customer feedback shows strong interest in the product
          experience. Recent feedback suggests that improving the
          user interface and performance could have the biggest
          impact on customer satisfaction.
        </p>
      </div>

      {/* Action */}

      <div className="mt-5">
        <button
          type="button"
          className="text-sm font-medium text-purple-600 hover:text-purple-700"
        >
          View detailed insights →
        </button>
      </div>
    </div>
  );
}