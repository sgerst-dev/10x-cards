import { z } from "zod";

/**
 * Schemat walidacji dla CreateFlashcardCommand
 */
export const createFlashcardSchema = z.object({
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
});

export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
