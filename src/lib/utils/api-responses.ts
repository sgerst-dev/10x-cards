/**
 * Standardized API response utilities
 */

interface ApiErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Create standardized JSON response
 */
export function createJsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create error response
 */
export function createErrorResponse(error: string, message: string, status: number, details?: unknown): Response {
  const errorResponse: ApiErrorResponse = { error, message };

  if (details) {
    errorResponse.details = details;
  }

  return createJsonResponse(errorResponse, status);
}

/**
 * HTTP 400 - Bad Request
 */
export function badRequestResponse(message: string, details?: unknown): Response {
  return createErrorResponse("Bad Request", message, 400, details);
}

/**
 * HTTP 401 - Unauthorized
 */
export function unauthorizedResponse(message = "Wymagana prawidłowa autentykacja"): Response {
  return createErrorResponse("Unauthorized", message, 401);
}

/**
 * HTTP 409 - Conflict
 */
export function conflictResponse(message: string): Response {
  return createErrorResponse("Conflict", message, 409);
}

/**
 * HTTP 429 - Too Many Requests
 */
export function rateLimitResponse(message = "Przekroczono limit żądań. Spróbuj ponownie później."): Response {
  return createErrorResponse("Too Many Requests", message, 429);
}

/**
 * HTTP 502 - Bad Gateway
 */
export function badGatewayResponse(message = "Usługa zewnętrzna tymczasowo niedostępna"): Response {
  return createErrorResponse("Bad Gateway", message, 502);
}

/**
 * HTTP 404 - Not Found
 */
export function notFoundResponse(message = "Zasób nie został znaleziony"): Response {
  return createErrorResponse("Not Found", message, 404);
}

/**
 * HTTP 500 - Internal Server Error
 */
export function internalServerErrorResponse(message = "Wystąpił nieoczekiwany błąd"): Response {
  return createErrorResponse("Internal Server Error", message, 500);
}

/**
 * Create validation error response with detailed field errors
 */
export function validationErrorResponse(errors: ValidationErrorDetail[]): Response {
  return badRequestResponse("Nieprawidłowe dane wejściowe", errors);
}

/**
 * Parse JSON request body safely
 */
export async function parseJsonBody(
  request: Request
): Promise<{ success: true; data: unknown } | { success: false; response: Response }> {
  try {
    const data = await request.json();
    return { success: true, data };
  } catch {
    return {
      success: false,
      response: badRequestResponse("Nieprawidłowy format JSON w treści żądania"),
    };
  }
}
