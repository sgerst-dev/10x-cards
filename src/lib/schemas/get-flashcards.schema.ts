import { z } from "zod";

/**
 * Schema walidacji query parameters dla GET /api/flashcards
 *
 * Waliduje parametry paginacji:
 * - page: numer strony (opcjonalne, domyślnie 1, minimum 1)
 * - limit: liczba elementów na stronę (opcjonalne, domyślnie 20, zakres 1-100)
 */
export const getFlashcardsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, { message: "Numer strony musi być większy lub równy 1" })),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(
      z
        .number()
        .int()
        .min(1, { message: "Limit musi być w zakresie od 1 do 100" })
        .max(100, { message: "Limit musi być w zakresie od 1 do 100" })
    ),
});

export type GetFlashcardsQuerySchema = z.infer<typeof getFlashcardsQuerySchema>;
