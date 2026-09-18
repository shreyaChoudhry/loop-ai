import anthropic from "@/lib/claude";

import {
  retrieveRelevantFeedback,
  type RetrievedFeedback,
} from "@/lib/search";

const model =
  process.env.ANTHROPIC_MODEL ??
  "claude-sonnet-5";

function createMockAnswer(
  question: string,
  citations: RetrievedFeedback[]
): string {
  if (citations.length === 0) {
    return "I couldn't find relevant feedback in your workspace to answer that question.";
  }

  const positive = citations.filter(
    (item) => item.sentiment === "POSITIVE"
  ).length;

  const negative = citations.filter(
    (item) => item.sentiment === "NEGATIVE"
  ).length;

  const neutral = citations.filter(
    (item) => item.sentiment === "NEUTRAL"
  ).length;

  const categories = citations
    .map((item) => item.category)
    .filter(
      (
        category
      ): category is string =>
        Boolean(category)
    );

  const uniqueCategories = Array.from(new Set(categories));

  const strongest =
    citations[0];

  return [
    `Based on the ${citations.length} most relevant feedback items, users are discussing ${uniqueCategories.length > 0 ? uniqueCategories.join(", ") : "several product areas"}.`,
    "",
    `For the question "${question}", the retrieved feedback contains ${negative} negative, ${positive} positive, and ${neutral} neutral responses.`,
    "",
    `The strongest matching feedback says: "${strongest.content}"`,
    "",
    "This answer is generated from the retrieved workspace feedback only.",
  ].join("\n");
}

export type AskLoopResult = {
  answer: string;
  citations: RetrievedFeedback[];
  usedMock: boolean;
};

export async function askLoop(
  question: string,
  workspaceId: string
): Promise<AskLoopResult> {
  const citations =
    await retrieveRelevantFeedback(
      question,
      workspaceId,
      5
    );

  if (citations.length === 0) {
    return {
      answer:
        "I couldn't find relevant feedback in your workspace to answer that question.",
      citations: [],
      usedMock: false,
    };
  }

  const useMock =
    process.env.USE_MOCK_AI === "true";

  if (useMock) {
    return {
      answer: createMockAnswer(
        question,
        citations
      ),
      citations,
      usedMock: true,
    };
  }

  const context = citations
    .map(
      (item, index) =>
        `[Feedback ${index + 1}]
ID: ${item.id}
Source: ${item.source}
Sentiment: ${item.sentiment}
Category: ${item.category ?? "Uncategorized"}
Rating: ${item.rating ?? "Not provided"}
Similarity: ${item.similarity.toFixed(3)}
Content: ${item.content}`
    )
    .join("\n\n");

  const message =
    await anthropic.messages.create({
      model,
      max_tokens: 700,

      system: `
You are Ask LOOP, a grounded customer-feedback assistant.

You MUST answer only from the feedback provided in the context.

Rules:
- Do not invent feedback.
- Do not use outside knowledge.
- Do not claim something unless the provided feedback supports it.
- If the feedback does not contain enough information, clearly say that.
- Summarize patterns when multiple feedback items support them.
- Keep the answer concise and useful.
- Mention specific feedback numbers when making claims.
`.trim(),

      messages: [
        {
          role: "user",
          content: `
Question:
${question}

Relevant feedback:

${context}

Answer the question using ONLY the feedback above.
When possible, refer to the supporting feedback as
[Feedback 1], [Feedback 2], etc.
          `.trim(),
        },
      ],
    });

  const textBlock =
    message.content.find(
      (block) => block.type === "text"
    );

  if (
    !textBlock ||
    textBlock.type !== "text"
  ) {
    throw new Error(
      "Claude did not return a text response."
    );
  }

  return {
    answer: textBlock.text,
    citations,
    usedMock: false,
  };
}