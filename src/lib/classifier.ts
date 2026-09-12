import anthropic from "@/lib/claude";
import {
  feedbackClassificationSchema,
  type FeedbackClassification,
} from "@/lib/ai-schema";

const model =
  process.env.ANTHROPIC_MODEL ??
  "claude-sonnet-5";

function mockClassifyFeedback(
  feedbackText: string
): FeedbackClassification {
  const text =
    feedbackText.toLowerCase();

  let sentiment:
    | "POSITIVE"
    | "NEUTRAL"
    | "NEGATIVE" = "NEUTRAL";

  let sentimentScore = 0;

  if (
    text.includes("love") ||
    text.includes("great") ||
    text.includes("excellent") ||
    text.includes("amazing") ||
    text.includes("good") ||
    text.includes("smooth") ||
    text.includes("happy") ||
    text.includes("satisfied") ||
    text.includes("like")
  ) {
    sentiment = "POSITIVE";
    sentimentScore = 0.82;
  } else if (
    text.includes("bad") ||
    text.includes("slow") ||
    text.includes("crash") ||
    text.includes("crashes") ||
    text.includes("confusing") ||
    text.includes("cannot") ||
    text.includes("unable") ||
    text.includes("problem") ||
    text.includes("issue") ||
    text.includes("late") ||
    text.includes("frustrat")
  ) {
    sentiment = "NEGATIVE";
    sentimentScore = -0.82;
  } else {
    sentiment = "NEUTRAL";
    sentimentScore = 0;
  }

  let featureArea =
    "General";

  let themes = [
    "General Feedback",
  ];

  if (
    text.includes("dashboard") ||
    text.includes("report")
  ) {
    featureArea =
      "Dashboard";

    themes = [
      "Dashboard",
    ];
  } else if (
    text.includes("login") ||
    text.includes("password") ||
    text.includes("account")
  ) {
    featureArea =
      "Authentication";

    themes = [
      "Authentication",
    ];
  } else if (
    text.includes("notification")
  ) {
    featureArea =
      "Notifications";

    themes = [
      "Notifications",
    ];
  } else if (
    text.includes("payment") ||
    text.includes("billing")
  ) {
    featureArea =
      "Payments";

    themes = [
      "Payments",
    ];
  } else if (
    text.includes("support") ||
    text.includes("ticket")
  ) {
    featureArea =
      "Support";

    themes = [
      "Customer Support",
    ];
  } else if (
    text.includes("mobile") ||
    text.includes("phone")
  ) {
    featureArea =
      "Mobile App";

    themes = [
      "Mobile Experience",
    ];
  } else if (
    text.includes("slow") ||
    text.includes("performance") ||
    text.includes("loading")
  ) {
    featureArea =
      "Performance";

    themes = [
      "Performance",
    ];
  } else if (
    text.includes("interface") ||
    text.includes("ui") ||
    text.includes("design") ||
    text.includes("navigation")
  ) {
    featureArea =
      "UI/UX";

    themes = [
      "UI/UX",
    ];
  }

  const result = {
    sentiment,
    sentimentScore,
    themes,
    featureArea,
  };

  const validation =
    feedbackClassificationSchema.safeParse(
      result
    );

  if (!validation.success) {
    throw new Error(
      "Mock classification failed validation."
    );
  }

  return validation.data;
}

async function claudeClassifyFeedback(
  feedbackText: string
): Promise<FeedbackClassification> {
  const message =
    await anthropic.messages.create({
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

  const textBlock =
    message.content.find(
      (block) =>
        block.type === "text"
    );

  if (
    !textBlock ||
    textBlock.type !== "text"
  ) {
    throw new Error(
      "Claude did not return a text response."
    );
  }

  let parsedResponse: unknown;

  try {
    parsedResponse =
      JSON.parse(
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

export async function classifyFeedback(
  feedbackText: string
): Promise<FeedbackClassification> {
  if (!feedbackText.trim()) {
    throw new Error(
      "Feedback text cannot be empty."
    );
  }

  const useMockAI =
    process.env.USE_MOCK_AI === "true";

  if (useMockAI) {
    return mockClassifyFeedback(
      feedbackText
    );
  }

  return claudeClassifyFeedback(
    feedbackText
  );
}