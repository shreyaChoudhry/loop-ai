"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ThemeTrendsChartProps = {
  data: Array<
    Record<string, string | number>
  >;

  themes: string[];
};

export default function ThemeTrendsChart({
  data,
  themes,
}: ThemeTrendsChartProps) {
  if (
    !data.length ||
    !themes.length
  ) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-zinc-500">
        No trend data available.
      </div>
    );
  }

  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: 0,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="date"
            tick={{
              fontSize: 11,
            }}
            minTickGap={25}
          />

          <YAxis
            allowDecimals={false}
            tick={{
              fontSize: 11,
            }}
          />

          <Tooltip />

          <Legend />

          {themes.map(
            (
              theme,
              index
            ) => (
              <Line
                key={theme}
                type="monotone"
                dataKey={theme}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 5,
                }}
              />
            )
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}