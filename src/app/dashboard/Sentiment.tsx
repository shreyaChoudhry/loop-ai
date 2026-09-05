"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type SentimentProps = {
  positive: number;
  neutral: number;
  negative: number;
};

export default function Sentiment({
  positive,
  neutral,
  negative,
}: SentimentProps) {
  const data = [
    {
      name: "Positive",
      value: positive,
    },
    {
      name: "Neutral",
      value: neutral,
    },
    {
      name: "Negative",
      value: negative,
    },
  ];

  const total = positive + neutral + negative;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Sentiment Distribution
        </h2>

        <p className="text-sm text-gray-500">
          Overall sentiment of customer feedback
        </p>
      </div>

      <div className="h-72 w-full">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            No sentiment data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                <Cell fill="#22c55e" />
                <Cell fill="#94a3b8" />
                <Cell fill="#ef4444" />
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm font-medium text-green-600">
            Positive
          </p>

          <p className="mt-1 text-xl font-bold text-gray-900">
            {total > 0
              ? Math.round((positive / total) * 100)
              : 0}
            %
          </p>

          <p className="text-xs text-gray-500">
            {positive} feedback
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">
            Neutral
          </p>

          <p className="mt-1 text-xl font-bold text-gray-900">
            {total > 0
              ? Math.round((neutral / total) * 100)
              : 0}
            %
          </p>

          <p className="text-xs text-gray-500">
            {neutral} feedback
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-red-600">
            Negative
          </p>

          <p className="mt-1 text-xl font-bold text-gray-900">
            {total > 0
              ? Math.round((negative / total) * 100)
              : 0}
            %
          </p>

          <p className="text-xs text-gray-500">
            {negative} feedback
          </p>
        </div>
      </div>
    </div>
  );
}