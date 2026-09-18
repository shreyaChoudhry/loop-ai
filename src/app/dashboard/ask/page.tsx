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
  const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [citations, setCitations] =
    useState<Citation[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!question.trim()) {
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");
    setCitations([]);

    try {
      const response = await fetch(
        "/api/insights/ask",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Something went wrong."
        );
      }

      setAnswer(data.answer);
      setCitations(
        data.citations ?? []
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to ask LOOP."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Ask LOOP
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Ask questions about your customer
          feedback.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <label
            htmlFor="question"
            className="block text-sm font-semibold text-gray-700"
          >
            Your question
          </label>

          <textarea
            id="question"
            value={question}
            onChange={(event) =>
              setQuestion(
                event.target.value
              )
            }
            placeholder="What are users saying about onboarding?"
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-900"
          />

          <button
            type="submit"
            disabled={
              loading ||
              !question.trim()
            }
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Thinking..."
              : "Ask LOOP"}
          </button>
        </form>
      </section>

      {error && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </section>
      )}

      {answer && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            LOOP&apos;s answer
          </h2>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">
            {answer}
          </p>
        </section>
      )}

      {citations.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Based on these feedback items
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              These are the feedback records
              retrieved before generating the
              answer.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {citations.map(
              (citation, index) => (
                <article
                  key={citation.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-gray-500">
                      Feedback {index + 1}
                    </span>

                    <span className="text-xs text-gray-400">
                      Similarity{" "}
                      {(
                        citation.similarity *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-gray-700">
                    {citation.content}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                      {citation.source}
                    </span>

                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                      {citation.sentiment}
                    </span>

                    {citation.category && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                        {citation.category}
                      </span>
                    )}

                    {citation.rating !==
                      null && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                        Rating:{" "}
                        {citation.rating}
                      </span>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        </section>
      )}

      {!loading &&
        !answer &&
        !error && (
          <section className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <p className="text-sm font-medium text-gray-600">
              Ask LOOP anything about your
              customer feedback.
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Example: “What are users
              complaining about most?”
            </p>
          </section>
        )}
    </main>
  );
}