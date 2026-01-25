import { z } from "zod";

/**
 * Schemat walidacji parametru URL dla DELETE /api/flashcards/{id}
 * Waliduje UUID flashcardy do usunięcia
 */
export const deleteFlashcardParamsSchema = z.object({
  id: z.string().uuid({ message: "Nieprawidłowy format ID fiszki" }),
});

/**
 * Typ dla parametrów URL endpointu DELETE flashcard
 */
export type DeleteFlashcardParams = z.infer<typeof deleteFlashcardParamsSchema>;
