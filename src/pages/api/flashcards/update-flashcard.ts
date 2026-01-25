import type { APIRoute } from "astro";
import { updateFlashcardSchema, updateFlashcardParamsSchema } from "../../../lib/schemas/update-flashcard.schema";
import { FlashcardService, type FlashcardServiceError } from "../../../lib/services/flashcard.service";
import {
  createJsonResponse,
  parseJsonBody,
  validationErrorResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "../../../lib/utils/api-responses";

export const prerender = false;

/**
 * PUT /api/flashcards/{id}
 * Aktualizuje istniejącą flashcard użytkownika
 */
export const PUT: APIRoute = async ({ request, locals, params }) => {
  try {
    const user = locals.user;

    if (!user?.id) {
      return unauthorizedResponse();
    }

    const params_validation = updateFlashcardParamsSchema.safeParse({ id: params.id });

    if (!params_validation.success) {
      const validation_errors = params_validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return validationErrorResponse(validation_errors);
    }

    const flashcard_id = params_validation.data.id;

    const body_result = await parseJsonBody(request);

    if (!body_result.success) {
      return body_result.response;
    }

    const body_validation = updateFlashcardSchema.safeParse(body_result.data);

    if (!body_validation.success) {
      const validation_errors = body_validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return validationErrorResponse(validation_errors);
    }

    const flashcard_service = new FlashcardService(locals.supabase, user.id);

    try {
      const updated_flashcard = await flashcard_service.updateFlashcard(flashcard_id, body_validation.data);

      return createJsonResponse(updated_flashcard, 200);
    } catch (error) {
      // Obsługa błędów z serwisu
      const service_error = error as FlashcardServiceError;

      if (service_error.code === 404) {
        return notFoundResponse("Fiszka nie została znaleziona");
      }

      return internalServerErrorResponse();
    }
  } catch {
    return internalServerErrorResponse();
  }
};
