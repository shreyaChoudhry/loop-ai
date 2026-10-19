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

function formatDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);
  return parsedDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

export default function FeedbackChart({ data }: FeedbackChartProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Feedback Velocity Over Time
          </h2>
          <p className="text-xs text-slate-400">
            Incoming customer signals across the last 7 days
          </p>
        </div>
        <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
          Daily Ingestion
        </span>
      </div>

      <div className="h-64 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No feedback data recorded yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748B" }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748B" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B1026",
                  borderColor: "rgba(139, 44, 252, 0.3)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
                }}
                labelStyle={{ color: "#E2E8F0", fontWeight: "bold" }}
                labelFormatter={(label) => formatDate(String(label))}
                formatter={(value) => [`${value} items`, "Feedback"]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8B2CFC"
                strokeWidth={3}
                dot={{ r: 4, fill: "#8B2CFC", strokeWidth: 2, stroke: "#FFFFFF" }}
                activeDot={{ r: 6, fill: "#D946EF", stroke: "#FFFFFF", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}