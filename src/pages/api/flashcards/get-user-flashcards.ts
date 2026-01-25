import type { APIRoute } from "astro";
import { getFlashcardsQuerySchema } from "../../../lib/schemas/get-flashcards.schema";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import {
  createJsonResponse,
  validationErrorResponse,
  unauthorizedResponse,
  internalServerErrorResponse,
} from "../../../lib/utils/api-responses";

export const prerender = false;

/**
 * GET /api/flashcards
 *
 * Pobiera paginowaną listę flashcards należących do zalogowanego użytkownika.
 * Flashcards są sortowane od najnowszych (created_at DESC).
 *
 * Query Parameters:
 * - page (opcjonalne, domyślnie 1): numer strony
 * - limit (opcjonalne, domyślnie 20): liczba elementów na stronę (1-100)
 *
 * Responses:
 * - 200: sukces - zwraca flashcards z metadanymi paginacji
 * - 400: niepoprawne parametry paginacji
 * - 401: brak autentykacji użytkownika
 * - 500: błąd serwera
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Autentykacja - sprawdzenie czy użytkownik jest zalogowany
    const user = locals.user;

    if (!user?.id) {
      return unauthorizedResponse("Wymagana autentykacja");
    }

    // Parsowanie i walidacja query parameters
    const page_param = url.searchParams.get("page") || undefined;
    const limit_param = url.searchParams.get("limit") || undefined;

    const validation_result = getFlashcardsQuerySchema.safeParse({
      page: page_param,
      limit: limit_param,
    });

    if (!validation_result.success) {
      const validation_errors = validation_result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return validationErrorResponse(validation_errors);
    }

    const { page, limit } = validation_result.data;

    // Wywołanie metody Service
    const flashcard_service = new FlashcardService(locals.supabase, user.id);
    const response = await flashcard_service.getUserFlashcards(page, limit);

    return createJsonResponse(response, 200);
  } catch {
    return internalServerErrorResponse("Błąd serwera");
  }
};
