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
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/reports", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load reports.");
      }

      const list = data.reports || [];
      setReports(list);
      if (list.length > 0 && !selectedReport) {
        setSelectedReport(list[0]);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function generateReport() {
    try {
      setGenerating(true);
      setError("");

      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate report.");
      }

      await loadReports();
      if (data.report) {
        setSelectedReport(data.report);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Voice of Customer Reports
            </h1>
            <span className="rounded-full bg-purple-100 border border-purple-200/80 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
              Executive AI Synthesis
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Synthesized weekly product intelligence reports generated from customer feedback and exportable to PDF.
          </p>
        </div>

        <button
          onClick={generateReport}
          disabled={generating}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-60"
        >
          {generating ? (
            <>
              <span className="animate-spin">↺</span>
              <span>Synthesizing VoC Report...</span>
            </>
          ) : (
            <>
              <span>+</span>
              <span>Generate New Report</span>
            </>
          )}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500">
          <span className="inline-block animate-spin mr-2">↺</span>
          Loading executive reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-2xl border border-purple-100">
            📊
          </div>
          <h2 className="text-base font-bold text-slate-900">No reports generated yet</h2>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500">
            Click below to generate your first Voice of Customer executive report analyzing recent feedback signals.
          </p>
          <button
            onClick={generateReport}
            disabled={generating}
            className="mt-5 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-700 transition"
          >
            {generating ? "Generating..." : "Generate First Report"}
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
          {/* REPORT HISTORY */}
          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden sticky top-20">
            <div className="border-b border-slate-100 px-4 py-3.5 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Report Archive
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600">
                {reports.length}
              </span>
            </div>

            <div className="max-h-[600px] overflow-y-auto p-2 space-y-1">
              {reports.map((report) => {
                const isSelected = selectedReport?.id === report.id;

                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`w-full rounded-xl p-3 text-left transition ${
                      isSelected
                        ? "bg-purple-50 border border-purple-200 shadow-sm"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <p className={`line-clamp-2 text-xs font-bold ${isSelected ? "text-purple-900" : "text-slate-800"}`}>
                      {report.title}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400 font-mono">
                      {new Date(report.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* REPORT DETAIL VIEW */}
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {!selectedReport ? (
              <div className="flex min-h-[450px] items-center justify-center p-8 text-center text-slate-400 text-xs">
                Select a report from the archive to view its contents.
              </div>
            ) : (
              <div>
                <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                      Voice of Customer Executive Report
                    </span>
                    <h2 className="mt-1 text-base font-bold text-slate-900">
                      {selectedReport.title}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Generated {new Date(selectedReport.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <a
                    href={`/api/reports/${selectedReport.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-black px-4 py-2 text-xs font-semibold text-white transition shadow-sm shrink-0"
                  >
                    <span>Export PDF</span>
                    <span>⤓</span>
                  </a>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-700 font-normal">
                    {selectedReport.content}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}