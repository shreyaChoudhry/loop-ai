"use client";

import { useEffect, useState } from "react";

type Report = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] =
    useState<Report | null>(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/reports",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load reports."
        );
      }

      setReports(data.reports || []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to generate report."
        );
      }

      await loadReports();

      if (data.report) {
        setSelectedReport(
          data.report
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
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
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-indigo-600">
              Customer Intelligence
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Voice of Customer
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Executive reports generated from
              your customer feedback.
            </p>
          </div>

          <button
            onClick={generateReport}
            disabled={generating}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating
              ? "Generating..."
              : "+ Generate Report"}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 h-5 w-32 animate-pulse rounded bg-slate-200" />

              <div className="space-y-3">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-16 animate-pulse rounded-lg bg-slate-100"
                    />
                  )
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />

              <div className="mt-6 space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-4/6 animate-pulse rounded bg-slate-100" />
              </div>
            </div>

          </div>
        ) : reports.length === 0 ? (

          /* EMPTY STATE */
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl">
              📊
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              No reports yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Generate your first Voice of Customer
              report to turn feedback into
              actionable product insights.
            </p>

            <button
              onClick={generateReport}
              disabled={generating}
              className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {generating
                ? "Generating..."
                : "Generate First Report"}
            </button>
          </div>

        ) : (

          /* REPORT WORKSPACE */
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">

            {/* REPORT HISTORY */}
            <aside className="h-fit rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-4 py-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  Report History
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {reports.length}{" "}
                  {reports.length === 1
                    ? "report"
                    : "reports"}
                </p>
              </div>

              <div className="max-h-[650px] overflow-y-auto p-2">
                {reports.map(
                  (report) => {
                    const isSelected =
                      selectedReport?.id ===
                      report.id;

                    return (
                      <button
                        key={report.id}
                        onClick={() =>
                          setSelectedReport(
                            report
                          )
                        }
                        className={`mb-1 w-full rounded-lg p-3 text-left transition ${
                          isSelected
                            ? "bg-indigo-50 ring-1 ring-indigo-200"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <p className="line-clamp-2 text-sm font-medium text-slate-900">
                          {report.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(
                            report.createdAt
                          ).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </aside>

            {/* REPORT CONTENT */}
            <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm">

              {!selectedReport ? (
                <div className="flex min-h-[500px] items-center justify-center p-8 text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      📄
                    </div>

                    <h2 className="font-semibold text-slate-900">
                      Select a report
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Choose a report from history
                      to view its insights.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* REPORT TOOLBAR */}
                  <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
                        Voice of Customer
                      </p>

                      <h2 className="mt-1 text-lg font-bold text-slate-900">
                        {selectedReport.title}
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Generated{" "}
                        {new Date(
                          selectedReport.createdAt
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">

                      <a
                        href={`/api/reports/${selectedReport.id}/pdf`}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Export PDF
                      </a>

                      <button
                        onClick={() =>
                          setSelectedReport(
                            null
                          )
                        }
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Close
                      </button>

                    </div>
                  </div>

                  {/* REPORT BODY */}
                  <div className="p-5 sm:p-8">

                    <div className="mx-auto max-w-4xl">

                      <div className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                          Weekly Customer Insights
                        </p>

                        <h3 className="mt-2 text-2xl font-bold text-slate-900">
                          {selectedReport.title}
                        </h3>
                      </div>

                      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {selectedReport.content}
                      </div>

                    </div>

                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}