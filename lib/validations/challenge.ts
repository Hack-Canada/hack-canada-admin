import { z } from "zod";

export const challengeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  points: z.number().min(0),
  difficulty: z.enum(["easy", "medium", "hard"]),
  shortDescription: z.string().min(1, "Short description is required"),
  instructions: z.string().min(1, "Instructions are required"),
  hints: z.array(z.string()),
  qrCode: z.boolean().default(false),
  submissionInstructions: z
    .string()
    .min(1, "Submission instructions are required"),
  maxCompletions: z.number().nullable().optional(),
  enabled: z.boolean().default(true),
});

export type ChallengeInput = z.infer<typeof challengeSchema>;
