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
    { name: "Positive", value: positive },
    { name: "Neutral", value: neutral },
    { name: "Negative", value: negative },
  ];

  const total = positive + neutral + negative;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Customer Sentiment Distribution
          </h2>
          <p className="text-xs text-slate-400">
            Real-time classification powered by Claude & heuristics
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {total} Samples
        </span>
      </div>

      <div className="h-64 w-full">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No sentiment data recorded yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >
                <Cell fill="#10B981" />
                <Cell fill="#94A3B8" />
                <Cell fill="#F43F5E" />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B1026",
                  borderColor: "rgba(139, 44, 252, 0.3)",
                  borderRadius: "12px",
                  color: "#FFFFFF",
                  fontSize: "12px",
                }}
                formatter={(val, name) => [`${val} items`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center border-t border-slate-100 pt-4">
        <div className="rounded-xl bg-emerald-50/60 p-2.5 border border-emerald-100">
          <p className="text-xs font-bold text-emerald-700">Positive</p>
          <p className="mt-1 text-lg font-black text-slate-900">
            {total > 0 ? Math.round((positive / total) * 100) : 0}%
          </p>
          <p className="text-[10px] text-slate-500 font-mono">{positive} items</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200">
          <p className="text-xs font-bold text-slate-600">Neutral</p>
          <p className="mt-1 text-lg font-black text-slate-900">
            {total > 0 ? Math.round((neutral / total) * 100) : 0}%
          </p>
          <p className="text-[10px] text-slate-500 font-mono">{neutral} items</p>
        </div>

        <div className="rounded-xl bg-rose-50/60 p-2.5 border border-rose-100">
          <p className="text-xs font-bold text-rose-700">Negative</p>
          <p className="mt-1 text-lg font-black text-slate-900">
            {total > 0 ? Math.round((negative / total) * 100) : 0}%
          </p>
          <p className="text-[10px] text-slate-500 font-mono">{negative} items</p>
        </div>
      </div>
    </div>
  );
}