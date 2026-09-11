export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-gray-200" />

        <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-lg bg-gray-200" />
      </div>

      {/* Filter Skeleton */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />

          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="h-10 w-44 animate-pulse rounded-lg bg-gray-200" />
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />

            <div className="mt-3 h-9 w-20 animate-pulse rounded bg-gray-200" />

            <div className="mt-3 h-3 w-36 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Chart Skeletons */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-gray-200 bg-white p-6"
          >
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />

            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />

            <div className="mt-6 h-64 animate-pulse rounded-lg bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Theme Skeleton */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />

        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-200" />

        <div className="mt-6 h-72 animate-pulse rounded-lg bg-gray-100" />
      </div>
    </main>
  );
}