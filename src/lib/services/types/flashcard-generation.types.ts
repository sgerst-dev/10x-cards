import type { ResponseFormat } from "./openrouter.types";

/**
 * JSON Schema for flashcard generation response
 */
export const FLASHCARD_GENERATION_JSON_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "flashcard_schema",
    strict: true,
    schema: {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: { type: "string" },
              back: { type: "string" },
            },
            required: ["front", "back"] as string[],
            additionalProperties: false,
          },
        },
      },
      required: ["flashcards"] as string[],
      additionalProperties: false,
    },
  },
} satisfies ResponseFormat;

/**
 * Configuration for flashcard generation AI request
 */
export const FLASHCARD_GENERATION_CONFIG = {
  temperature: 0.7,
  max_tokens: 5000,
} as const;

/**
 * User prompt template for flashcard generation
 */
export const createFlashcardGenerationPrompt = (source_text: string) => {
  return `Wygeneruj fiszki tylko i wyłącznie na podstawie poniższego tekstu. Gdy tekst nie ma sensu, zwróć pustą tablicę fiszek. \n\n${source_text}`;
};
