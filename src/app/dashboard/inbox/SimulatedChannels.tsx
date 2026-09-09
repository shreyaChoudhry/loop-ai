"use client";

import { useState } from "react";

type ChannelKey =
  | "APP_REVIEWS"
  | "SUPPORT_TICKETS"
  | "SURVEY_RESPONSES"
  | "SALES_NOTES";

const CHANNELS: Array<{
  key: ChannelKey;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    key: "APP_REVIEWS",
    title: "App Reviews",
    description:
      "Import sample mobile app reviews.",
    icon: "📱",
  },

  {
    key: "SUPPORT_TICKETS",
    title: "Support Tickets",
    description:
      "Import sample customer support tickets.",
    icon: "🎧",
  },

  {
    key: "SURVEY_RESPONSES",
    title: "Survey Responses",
    description:
      "Import sample survey feedback.",
    icon: "📋",
  },

  {
    key: "SALES_NOTES",
    title: "Sales Notes",
    description:
      "Import sample notes from sales teams.",
    icon: "💼",
  },
];

export default function SimulatedChannels() {
  const [loadingChannel, setLoadingChannel] =
    useState<ChannelKey | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const importChannel = async (
    channel: ChannelKey
  ) => {
    try {
      setLoadingChannel(channel);
      setMessage("");
      setError("");

      const response =
        await fetch(
          "/api/feedback/simulate",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              channel,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to import sample feedback."
        );
      }

      setMessage(
        data.message ||
          "Feedback imported successfully."
      );

      // Refresh server-rendered
      // Inbox data.
      window.location.reload();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to import sample feedback."
      );
    } finally {
      setLoadingChannel(null);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      {/* Header */}

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Import Sample Feedback
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Simulate feedback coming from
          different customer channels.
        </p>
      </div>

      {/* Channel buttons */}

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {CHANNELS.map(
          (channel) => {
            const isLoading =
              loadingChannel ===
              channel.key;

            return (
              <button
                key={channel.key}
                type="button"
                disabled={
                  loadingChannel !==
                  null
                }
                onClick={() =>
                  importChannel(
                    channel.key
                  )
                }
                className="group rounded-xl border border-zinc-200 bg-white p-4 text-left transition hover:border-purple-300 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-lg">
                    {
                      channel.icon
                    }
                  </div>

                  {isLoading && (
                    <span className="text-xs font-medium text-purple-600">
                      Importing...
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-sm font-semibold text-zinc-900">
                  {channel.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  {
                    channel.description
                  }
                </p>
              </button>
            );
          }
        )}
      </div>

      {/* Success */}

      {message && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">
            {message}
          </p>
        </div>
      )}

      {/* Error */}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}