import type { APIRoute } from "astro";
import { generateFlashcardsProposalsSchema } from "../../../lib/schemas/generate-flashcards-proposals.schema";
import { FlashcardGenerationService } from "../../../lib/services/flashcard-generation.service";
import {
  createJsonResponse,
  parseJsonBody,
  validationErrorResponse,
  internalServerErrorResponse,
} from "../../../lib/utils/api-responses";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    /* Commented out for now to use hardcoded user
    const {
      data: { user },
      error: auth_error,
    } = await locals.supabase.auth.getUser();

    if (auth_error || !user?.id) {
      return unauthorizedResponse();
    }

    const user = locals.user;

    if (!user?.id) {
      return unauthorizedResponse();
    }
    */
    const userId = "a75588eb-b803-4f82-9599-c9b2fed24cda";

    const body_result = await parseJsonBody(request);

    if (!body_result.success) {
      return body_result.response;
    }

    const validation_result = generateFlashcardsProposalsSchema.safeParse(body_result.data);

    if (!validation_result.success) {
      const validation_errors = validation_result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return validationErrorResponse(validation_errors);
    }

    const generation_service = new FlashcardGenerationService(locals.supabase, userId);

    const response = await generation_service.generateFlashcardProposals(validation_result.data.source_text);

    return createJsonResponse(response);
  } catch {
    // Always return the same generic error message to users
    // This prevents any information leakage about internal errors, API issues, or system state
    return internalServerErrorResponse("Nie udało się wygenerować fiszek. Spróbuj ponownie.");
  }
};
