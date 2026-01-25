import type { APIRoute } from "astro";
import { createFlashcardSchema } from "../../../lib/schemas/create-flashcard.schema";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import {
  createJsonResponse,
  parseJsonBody,
  validationErrorResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from "../../../lib/utils/api-responses";

export const prerender = false;

/**
 * POST /api/flashcards
 * Tworzy nową flashcard utworzoną ręcznie przez użytkownika
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user;

    if (!user?.id) {
      return unauthorizedResponse();
    }

    const body_result = await parseJsonBody(request);

    if (!body_result.success) {
      return body_result.response;
    }

    const validation_result = createFlashcardSchema.safeParse(body_result.data);

    if (!validation_result.success) {
      const validation_errors = validation_result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return validationErrorResponse(validation_errors);
    }

    const flashcard_service = new FlashcardService(locals.supabase, user.id);

    try {
      const flashcard = await flashcard_service.createFlashcard(validation_result.data);

      return createJsonResponse(flashcard, 201);
    } catch {
      return internalServerErrorResponse();
    }
  } catch {
    return internalServerErrorResponse();
  }
};
