"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type FeedbackChartProps = {
  data: {
    date: string;
    count: number;
  }[];
};

export default function FeedbackChart({ data }: FeedbackChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Feedback Over Time
        </h2>

        <p className="text-sm text-gray-500">
          Number of feedback records received
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="date" />

            <YAxis allowDecimals={false} />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="count"
              stroke="#7c3aed"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}