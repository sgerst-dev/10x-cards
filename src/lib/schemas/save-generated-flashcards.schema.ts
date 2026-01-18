import { z } from "zod";

/**
 * Schemat walidacji dla SaveGeneratedFlashcardsCommand
 */
export const saveGeneratedFlashcardsSchema = z.object({
  generation_id: z.string().uuid("Generation id must be a valid UUID"),
  flashcards: z
    .array(
      z.object({
        front: z
          .string()
          .min(1, "Front text is required")
          .max(250, "Front text exceeds maximum length of 250 characters")
          .transform((text) => text.trim()),
        back: z
          .string()
          .min(1, "Back text is required")
          .max(500, "Back text exceeds maximum length of 500 characters")
          .transform((text) => text.trim()),
        source: z.enum(["ai_generated", "ai_edited"]),
      })
    )
    .min(1, "At least one flashcard must be provided"),
});

export type SaveGeneratedFlashcardsInput = z.infer<typeof saveGeneratedFlashcardsSchema>;
