import { z } from "zod";

/**
 * Schemat walidacji dla GenerateFlashcardsProposalsCommand
 */
export const generateFlashcardsProposalsSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Tekst źródłowy musi zawierać co najmniej 1000 znaków")
    .max(10000, "Tekst źródłowy nie może przekraczać 10000 znaków")
    .transform((text) => text.trim()),
});

export type GenerateFlashcardsProposalsInput = z.infer<typeof generateFlashcardsProposalsSchema>;

// Extract just the source_text field for service usage
export type SourceTextInput = GenerateFlashcardsProposalsInput["source_text"];
