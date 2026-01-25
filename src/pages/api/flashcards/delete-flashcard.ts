import type { APIRoute } from "astro";
import { deleteFlashcardParamsSchema } from "../../../lib/schemas/delete-flashcard.schema";
import { FlashcardService, type FlashcardServiceError } from "../../../lib/services/flashcard.service";
import {
  validationErrorResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "../../../lib/utils/api-responses";

export const prerender = false;

/**
 * DELETE /api/flashcards/delete-flashcard?id={id}
 * Usuwa flashcard użytkownika (hard delete)
 */
export const DELETE: APIRoute = async ({ locals, url }) => {
  try {
    const user = locals.user;

    if (!user?.id) {
      return unauthorizedResponse();
    }

    const id = url.searchParams.get("id");
    const params_validation = deleteFlashcardParamsSchema.safeParse({ id });

    if (!params_validation.success) {
      const validation_errors = params_validation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return validationErrorResponse(validation_errors);
    }

    const flashcard_id = params_validation.data.id;

    const flashcard_service = new FlashcardService(locals.supabase, user.id);

    try {
      await flashcard_service.deleteFlashcard(flashcard_id);

      return new Response(null, { status: 200 });
    } catch (error) {
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
