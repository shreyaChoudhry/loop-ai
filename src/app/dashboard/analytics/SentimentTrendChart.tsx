"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SentimentTrendChartProps = {
  data: {
    date: string;
    positive: number;
    neutral: number;
    negative: number;
  }[];
};

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    }
  );
}

export default function SentimentTrendChart({
  data,
}: SentimentTrendChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Sentiment Trend
        </h2>

        <p className="text-sm text-gray-500">
          Positive, neutral, and negative feedback over time
        </p>
      </div>

      <div className="mb-4 flex gap-5 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          Positive
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
          Neutral
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          Negative
        </div>
      </div>

      <div className="h-64 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            No sentiment data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip
                labelFormatter={(label) =>
                  formatDate(String(label))
                }
              />

              <Line
                type="monotone"
                dataKey="positive"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={false}
              />

              <Line
                type="monotone"
                dataKey="neutral"
                stroke="#94a3b8"
                strokeWidth={2.5}
                dot={false}
              />

              <Line
                type="monotone"
                dataKey="negative"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}