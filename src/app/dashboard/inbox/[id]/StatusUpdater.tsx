"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/feedback/${feedbackId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to update status.";

        try {
          const data = await response.json();

          if (data?.message) {
            errorMessage = data.message;
          }
        } catch {
          // Ignore JSON parsing error
        }

        setMessage(errorMessage);
        return;
      }

      // Update the UI immediately
      setStatus(newStatus);
      setMessage("Status updated successfully.");

      // Refresh server-side data
      router.refresh();
    } catch (error) {
      console.error("Status update error:", error);

      setMessage(
        "Something went wrong while updating status."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!canUpdate) {
    return (
      <div className="mt-3">
        <span
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            status === "NEW"
              ? "bg-blue-100 text-blue-700"
              : status === "REVIEWED"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {status.charAt(0) +
            status.slice(1).toLowerCase()}
        </span>

        <p className="mt-2 text-xs text-gray-500">
          You have read-only access.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <select
        value={status}
        disabled={loading}
        onChange={(event) =>
          updateStatus(event.target.value)
        }
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-gray-100"
      >
        <option value="NEW">New</option>
        <option value="REVIEWED">Reviewed</option>
        <option value="RESOLVED">Resolved</option>
      </select>

      {loading && (
        <p className="text-xs text-gray-500">
          Updating status...
        </p>
      )}

      {message && (
        <p
          className={`text-xs ${
            message === "Status updated successfully."
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}