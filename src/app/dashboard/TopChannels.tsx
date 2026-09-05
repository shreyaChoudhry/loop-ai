type TopChannelsProps = {
  channels: {
    name: string;
    count: number;
  }[];
};

export default function TopChannels({
  channels,
}: TopChannelsProps) {
  const maxCount = Math.max(
    ...channels.map((channel) => channel.count),
    1
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Top Channels
        </h2>

        <p className="text-sm text-gray-500">
          Feedback received from different channels
        </p>
      </div>

      <div className="space-y-5">
        {channels.map((channel) => {
          const percentage =
            channel.count === 0
              ? 0
              : Math.max(
                  Math.round((channel.count / maxCount) * 100),
                  8
                );

          return (
            <div key={channel.name}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {channel.name}
                </span>

                <span className="text-sm font-semibold text-gray-900">
                  {channel.count}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-purple-600"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}