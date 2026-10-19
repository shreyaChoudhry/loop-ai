"use client";

import { FormEvent, useState } from "react";

type Citation = {
  id: string;
  content: string;
  source: string;
  sentiment: string;
  category: string | null;
  rating: number | null;
  similarity: number;
  createdAt: string;
};

export default function AskLoopPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const suggestedQuestions = [
    "What are users saying about our onboarding experience?",
    "Which missing integrations cause the highest churn risk?",
    "What is the general sentiment regarding pricing and billing?",
    "Summarize top customer feature requests from this month",
  ];

  async function handleSubmit(event?: FormEvent<HTMLFormElement>, queryText?: string) {
    if (event) event.preventDefault();

    const q = queryText || question;
    if (!q.trim()) return;

    if (queryText) setQuestion(queryText);

    setLoading(true);
    setError("");
    setAnswer("");
    setCitations([]);

    try {
      const response = await fetch("/api/insights/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to synthesize answer.");
      }

      setAnswer(data.answer);
      setCitations(data.citations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ask LOOP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Ask LOOP AI
          </h1>
          <span className="rounded-full bg-purple-100 border border-purple-200/80 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
            ✨ Vector Synthesis
          </span>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Query your raw feedback vectors using natural language to uncover trends, sentiment, and quotes.
        </p>
      </div>

      {/* INPUT CARD */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Ask any question about customer sentiment or feature needs
          </label>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What are enterprise customers saying about invoice reverse charges?"
            rows={3}
            className="w-full rounded-xl border border-slate-200 p-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-slate-400 font-mono">
              Powered by Claude 3.5 & Neon Vector Embeddings
            </span>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="animate-spin">↺</span>
                  <span>Synthesizing Signals...</span>
                </>
              ) : (
                <>
                  <span>Ask LOOP</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Suggested Queries */}
        <div className="border-t border-slate-100 pt-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Suggested Prompts
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((sq) => (
              <button
                key={sq}
                type="button"
                onClick={() => handleSubmit(undefined, sq)}
                className="rounded-lg bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 transition text-left"
              >
                &ldquo;{sq}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* ANSWER SECTION */}
      {answer && (
        <div className="rounded-2xl border border-purple-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs text-white">
              ✨
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              AI Synthesis & Executive Summary
            </h2>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-purple-50/30 p-4 rounded-xl border border-purple-100">
            {answer}
          </div>

          {/* CITATIONS */}
          {citations.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span>
                <span>Supporting Feedback Evidence ({citations.length})</span>
              </h3>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {citations.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="rounded bg-white px-1.5 py-0.5 font-semibold text-slate-600 border border-slate-200 uppercase">
                        {c.source}
                      </span>
                      <span className="font-mono text-purple-700 font-bold">
                        {Math.round(c.similarity * 100)}% match
                      </span>
                    </div>
                    <p className="text-slate-700 text-[11px] italic line-clamp-3">
                      &ldquo;{c.content}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}