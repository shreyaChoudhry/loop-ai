"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ThemeImpactChartProps = {
  data: {
    name: string;
    mentions: number;
    negative: number;
    negativeRate: number;
  }[];
};

export default function ThemeImpactChart({
  data,
}: ThemeImpactChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Theme Impact
        </h2>

        <p className="text-sm text-gray-500">
          Most discussed themes and their negative feedback rate
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
          No theme data available
        </div>
      ) : (
        <>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{
                  left: 20,
                  right: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                />

                <Tooltip />

                <Bar
                  dataKey="mentions"
                  fill="#7c3aed"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 font-medium text-gray-500">
                    Theme
                  </th>

                  <th className="pb-3 font-medium text-gray-500">
                    Mentions
                  </th>

                  <th className="pb-3 font-medium text-gray-500">
                    Negative
                  </th>

                  <th className="pb-3 font-medium text-gray-500">
                    Negative Rate
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.map((theme) => (
                  <tr
                    key={theme.name}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="py-3 font-medium text-gray-800">
                      {theme.name}
                    </td>

                    <td className="py-3 text-gray-600">
                      {theme.mentions}
                    </td>

                    <td className="py-3 text-gray-600">
                      {theme.negative}
                    </td>

                    <td className="py-3 font-medium text-gray-800">
                      {theme.negativeRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}