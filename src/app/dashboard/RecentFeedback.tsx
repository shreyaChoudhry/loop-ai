type RecentFeedbackProps = {
  feedback: {
    id: string;
    content: string;
    source: string;
    sentiment: string | null;
    status: string;
    createdAt: Date;
  }[];
};

export default function RecentFeedback({
  feedback,
}: RecentFeedbackProps) {
  const formatSource = (source: string) => {
    return source.charAt(0) + source.slice(1).toLowerCase();
  };

  const formatStatus = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const formatSentiment = (sentiment: string | null) => {
    if (!sentiment) {
      return "Unknown";
    }

    return sentiment.charAt(0) + sentiment.slice(1).toLowerCase();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Feedback
        </h2>

        <p className="text-sm text-gray-500">
          Latest customer feedback received
        </p>
      </div>

      {feedback.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-500">
          No feedback available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 pr-4 text-sm font-semibold text-gray-600">
                  Feedback
                </th>

                <th className="pb-3 pr-4 text-sm font-semibold text-gray-600">
                  Source
                </th>

                <th className="pb-3 pr-4 text-sm font-semibold text-gray-600">
                  Sentiment
                </th>

                <th className="pb-3 pr-4 text-sm font-semibold text-gray-600">
                  Status
                </th>

                <th className="pb-3 text-sm font-semibold text-gray-600">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {feedback.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="max-w-md py-4 pr-4">
                    <p className="truncate text-sm text-gray-800">
                      {item.content}
                    </p>
                  </td>

                  <td className="whitespace-nowrap py-4 pr-4 text-sm text-gray-600">
                    {formatSource(item.source)}
                  </td>

                  <td className="whitespace-nowrap py-4 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.sentiment === "POSITIVE"
                          ? "bg-green-100 text-green-700"
                          : item.sentiment === "NEGATIVE"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {formatSentiment(item.sentiment)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap py-4 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.status === "NEW"
                          ? "bg-blue-100 text-blue-700"
                          : item.status === "REVIEWED"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {formatStatus(item.status)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap py-4 text-sm text-gray-500">
                    {formatDate(item.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}