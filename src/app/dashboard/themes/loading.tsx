export default function Loading() {
  return (
    <main className="space-y-6">
      <div>
        <div className="h-7 w-32 animate-pulse rounded bg-zinc-200" />

        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-100" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl border border-zinc-200 bg-white"
          />
        ))}
      </div>

      <div className="h-96 animate-pulse rounded-xl border border-zinc-200 bg-white" />

      <div className="h-[480px] animate-pulse rounded-xl border border-zinc-200 bg-white" />
    </main>
  );
}