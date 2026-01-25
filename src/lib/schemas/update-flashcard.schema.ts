import { z } from "zod";

/**
 * Schemat walidacji dla UpdateFlashcardCommand (request body)
 */
export const updateFlashcardSchema = z.object({
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

/**
 * Schemat walidacji dla parametru URL {id}
 */
export const updateFlashcardParamsSchema = z.object({
  id: z.string().uuid("Nieprawidłowy format ID fiszki"),
});

export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
export type UpdateFlashcardParams = z.infer<typeof updateFlashcardParamsSchema>;
