type TopThemesProps = {
  themes: {
    name: string;
    count: number;
  }[];
};

export default function TopThemes({
  themes,
}: TopThemesProps) {
  const maxCount = Math.max(
    ...themes.map((theme) => theme.count),
    1
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Trending Themes
        </h2>

        <p className="text-sm text-gray-500">
          Most discussed topics in customer feedback
        </p>
      </div>

      {themes.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-500">
          No themes available
        </div>
      ) : (
        <div className="space-y-5">
          {themes.map((theme) => {
            const percentage =
              theme.count === 0
                ? 0
                : Math.max(
                    Math.round(
                      (theme.count / maxCount) * 100
                    ),
                    8
                  );

            return (
              <div key={theme.name}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {theme.name}
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {theme.count}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-purple-600"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}