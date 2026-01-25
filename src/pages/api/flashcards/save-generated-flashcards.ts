import type { APIRoute } from "astro";
import { saveGeneratedFlashcardsSchema } from "../../../lib/schemas/save-generated-flashcards.schema";
import { FlashcardService, type FlashcardServiceError } from "../../../lib/services/flashcard.service";
import {
  createJsonResponse,
  parseJsonBody,
  validationErrorResponse,
  badRequestResponse,
  notFoundResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from "../../../lib/utils/api-responses";

export const prerender = false;

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

    const validation_result = saveGeneratedFlashcardsSchema.safeParse(body_result.data);

    if (!validation_result.success) {
      const validation_errors = validation_result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return validationErrorResponse(validation_errors);
    }

    const flashcard_service = new FlashcardService(locals.supabase, user.id);

    try {
      const { generation_id, flashcards } = validation_result.data;

      // saveGeneratedFlashcards uses a stored procedure that handles everything in a single transaction:
      // - Verifies generation session ownership
      // - Inserts flashcards
      // - Updates generation session with accepted counts
      const response = await flashcard_service.saveGeneratedFlashcards(generation_id, flashcards);

      return createJsonResponse(response, 201);
    } catch (service_error) {
      const error = service_error as FlashcardServiceError;

      if (error.code === 400) {
        return badRequestResponse(error.message);
      }

      if (error.code === 404) {
        return notFoundResponse(error.message);
      }

      return internalServerErrorResponse();
    }
  } catch {
    return internalServerErrorResponse();
  }
};
