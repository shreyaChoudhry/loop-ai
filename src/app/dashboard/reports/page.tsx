"use client";

import { useEffect, useState } from "react";

type Report = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export default function ReportsPage() {
  const [reports, setReports] =
    useState<Report[]>([]);

  const [selectedReport, setSelectedReport] =
    useState<Report | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/reports"
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Failed to load reports."
        );
      }

      setReports(data.reports ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load reports."
      );
    } finally {
      setLoading(false);
    }
  }

  async function generateReport() {
    try {
      setGenerating(true);
      setError("");

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

      await loadReports();

      setSelectedReport(
        data.report
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate report."
      );
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Weekly Voice of Customer
            insights from your feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={generateReport}
          disabled={generating}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating
            ? "Generating..."
            : "Generate Report"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-1/3 rounded bg-gray-200" />
            <div className="h-16 rounded bg-gray-200" />
            <div className="h-16 rounded bg-gray-200" />
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Report History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Previously generated Voice of
                Customer reports.
              </p>
            </div>

            {reports.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-medium text-gray-700">
                  No reports yet.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Generate your first customer
                  insights report.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {reports.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        Generated{" "}
                        {new Date(
                          item.createdAt
                        ).toLocaleString()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedReport(
                          item
                        )
                      }
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {selectedReport && (
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedReport.title}
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Generated{" "}
                    {new Date(
                      selectedReport.createdAt
                    ).toLocaleString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedReport(null)
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
                >
                  Close
                </button>
              </div>

              <div className="p-6">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-gray-700">
                  {selectedReport.content}
                </pre>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}