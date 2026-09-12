import anthropic from "@/lib/claude";
import {
  feedbackClassificationSchema,
  type FeedbackClassification,
} from "@/lib/ai-schema";

const model =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

export async function classifyFeedback(
  feedbackText: string
): Promise<FeedbackClassification> {
  if (!feedbackText.trim()) {
    throw new Error(
      "Feedback text cannot be empty."
    );
  }

  const message = await anthropic.messages.create({
    model,
    max_tokens: 500,
    system: `
You are the feedback classification engine for LOOP.

Analyze the customer feedback and return ONLY valid JSON.

The JSON must have exactly these fields:

{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "sentimentScore": number,
  "themes": string[],
  "featureArea": string
}

Rules:
- sentiment must be exactly POSITIVE, NEUTRAL, or NEGATIVE.
- sentimentScore must be between -1 and 1.
- themes must contain at least one short, relevant theme.
- featureArea must be a short product area such as Dashboard, Authentication, Performance, Payments, Support, Mobile App, or UI/UX.
- Do not include markdown.
- Do not include explanations.
- Return JSON only.
    `.trim(),
    messages: [
      {
        role: "user",
        content: feedbackText,
      },
    ],
  });

  const textBlock = message.content.find(
    (block) => block.type === "text"
  );

  if (!textBlock || textBlock.type !== "text") {
    throw new Error(
      "Claude did not return a text response."
    );
  }

  let parsedResponse: unknown;

  try {
    parsedResponse = JSON.parse(
      textBlock.text
    );
  } catch {
    throw new Error(
      "Claude returned invalid JSON."
    );
  }

  const validation =
    feedbackClassificationSchema.safeParse(
      parsedResponse
    );

  if (!validation.success) {
    throw new Error(
      "Claude classification failed validation."
    );
  }

  return validation.data;
}