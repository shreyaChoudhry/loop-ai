"use client";

import { useState } from "react";

type Report = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export default function ReportsPage() {
  const [report, setReport] =
    useState<Report | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function generateReport() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/reports/generate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Failed to generate report."
        );
      }

      setReport(data.report);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate report."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Weekly Voice of Customer
            insights generated from
            your feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={generateReport}
          disabled={loading}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Generating..."
            : "Generate Report"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!report &&
        !loading &&
        !error && (
          <section className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              No report generated yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Generate a weekly Voice of
              Customer report from your
              workspace feedback.
            </p>

            <button
              type="button"
              onClick={generateReport}
              className="mt-5 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Generate First Report
            </button>
          </section>
        )}

      {loading && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-2/5 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-4/5 rounded bg-gray-200" />
            <div className="h-32 w-full rounded bg-gray-200" />
          </div>
        </section>
      )}

      {report && !loading && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {report.title}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Generated{" "}
                {new Date(
                  report.createdAt
                ).toLocaleString()}
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              Voice of Customer
            </span>
          </div>

          <div className="p-6">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-gray-700">
              {report.content}
            </pre>
          </div>
        </section>
      )}
    </main>
  );
}