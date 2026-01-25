import { z } from "zod";

/**
 * Schemat walidacji dla SaveGeneratedFlashcardsCommand
 */
export const saveGeneratedFlashcardsSchema = z.object({
  generation_id: z.string().uuid("ID generacji musi być prawidłowym UUID"),
  flashcards: z
    .array(
      z.object({
        front: z
          .string()
          .min(1, "Tekst na przedniej stronie fiszki jest wymagany")
          .max(250, "Tekst na przedniej stronie fiszki przekracza maksymalną długość 250 znaków")
          .transform((text) => text.trim()),
        back: z
          .string()
          .min(1, "Tekst na tylnej stronie fiszki jest wymagany")
          .max(500, "Tekst na tylnej stronie fiszki przekracza maksymalną długość 500 znaków")
          .transform((text) => text.trim()),
        source: z.enum(["ai_generated", "ai_edited"]),
      })
    )
    .min(1, "Należy podać co najmniej jedną fiszkę"),
});

export type SaveGeneratedFlashcardsInput = z.infer<typeof saveGeneratedFlashcardsSchema>;
