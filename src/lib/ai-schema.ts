import { z } from "zod";

export const feedbackClassificationSchema = z.object({
  sentiment: z.enum([
    "POSITIVE",
    "NEUTRAL",
    "NEGATIVE",
  ]),

  sentimentScore: z
    .number()
    .min(-1)
    .max(1),

  themes: z
    .array(z.string().min(1))
    .min(1),

  featureArea: z
    .string()
    .min(1),
});

export type FeedbackClassification = z.infer<
  typeof feedbackClassificationSchema
>;