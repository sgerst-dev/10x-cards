import type { APIRoute } from "astro";
import { generateFlashcardsProposalsSchema } from "../../../lib/schemas/generate-flashcards-proposals.schema";
import { FlashcardGenerationService } from "../../../lib/services/flashcard-generation.service";
import {
  createJsonResponse,
  parseJsonBody,
  validationErrorResponse,
  internalServerErrorResponse,
  unauthorizedResponse,
} from "../../../lib/utils/api-responses";
import { logError } from "../../../lib/utils/logger";

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

    const validation_result = generateFlashcardsProposalsSchema.safeParse(body_result.data);

    if (!validation_result.success) {
      const validation_errors = validation_result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return validationErrorResponse(validation_errors);
    }

    const generation_service = new FlashcardGenerationService(locals.supabase, user.id);

    const response = await generation_service.generateFlashcardProposals(validation_result.data.source_text);

    return createJsonResponse(response);
  } catch (error) {
    const isDebugMode = true;

    // Log detailed error for debugging (server-side only)
    logError("generate-flashcards-proposals: Error occurred", error, {
      timestamp: new Date().toISOString(),
    });

    // Return user-friendly error messages based on error type
    if (error instanceof Error) {
      let userMessage = "";
      let debugInfo = "";

      // Check for specific error types and provide appropriate messages
      if (error.name === "OpenRouterConfigurationError") {
        userMessage = "Wystąpił problem z konfiguracją. Skontaktuj się z administratorem.";
        debugInfo = isDebugMode ? `[DEBUG] ${error.name}: ${error.message}` : "";
      } else if (error.name === "OpenRouterAuthorizationError") {
        userMessage = "Wystąpił problem z autoryzacją usługi AI. Skontaktuj się z administratorem.";
        debugInfo = isDebugMode ? `[DEBUG] ${error.name}: ${error.message}` : "";
      } else if (error.name === "OpenRouterRateLimitError") {
        userMessage = "Osiągnięto limit zapytań do usługi AI. Spróbuj ponownie za chwilę.";
        debugInfo = isDebugMode ? `[DEBUG] ${error.name}: ${error.message}` : "";
      } else if (error.name === "OpenRouterModelError") {
        userMessage = "Usługa AI jest tymczasowo niedostępna. Spróbuj ponownie za chwilę.";
        debugInfo = isDebugMode ? `[DEBUG] ${error.name}: ${error.message}` : "";
      } else if (error.name === "OpenRouterParseError" || error.name === "OpenRouterValidationError") {
        userMessage = "Otrzymano nieprawidłową odpowiedź z usługi AI. Spróbuj ponownie.";
        debugInfo = isDebugMode ? `[DEBUG] ${error.name}: ${error.message}` : "";
      } else {
        userMessage = "Nie udało się wygenerować fiszek. Spróbuj ponownie.";
        debugInfo = isDebugMode ? `[DEBUG] ${error.name}: ${error.message}` : "";
      }

      const finalMessage = debugInfo ? `${userMessage}\n\n${debugInfo}` : userMessage;
      return internalServerErrorResponse(finalMessage);
    }

    // Generic fallback error message
    return internalServerErrorResponse("Nie udało się wygenerować fiszek. Spróbuj ponownie.");
  }
};
