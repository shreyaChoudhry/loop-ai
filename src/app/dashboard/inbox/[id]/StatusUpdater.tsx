"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StatusUpdaterProps = {
  feedbackId: string;
  currentStatus: string;
  canUpdate: boolean;
};

export default function StatusUpdater({
  feedbackId,
  currentStatus,
  canUpdate,
}: StatusUpdaterProps) {
  const router = useRouter();

  const [status, setStatus] =
    useState(currentStatus);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const updateStatus = async (
    newStatus: string
  ) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/feedback/${feedbackId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update status."
        );
      }

      setStatus(newStatus);

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update status."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (
    value: string
  ) => {
    return (
      value.charAt(0) +
      value.slice(1).toLowerCase()
    );
  };

  if (!canUpdate) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-500">
          Status
        </p>

        <p className="mt-1 text-sm font-medium text-gray-900">
          {formatStatus(status)}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <label className="block text-sm font-medium text-gray-700">
        Status
      </label>

      <select
        value={status}
        disabled={loading}
        onChange={(event) =>
          updateStatus(
            event.target.value
          )
        }
        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-gray-100"
      >
        <option value="NEW">
          New
        </option>

        <option value="REVIEWED">
          Reviewed
        </option>

        <option value="ACTIONED">
          Actioned
        </option>
      </select>

      {loading && (
        <p className="mt-2 text-xs text-gray-500">
          Updating status...
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}