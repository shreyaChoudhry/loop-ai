
import Anthropic from "@anthropic-ai/sdk";

let anthropic: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (anthropic) {
    return anthropic;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Set it to use real AI classification."
    );
  }

  anthropic = new Anthropic({ apiKey });

  return anthropic;
}

export default getAnthropicClient;
