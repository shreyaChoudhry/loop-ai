"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteFeedbackButtonProps = {
  feedbackId: string;
};

export default function DeleteFeedbackButton({
  feedbackId,
}: DeleteFeedbackButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const deleteFeedback = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this feedback?"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/feedback/${feedbackId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        let message = "Failed to delete feedback.";

        try {
          const data = await response.json();

          if (data?.message) {
            message = data.message;
          }
        } catch {
          // Ignore JSON parsing errors
        }

        setError(message);
        return;
      }

      router.push("/dashboard/inbox");
      router.refresh();
    } catch (error) {
      console.error(
        "Delete feedback error:",
        error
      );

      setError(
        "Something went wrong while deleting feedback."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={deleteFeedback}
        disabled={loading}
        className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Deleting..." : "Delete Feedback"}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}