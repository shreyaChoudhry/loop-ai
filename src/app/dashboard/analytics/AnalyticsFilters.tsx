"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function AnalyticsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRange =
    searchParams.get("range") ?? "30";

  function handleRangeChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = event.target.value;

    const params = new URLSearchParams(
      searchParams.toString()
    );

    params.set("range", value);

    router.push(
      `/dashboard/analytics?${params.toString()}`
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700">
          Date Range
        </p>

        <p className="text-xs text-gray-500">
          Choose the period for your analytics
        </p>
      </div>

      <select
        value={currentRange}
        onChange={handleRangeChange}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
      >
        <option value="7">Last 7 Days</option>
        <option value="30">Last 30 Days</option>
        <option value="90">Last 90 Days</option>
        <option value="all">All Time</option>
      </select>
    </div>
  );
}