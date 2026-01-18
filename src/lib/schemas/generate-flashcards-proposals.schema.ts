import { z } from "zod";

/**
 * Schemat walidacji dla GenerateFlashcardsProposalsCommand
 */
export const generateFlashcardsProposalsSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1000 characters long")
    .max(10000, "Source text cannot exceed 10000 characters")
    .transform((text) => text.trim()),
});

export type GenerateFlashcardsProposalsInput = z.infer<typeof generateFlashcardsProposalsSchema>;

// Extract just the source_text field for service usage
export type SourceTextInput = GenerateFlashcardsProposalsInput["source_text"];
