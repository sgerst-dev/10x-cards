import type { ChatCompletionParams } from "./types/openrouter.types";
import { logError, logDebug } from "../utils/logger";

export interface OpenRouterServiceConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  siteUrl?: string;
  siteName?: string;
}

export class OpenRouterServiceError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterServiceError";
  }
}

export class OpenRouterConfigurationError extends OpenRouterServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
    this.name = "OpenRouterConfigurationError";
  }
}

export class OpenRouterAuthorizationError extends OpenRouterServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 401, details);
    this.name = "OpenRouterAuthorizationError";
  }
}

export class OpenRouterRateLimitError extends OpenRouterServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 429, details);
    this.name = "OpenRouterRateLimitError";
  }
}

export class OpenRouterModelError extends OpenRouterServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 500, details);
    this.name = "OpenRouterModelError";
  }
}

export class OpenRouterParseError extends OpenRouterServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 422, details);
    this.name = "OpenRouterParseError";
  }
}

export class OpenRouterValidationError extends OpenRouterServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 422, details);
    this.name = "OpenRouterValidationError";
  }
}

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly siteUrl: string;

  constructor() {
    const apiKey = import.meta.env.OPEN_ROUTER_API_KEY;
    if (!apiKey) {
      throw new OpenRouterConfigurationError("OpenRouter API key is missing in configuration.");
    }

    const model = import.meta.env.OPEN_ROUTER_MODEL;
    if (!model) {
      throw new OpenRouterConfigurationError("Default model for OpenRouter is not configured.");
    }

    this.apiKey = apiKey;
    this.baseUrl = "https://openrouter.ai/api/v1";
    this.model = model;
    this.siteUrl = import.meta.env.SITE_URL || "localhost";
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": this.siteUrl,
      "X-Title": "10x-cards",
    };
  }

  private async handleResponse(response: Response): Promise<Response> {
    if (response.ok) {
      return response;
    }

    const fallbackBody = await response.text().catch(() => "");

    // Sanitized details for logging - never expose API keys or sensitive data
    const details = {
      status: response.status,
      statusText: response.statusText,
      // Only include body if it's not too large and doesn't contain sensitive info
      bodyPreview: fallbackBody ? fallbackBody.substring(0, 200) : undefined,
    };

    logError("OpenRouterService: API error response", undefined, details);

    // Generic error messages - detailed info only in server logs
    if (response.status === 400) {
      throw new OpenRouterConfigurationError("OpenRouter API configuration error.", details);
    }

    if (response.status === 401) {
      throw new OpenRouterAuthorizationError("OpenRouter API authorization failed.", details);
    }

    if (response.status === 402 || response.status === 429) {
      throw new OpenRouterRateLimitError("OpenRouter API rate limit or credit limit exceeded.", details);
    }

    if (response.status === 500 || response.status === 503) {
      throw new OpenRouterModelError("OpenRouter API service unavailable.", details);
    }

    throw new OpenRouterServiceError("OpenRouter API request failed.", response.status, details);
  }

  public async chatCompletion<T = string>(params: ChatCompletionParams): Promise<T> {
    const endpoint = `${this.baseUrl}/chat/completions`;

    const requestBody = {
      model: this.model,
      messages: params.messages,
      ...(params.response_format && { response_format: params.response_format }),
      ...(params.temperature !== undefined && { temperature: params.temperature }),
      ...(params.max_tokens !== undefined && { max_tokens: params.max_tokens }),
      ...(params.top_p !== undefined && { top_p: params.top_p }),
    };

    logDebug("OpenRouterService: Sending request", {
      model: this.model,
      endpoint,
      messagesCount: params.messages.length,
      hasResponseFormat: !!params.response_format,
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    });

    logDebug("OpenRouterService: Received response", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    const validatedResponse = await this.handleResponse(response);
    const data = await validatedResponse.json();

    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      const errorContext = {
        hasChoices: !!data.choices,
        isArray: Array.isArray(data.choices),
        choicesLength: Array.isArray(data.choices) ? data.choices.length : 0,
      };

      logError("OpenRouterService: Invalid response structure", undefined, errorContext);

      throw new OpenRouterModelError("OpenRouter API returned invalid response structure.", errorContext);
    }

    const content = data.choices[0]?.message?.content;

    if (content === undefined || content === null) {
      const errorContext = {
        hasMessage: !!data.choices[0]?.message,
        contentType: typeof content,
      };

      logError("OpenRouterService: Empty content in response", undefined, errorContext);

      throw new OpenRouterModelError("OpenRouter API returned empty content.", errorContext);
    }

    logDebug("OpenRouterService: Successfully received content", {
      contentLength: content.length,
      needsJsonParsing: !!params.response_format,
    });

    if (params.response_format) {
      return this.parseAndValidateJSON<T>(content);
    }

    return content as T;
  }

  private parseAndValidateJSON<T>(content: string): T {
    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch (error) {
      const errorContext = {
        contentLength: content.length,
        contentPreview: content.substring(0, 100),
        error: error instanceof Error ? error.message : String(error),
      };

      logError("OpenRouterService: JSON parse error", error, errorContext);

      throw new OpenRouterParseError("Failed to parse JSON response from OpenRouter.", errorContext);
    }

    if (typeof parsed !== "object" || parsed === null) {
      const errorContext = {
        receivedType: typeof parsed,
      };

      logError("OpenRouterService: JSON validation error", undefined, errorContext);

      throw new OpenRouterValidationError("Parsed JSON is not a valid object.", errorContext);
    }

    return parsed as T;
  }
}
